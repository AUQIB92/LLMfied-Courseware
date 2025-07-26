#!/usr/bin/env node

/**
 * MongoDB Connection Diagnostic Script
 *
 * This script helps diagnose MongoDB connection issues, especially timeouts.
 * Run with: node scripts/test-mongodb-connection.js
 */

import { connectToDatabase, testMongoConnection } from "../lib/mongodb.js";

console.log("🔍 MongoDB Connection Diagnostic Tool");
console.log("====================================\n");

async function runDiagnostics() {
  console.log("📋 Environment Check:");
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || "not set"}`);
  console.log(
    `   MONGODB_URI: ${process.env.MONGODB_URI ? "✅ Set" : "❌ Not set"}`
  );
  console.log(
    `   MONGODB_DB: ${process.env.MONGODB_DB || 'will use default "llmfied"'}`
  );
  console.log("");

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI environment variable is not set!");
    console.log("\n📝 To fix this:");
    console.log("1. Create a .env.local file in your project root");
    console.log("2. Add: MONGODB_URI=your_mongodb_connection_string");
    console.log(
      "3. For Atlas: mongodb+srv://username:password@cluster.mongodb.net/database"
    );
    console.log("4. For local: mongodb://localhost:27017/llmfied");
    process.exit(1);
  }

  // Test 1: Basic connection test
  console.log("🧪 Test 1: Basic Connection Test");
  console.log("-------------------------------");

  try {
    const startTime = Date.now();
    const result = await testMongoConnection();
    const duration = Date.now() - startTime;

    if (result.success) {
      console.log(`✅ Basic connection successful (${duration}ms)`);
    } else {
      console.log(`❌ Basic connection failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ Basic connection error: ${error.message}`);
  }

  console.log("");

  // Test 2: Full database operation test
  console.log("🧪 Test 2: Database Operation Test");
  console.log("----------------------------------");

  try {
    const startTime = Date.now();
    const { db } = await connectToDatabase();
    const duration = Date.now() - startTime;

    console.log(`✅ Database connection successful (${duration}ms)`);

    // Test a simple operation
    const opStartTime = Date.now();
    const collections = await db.listCollections().toArray();
    const opDuration = Date.now() - opStartTime;

    console.log(`✅ Database operation successful (${opDuration}ms)`);
    console.log(`📊 Found ${collections.length} collections`);
  } catch (error) {
    console.log(`❌ Database operation failed: ${error.message}`);

    if (error.message.includes("timeout")) {
      console.log("\n💡 Timeout Error Troubleshooting:");
      console.log("   1. Check your internet connection");
      console.log(
        "   2. Verify MongoDB Atlas IP whitelist includes your current IP"
      );
      console.log(
        "   3. Try connecting from MongoDB Compass with the same URI"
      );
      console.log(
        "   4. Check if any corporate firewall is blocking the connection"
      );
    }
  }

  console.log("");

  // Test 3: Collection query test
  console.log("🧪 Test 3: Collection Query Test");
  console.log("---------------------------------");

  try {
    const { db } = await connectToDatabase();

    // Test querying a collection (users is likely to exist)
    const startTime = Date.now();
    const userCount = await db.collection("users").countDocuments({});
    const duration = Date.now() - startTime;

    console.log(`✅ Collection query successful (${duration}ms)`);
    console.log(`👥 Found ${userCount} users in database`);
  } catch (error) {
    console.log(`❌ Collection query failed: ${error.message}`);
  }

  console.log("");

  // Test 4: Network latency test
  console.log("🧪 Test 4: Network Latency Test");
  console.log("-------------------------------");

  try {
    const { db } = await connectToDatabase();

    const latencyTests = [];
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      await db.admin().ping();
      const latency = Date.now() - startTime;
      latencyTests.push(latency);
      console.log(`   Ping ${i + 1}: ${latency}ms`);
    }

    const avgLatency =
      latencyTests.reduce((a, b) => a + b, 0) / latencyTests.length;
    const maxLatency = Math.max(...latencyTests);
    const minLatency = Math.min(...latencyTests);

    console.log(
      `📊 Latency Stats: avg=${avgLatency.toFixed(
        1
      )}ms, min=${minLatency}ms, max=${maxLatency}ms`
    );

    if (avgLatency > 1000) {
      console.log("⚠️  High latency detected - connection may be unstable");
    } else if (avgLatency > 500) {
      console.log("⚠️  Moderate latency - connection may be slow");
    } else {
      console.log("✅ Good latency - connection looks healthy");
    }
  } catch (error) {
    console.log(`❌ Latency test failed: ${error.message}`);
  }

  console.log("");
  console.log("🎯 Diagnostic Complete!");
  console.log("======================");

  // Recommendations
  console.log("\n💡 Recommendations:");
  console.log(
    "   • If experiencing timeouts, check your IP whitelist in MongoDB Atlas"
  );
  console.log("   • High latency? Consider using a closer MongoDB region");
  console.log(
    "   • For production, consider implementing connection pooling optimizations"
  );
  console.log(
    "   • Monitor your MongoDB Atlas connection metrics for patterns"
  );
}

// Handle script errors gracefully
process.on("unhandledRejection", (error) => {
  console.error("\n💥 Unhandled error during diagnostics:");
  console.error(error);
  process.exit(1);
});

// Run diagnostics
runDiagnostics().catch((error) => {
  console.error("\n💥 Diagnostic script failed:");
  console.error(error);
  process.exit(1);
});
