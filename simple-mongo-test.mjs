/**
 * Simple MongoDB Connection Test
 * Run with: node simple-mongo-test.mjs
 */

import { MongoClient } from 'mongodb';
import dns from 'dns';
import { promisify } from 'util';

const resolveSrv = promisify(dns.resolveSrv);

// Get connection string from environment
const MONGODB_URI = "mongodb+srv://auqib:arwaa123@cluster0.gjsxg.mongodb.net/llmfied?retryWrites=true&w=majority&appName=Cluster0";

console.log("🔍 MongoDB Connection Test");
console.log("=========================\n");

async function testConnection() {
  console.log("1. Testing DNS Resolution...");
  try {
    const srvHostname = '_mongodb._tcp.cluster0.gjsxg.mongodb.net';
    const startTime = Date.now();
    const srvRecords = await resolveSrv(srvHostname);
    const duration = Date.now() - startTime;
    console.log(`✅ DNS Resolution Success (${duration}ms): Found ${srvRecords.length} servers`);
    srvRecords.forEach((record, i) => {
      console.log(`   Server ${i + 1}: ${record.name}:${record.port}`);
    });
  } catch (error) {
    console.log(`❌ DNS Resolution Failed: ${error.message}`);
    return;
  }

  console.log("\n2. Testing MongoDB Connection...");
  
  const client = new MongoClient(MONGODB_URI, {
    connectTimeoutMS: 20000,
    serverSelectionTimeoutMS: 20000,
    socketTimeoutMS: 30000,
    family: 4,
    tls: true,
    retryWrites: true,
  });

  try {
    const startTime = Date.now();
    console.log("   Connecting to MongoDB...");
    
    await client.connect();
    const connectTime = Date.now() - startTime;
    console.log(`✅ Connection Success (${connectTime}ms)`);
    
    // Test database operation
    const pingStart = Date.now();
    const db = client.db('llmfied');
    await db.admin().ping();
    const pingTime = Date.now() - pingStart;
    console.log(`✅ Ping Success (${pingTime}ms)`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections`);
    
    if (collections.length > 0) {
      console.log("   Collections:");
      collections.forEach(col => console.log(`   - ${col.name}`));
    }
    
  } catch (error) {
    console.log(`❌ MongoDB Connection Failed: ${error.message}`);
    console.log(`   Error Code: ${error.code || 'Unknown'}`);
    
    if (error.message.includes('ETIMEOUT') || error.message.includes('timeout')) {
      console.log("\n🚨 TIMEOUT ERROR DETECTED");
      console.log("========================");
      console.log("This error indicates network connectivity issues:");
      console.log("");
      console.log("1. 🌐 Check your internet connection");
      console.log("2. 🔒 Verify MongoDB Atlas IP Whitelist:");
      console.log("   - Go to MongoDB Atlas Dashboard");
      console.log("   - Navigate to Network Access");
      console.log("   - Add your current IP address");
      console.log("   - Or temporarily add 0.0.0.0/0 for testing");
      console.log("");
      console.log("3. 🏢 Corporate Network Issues:");
      console.log("   - Firewall may be blocking MongoDB ports (27017-27019)");
      console.log("   - VPN might be interfering");
      console.log("   - Try from a different network");
      console.log("");
      console.log("4. 🔧 Quick Fixes to Try:");
      console.log("   - Restart your router/modem");
      console.log("   - Disable VPN temporarily");
      console.log("   - Try mobile hotspot");
      console.log("   - Check MongoDB Atlas status page");
    }
  } finally {
    try {
      await client.close();
    } catch (e) {
      // Ignore close errors
    }
  }
}

testConnection().catch(console.error);