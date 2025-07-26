import { NextResponse } from "next/server"
import { testMongoConnection, getConnectionHealth } from "@/lib/mongodb"
import dns from 'dns'
import { promisify } from 'util'

const resolveSrv = promisify(dns.resolveSrv)

// Test DNS resolution for MongoDB Atlas
async function testDNSResolution() {
  try {
    if (!process.env.MONGODB_URI) {
      return { success: false, error: "MONGODB_URI not configured" }
    }

    // Extract hostname from MongoDB URI
    const match = process.env.MONGODB_URI.match(/@([^/]+)/)
    if (!match) {
      return { success: false, error: "Could not extract hostname from MONGODB_URI" }
    }

    const hostname = match[1]
    console.log(`🔍 Testing DNS resolution for: ${hostname}`)
    
    const startTime = Date.now()
    
    // Test SRV record resolution (used by MongoDB Atlas)
    if (hostname.includes('mongodb.net')) {
      const srvHostname = `_mongodb._tcp.${hostname}`
      const srvRecords = await Promise.race([
        resolveSrv(srvHostname),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DNS resolution timeout')), 8000)
        )
      ])
      
      const duration = Date.now() - startTime
      console.log(`✅ DNS SRV resolution successful: ${srvRecords.length} records (${duration}ms)`)
      
      return {
        success: true,
        hostname: srvHostname,
        recordCount: srvRecords.length,
        duration,
        records: srvRecords.slice(0, 3) // First 3 records for debugging
      }
    } else {
      // Test regular A record resolution
      const addresses = await Promise.race([
        dns.promises.resolve(hostname),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DNS resolution timeout')), 8000)
        )
      ])
      
      const duration = Date.now() - startTime
      console.log(`✅ DNS A record resolution successful: ${addresses.length} addresses (${duration}ms)`)
      
      return {
        success: true,
        hostname,
        addressCount: addresses.length,
        duration,
        addresses: addresses.slice(0, 3) // First 3 addresses for debugging
      }
    }
  } catch (error) {
    console.error(`❌ DNS resolution failed:`, error.message)
    return {
      success: false,
      error: error.message,
      code: error.code
    }
  }
}

export async function GET() {
  try {
    const startTime = Date.now()
    
    console.log("🏥 Starting comprehensive health check...")
    
    // Test DNS resolution first
    console.log("🔍 Testing DNS resolution...")
    const dnsTest = await testDNSResolution()
    
    // Test MongoDB connection
    console.log("🔍 Testing MongoDB connection...")
    const mongoTest = await testMongoConnection()
    
    // Get connection health info
    const connectionHealth = await getConnectionHealth()
    
    const totalDuration = Date.now() - startTime
    
    const health = {
      status: mongoTest.success ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        dns: {
          status: dnsTest.success ? "resolved" : "failed",
          hostname: dnsTest.hostname || null,
          duration: dnsTest.duration || null,
          error: dnsTest.error || null,
          details: dnsTest.success ? {
            recordCount: dnsTest.recordCount || dnsTest.addressCount,
            records: dnsTest.records || dnsTest.addresses
          } : null
        },
        mongodb: {
          status: mongoTest.success ? "connected" : "disconnected",
          connectionState: connectionHealth.state,
          error: mongoTest.error || null,
          responseTime: mongoTest.duration || null,
          configured: connectionHealth.uri === "configured"
        },
        api: {
          status: "running",
          responseTime: totalDuration
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || "unknown",
        hasMongoUri: !!process.env.MONGODB_URI,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasGeminiKey: !!process.env.GEMINI_API_KEY
      },
      troubleshooting: getDiagnosticInfo(dnsTest, mongoTest),
      version: "1.0.0"
    }

    // Return 503 if MongoDB is down, 200 if healthy
    const statusCode = mongoTest.success ? 200 : 503
    
    console.log(`🏥 Health check completed: ${health.status} (${totalDuration}ms)`)
    
    return NextResponse.json(health, { status: statusCode })
    
  } catch (error) {
    console.error("❌ Health check failed:", error)
    
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        dns: {
          status: "unknown",
          error: "Health check failed before DNS test"
        },
        mongodb: {
          status: "unknown",
          error: "Health check failed before MongoDB test"
        },
        api: {
          status: "error",
          error: error.message
        }
      },
      troubleshooting: {
        recommendation: "Health check service encountered an error",
        possibleCauses: ["Server configuration issue", "Resource exhaustion", "Code error"],
        nextSteps: ["Check server logs", "Restart the application", "Contact system administrator"]
      }
    }, { status: 500 })
  }
}

function getDiagnosticInfo(dnsTest, mongoTest) {
  const diagnostics = {
    recommendation: null,
    possibleCauses: [],
    nextSteps: []
  }

  if (!dnsTest.success) {
    diagnostics.recommendation = "DNS resolution failed - network connectivity issue"
    diagnostics.possibleCauses = [
      "Internet connection problems",
      "DNS server issues", 
      "Firewall blocking DNS queries",
      "Corporate network restrictions",
      "MongoDB Atlas cluster hostname changed"
    ]
    diagnostics.nextSteps = [
      "Check internet connectivity",
      "Try using a different DNS server (8.8.8.8, 1.1.1.1)",
      "Check firewall settings",
      "Contact network administrator",
      "Verify MongoDB URI is correct"
    ]
  } else if (!mongoTest.success) {
    if (mongoTest.error?.includes('timeout') || mongoTest.error?.includes('ETIMEDOUT')) {
      diagnostics.recommendation = "MongoDB connection timeout - likely network or authentication issue"
      diagnostics.possibleCauses = [
        "IP address not whitelisted in MongoDB Atlas",
        "Network firewall blocking port 27017",
        "MongoDB cluster is overloaded or down",
        "Incorrect authentication credentials",
        "Connection string is malformed"
      ]
      diagnostics.nextSteps = [
        "Add your current IP to MongoDB Atlas whitelist",
        "Check firewall settings for port 27017",
        "Verify MongoDB URI format and credentials",
        "Try connecting from a different network",
        "Check MongoDB Atlas cluster status"
      ]
    } else if (mongoTest.error?.includes('authentication')) {
      diagnostics.recommendation = "MongoDB authentication failed"
      diagnostics.possibleCauses = [
        "Incorrect username or password",
        "Database user doesn't exist",
        "User doesn't have required permissions",
        "Connection string is malformed"
      ]
      diagnostics.nextSteps = [
        "Verify username and password in MONGODB_URI",
        "Check database user exists in MongoDB Atlas",
        "Verify user has read/write permissions",
        "Test connection string format"
      ]
    } else {
      diagnostics.recommendation = "MongoDB connection failed for unknown reason"
      diagnostics.possibleCauses = [
        "MongoDB service is down",
        "Network connectivity issues",
        "Server configuration problems",
        "Resource exhaustion"
      ]
      diagnostics.nextSteps = [
        "Check MongoDB Atlas cluster status",
        "Verify environment variables are set",
        "Check server logs for detailed errors",
        "Try restarting the application"
      ]
    }
  } else {
    diagnostics.recommendation = "All services are healthy"
    diagnostics.possibleCauses = []
    diagnostics.nextSteps = ["System is operating normally"]
  }

  return diagnostics
}
