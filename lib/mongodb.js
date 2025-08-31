import { MongoClient } from "mongodb"

if (!process.env.MONGODB_URI) {
  console.error("⚠️  MONGODB_URI environment variable is not set!")
  console.log("Please set your MongoDB connection string in your .env.local file:")
  console.log("For local development: MONGODB_URI=mongodb://localhost:27017/llmfied")
  console.log("For MongoDB Atlas: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database")
}

const uri = process.env.MONGODB_URI
const options = {
  // Minimal essential options only
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
}

let client
let clientPromise
let connectionState = 'disconnected' // disconnected, connecting, connected, error

// Connection event handlers
function setupConnectionHandlers(client) {
  client.on('serverOpening', () => {
    console.log('🟢 MongoDB: Server connection opening...')
    connectionState = 'connecting'
  })
  
  client.on('serverClosed', () => {
    console.log('🔴 MongoDB: Server connection closed')
    connectionState = 'disconnected'
  })
  
  client.on('error', (error) => {
    console.error('❌ MongoDB client error:', error)
    connectionState = 'error'
  })
  
  client.on('topologyOpening', () => {
    console.log('🔄 MongoDB: Topology opening...')
  })
  
  client.on('topologyClosed', () => {
    console.log('🔴 MongoDB: Topology closed')
    connectionState = 'disconnected'
  })
}

// Enhanced connection with retry logic
async function createConnection() {
  try {
    console.log("🔄 Creating new MongoDB connection...")
    client = new MongoClient(uri, options)
    setupConnectionHandlers(client)
    
    const connectedClient = await client.connect()
    connectionState = 'connected'
    console.log("✅ MongoDB client connected successfully")
    
    // Test the connection immediately
    await connectedClient.db().admin().ping()
    console.log("✅ MongoDB connection test successful")
    
    return connectedClient
  } catch (error) {
    connectionState = 'error'
    console.error("❌ MongoDB connection failed:", error.message)
    
    // Provide specific error guidance
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT') || error.message.includes('ETIMEOUT')) {
      console.error("💡 Connection timeout detected. This could be due to:")
      console.error("   1. Network connectivity issues")
      console.error("   2. MongoDB Atlas IP whitelist (add your current IP)")
      console.error("   3. Firewall blocking connections")
      console.error("   4. MongoDB cluster is overloaded or down")
    } else if (error.message.includes('authentication failed')) {
      console.error("💡 Authentication failed - check your username/password in MONGODB_URI")
    } else if (error.message.includes('MONGODB_URI is not set')) {
      console.error("💡 Please set MONGODB_URI in your .env.local file")
    }
    
    throw error
  }
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    console.log("🔧 Development mode: Creating cached MongoDB connection...")
    global._mongoClientPromise = createConnection()
  }
  clientPromise = global._mongoClientPromise
} else {
  console.log("🚀 Production mode: Creating new MongoDB connection...")
  clientPromise = createConnection()
}

export default clientPromise

export async function connectToDatabase(retryCount = 0, maxRetries = 3) {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in environment variables")
    }
    
    console.log(`Attempting to connect to MongoDB... (attempt ${retryCount + 1}/${maxRetries + 1})`)
    
    // Always create a fresh connection for API routes to avoid connection state issues
    console.log("🔄 Creating fresh MongoDB connection for API route...")
    const client = new MongoClient(uri, options)
    
    // Connect the client
    await client.connect()
    console.log("✅ MongoDB client connected successfully")
    
    const db = client.db(process.env.MONGODB_DB || "llmfied")
    
    // Test the connection with a shorter timeout
    await Promise.race([
      db.admin().ping(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection test timeout')), 5000)
      )
    ])
    
    console.log("✅ MongoDB connection successful")
    connectionState = 'connected'
    return { client, db }
  } catch (error) {
    console.error(`❌ Failed to connect to database (attempt ${retryCount + 1}):`, error.message)
    
    if (retryCount < maxRetries) {
      const delay = Math.min(Math.pow(2, retryCount) * 1000, 10000); // Exponential backoff: 1s, 2s, 4s, max 10s
      console.log(`⏳ Retrying in ${delay/1000}s...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return connectToDatabase(retryCount + 1, maxRetries)
    }
    
    // Provide helpful error messages based on error type
    if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout') || error.message.includes('ETIMEOUT')) {
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

// Test MongoDB connection function with enhanced error handling
export async function testMongoConnection() {
  try {
    if (!process.env.MONGODB_URI) {
      return { success: false, error: "MONGODB_URI is not set" }
    }
    
    console.log("🔍 Testing MongoDB connection...")
    const startTime = Date.now()
    
    const { db } = await connectToDatabase()
    const result = await db.admin().ping()
    
    const duration = Date.now() - startTime
    console.log(`✅ MongoDB connection test successful (${duration}ms)`)
    
    return { 
      success: true, 
      message: "MongoDB connection successful",
      duration: duration,
      connectionState: connectionState
    }
  } catch (error) {
    console.error("❌ MongoDB connection test failed:", error.message)
    return { 
      success: false, 
      error: error.message,
      connectionState: connectionState
    }
  }
}

// Health check function for API routes
export async function getConnectionHealth() {
  return {
    state: connectionState,
    uri: process.env.MONGODB_URI ? "configured" : "missing",
    timestamp: new Date().toISOString()
  }
}

// Graceful shutdown handler
export async function closeConnection() {
  try {
    if (client) {
      await client.close()
      console.log("🔴 MongoDB connection closed gracefully")
      connectionState = 'disconnected'
    }
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error)
  }
}
