/**
 * MongoDB Connection Diagnosis Script
 * 
 * This script helps diagnose the specific MongoDB timeout issue you're experiencing.
 * Run with: node test-mongodb-diagnosis.mjs
 */

import { connectToDatabase, testMongoConnection } from "./lib/mongodb.js";
import dns from 'dns';
import { promisify } from 'util';

const resolveSrv = promisify(dns.resolveSrv);

console.log("🔍 MongoDB Connection Diagnosis for ETIMEOUT Error");
console.log("================================================\n");

// Check environment variables
console.log("📋 Environment Check:");
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? "✅ Set" : "❌ Not set"}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log("");

if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is not set!");
  console.log("\n📝 To fix this, create a .env.local file with:");
  console.log("MONGODB_URI=mongodb+srv://username:password@cluster0.gjsxg.mongodb.net/llmfied?retryWrites=true&w=majority");
  process.exit(1);
}

// Extract connection details
const uri = process.env.MONGODB_URI;
const clusterMatch = uri.match(/@([^/]+)/);
const cluster = clusterMatch ? clusterMatch[1] : "unknown";

console.log("🔗 Connection Details:");
console.log(`   Cluster: ${cluster}`);
console.log(`   Database: ${uri.includes('/llmfied') ? 'llmfied' : 'default'}`);
console.log("");

async function runDiagnosis() {
  // Test 1: DNS Resolution
  console.log("🧪 Test 1: DNS Resolution for MongoDB Atlas");
  console.log("-------------------------------------------");
  
  try {
    const srvHostname = `_mongodb._tcp.${cluster}`;
    console.log(`🔍 Resolving SRV record: ${srvHostname}`);
    
    const startTime = Date.now();
    const srvRecords = await Promise.race([
      resolveSrv(srvHostname),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DNS resolution timeout (8s)')), 8000)
      )
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`✅ DNS resolution successful: ${srvRecords.length} records (${duration}ms)`);
    console.log(`📍 Server locations found:`);
    srvRecords.forEach((record, i) => {
      console.log(`   ${i + 1}. ${record.name}:${record.port} (priority: ${record.priority})`);
    });
  } catch (error) {
    console.log(`❌ DNS resolution failed: ${error.message}`);
    console.log("💡 This suggests network connectivity issues or DNS problems");
  }
  
  console.log("");
  
  // Test 2: Basic MongoDB Connection
  console.log("🧪 Test 2: MongoDB Connection Test");
  console.log("----------------------------------");
  
  try {
    const startTime = Date.now();
    const result = await testMongoConnection();
    const duration = Date.now() - startTime;
    
    if (result.success) {
      console.log(`✅ MongoDB connection successful (${duration}ms)`);
    } else {
      console.log(`❌ MongoDB connection failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ MongoDB connection error: ${error.message}`);
  }
  
  console.log("");
  
  // Test 3: Full Database Operation with Extended Timeout
  console.log("🧪 Test 3: Extended Timeout Database Test");
  console.log("-----------------------------------------");
  
  try {
    console.log("🔄 Attempting connection with 20 second timeout...");
    const startTime = Date.now();
    
    const { db } = await Promise.race([
      connectToDatabase(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Extended timeout (20s)')), 20000)
      )
    ]);
    
    const connectionDuration = Date.now() - startTime;
    console.log(`✅ Extended connection successful (${connectionDuration}ms)`);
    
    // Test database operations
    const opStartTime = Date.now();
    const collections = await db.listCollections().toArray();
    const opDuration = Date.now() - opStartTime;
    
    console.log(`✅ Database operations successful (${opDuration}ms)`);
    console.log(`📊 Found ${collections.length} collections`);
    
    if (collections.length > 0) {
      console.log("📁 Collections found:");
      collections.forEach(col => console.log(`   - ${col.name}`));
    }
    
  } catch (error) {
    console.log(`❌ Extended timeout test failed: ${error.message}`);
    
    if (error.message.includes('ETIMEOUT') || error.message.includes('timeout')) {
      console.log("\n🚨 DIAGNOSIS: Network Timeout Issue Detected");
      console.log("=============================================");
      console.log("This error suggests one of the following issues:");
      console.log("");
      console.log("1. 🌐 Network Connectivity:");
      console.log("   - Your internet connection may be unstable");
      console.log("   - Corporate firewall blocking MongoDB ports (27017-27019)");
      console.log("   - VPN interference with database connections");
      console.log("");
      console.log("2. 🔒 MongoDB Atlas Configuration:");
      console.log("   - Your IP address is not whitelisted in MongoDB Atlas");
      console.log("   - To fix: Go to MongoDB Atlas → Network Access → Add IP Address");
      console.log("   - Add your current IP or use 0.0.0.0/0 for testing (not recommended for production)");
      console.log("");
      console.log("3. 🏢 MongoDB Atlas Cluster Issues:");
      console.log("   - The cluster may be overloaded or experiencing downtime");
      console.log("   - Check MongoDB Atlas status page");
      console.log("   - Try again in a few minutes");
      console.log("");
      console.log("4. 🔧 Connection String Issues:");
      console.log("   - Verify your MongoDB connection string is correct");
      console.log("   - Ensure username/password are properly URL-encoded");
      console.log("   - Check if the database name is correct");
      console.log("");
      console.log("🔧 Immediate Actions to Try:");
      console.log("1. Check your current IP: https://whatismyipaddress.com/");
      console.log("2. Add your IP to MongoDB Atlas Network Access");
      console.log("3. Try connecting from a different network");
      console.log("4. Restart your router/modem");
      console.log("5. Temporarily disable VPN if using one");
    }
  }
  
  console.log("");
  console.log("🏁 Diagnosis Complete");
  console.log("====================");
  console.log("If the issue persists, please:");
  console.log("1. Check MongoDB Atlas Network Access settings");
  console.log("2. Verify your internet connection stability");
  console.log("3. Contact your network administrator if on corporate network");
}

// Run the diagnosis
runDiagnosis().catch(console.error);