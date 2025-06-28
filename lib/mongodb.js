import { MongoClient } from "mongodb"

if (!process.env.MONGODB_URI) {
  console.error("⚠️  MONGODB_URI environment variable is not set!")
  console.log("Please set your MongoDB connection string in your .env.local file:")
  console.log("For local development: MONGODB_URI=mongodb://localhost:27017/ai-tutor-platform")
  console.log("For MongoDB Atlas: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database")
}

const uri = process.env.MONGODB_URI
const options = {
  // Connection timeouts - increased for better reliability
  connectTimeoutMS: 30000,       // Connection timeout (30 seconds)
  serverSelectionTimeoutMS: 30000, // Server selection timeout (30 seconds)
  socketTimeoutMS: 45000,        // Socket timeout (45 seconds)
  
  // Connection pool settings
  maxPoolSize: 10,               // Maximum number of connections
  minPoolSize: 2,                // Minimum number of connections
  maxIdleTimeMS: 30000,          // Close connections after inactivity
  
  // Retry settings
  retryWrites: true,
  retryReads: true,
  
  // Additional stability options
  heartbeatFrequencyMS: 10000,   // Heartbeat frequency
  appName: "LLMFied-Platform",   // Application name for monitoring
  
  // TLS/SSL settings for Atlas
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false
}

let client
let clientPromise

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    console.log("🔄 Creating new MongoDB client for development...")
    client = new MongoClient(uri, options)
    
    // Add connection event listeners for debugging
    client.on('serverOpening', () => {
      console.log('🟢 MongoDB: Server connection opening...')
    })
    
    client.on('serverClosed', () => {
      console.log('🔴 MongoDB: Server connection closed')
    })
    
    client.on('error', (error) => {
      console.error('❌ MongoDB client error:', error)
    })
    
    global._mongoClientPromise = client.connect()
      .then((connectedClient) => {
        console.log("✅ MongoDB client connected successfully")
        return connectedClient
      })
      .catch((error) => {
        console.error("❌ MongoDB connection failed:", error.message)
        if (error.message.includes('timeout') || error.message.includes('network')) {
          console.error("💡 This is likely a network/firewall issue. Please check:")
          console.error("   1. Your IP is whitelisted in MongoDB Atlas")
          console.error("   2. Your internet connection is stable")
          console.error("   3. No corporate firewall is blocking the connection")
        }
        throw error
      })
  }
  clientPromise = global._mongoClientPromise
} else {
  console.log("🔄 Creating new MongoDB client for production...")
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

export async function connectToDatabase(retryCount = 0, maxRetries = 3) {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in environment variables")
    }
    
    console.log(`Attempting to connect to MongoDB... (attempt ${retryCount + 1}/${maxRetries + 1})`)
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || "ai-tutor-platform")
    
    // Test the connection with a shorter timeout
    await Promise.race([
      db.admin().ping(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection test timeout')), 3000)
      )
    ])
    
    console.log("✅ MongoDB connection successful")
    return { client, db }
  } catch (error) {
    console.error(`❌ Failed to connect to database (attempt ${retryCount + 1}):`, error.message)
    
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
      console.log(`⏳ Retrying in ${delay/1000}s...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return connectToDatabase(retryCount + 1, maxRetries)
    }
    
    // Provide helpful error messages based on error type
    if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
      console.error("💡 Connection timeout - this could be due to:")
      console.error("   1. Network connectivity issues")
      console.error("   2. MongoDB Atlas IP whitelist (add your current IP)")
      console.error("   3. Incorrect MongoDB URI")
      console.error("   4. MongoDB service is down")
    } else if (error.message.includes('authentication failed')) {
      console.error("💡 Authentication failed - check your username/password in MONGODB_URI")
    } else if (error.message.includes('MONGODB_URI is not set')) {
      console.error("💡 Please set MONGODB_URI in your .env.local file")
    }
    
    throw error
  }
}

// Test MongoDB connection function
export async function testMongoConnection() {
  try {
    if (!process.env.MONGODB_URI) {
      return { success: false, error: "MONGODB_URI is not set" }
    }
    
    const { db } = await connectToDatabase()
    const result = await db.admin().ping()
    return { success: true, message: "MongoDB connection successful" }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
