import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getAvailableProviders, testAllProviders } from "@/lib/gemini";

// JWT verification function
async function verifyToken(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No valid authorization header");
    }

    const token = authHeader.substring(7);
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
}

// GET - Get available providers
export async function GET(request) {
  try {
    const user = await verifyToken(request);
    
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Only educators can access provider information" }, { status: 403 });
    }

    const providers = getAvailableProviders();
    
    return NextResponse.json({
      success: true,
      providers
    });
  } catch (error) {
    console.error("Error getting providers:", error);
    if (error.message === "Invalid token") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to get providers" }, { status: 500 });
  }
}

// POST - Test provider connections
export async function POST(request) {
  try {
    const user = await verifyToken(request);
    
    if (user.role !== "educator") {
      return NextResponse.json({ error: "Only educators can test provider connections" }, { status: 403 });
    }

    console.log("🧪 Testing all provider connections...");
    const testResults = await testAllProviders();
    
    return NextResponse.json({
      success: true,
      results: testResults
    });
  } catch (error) {
    console.error("Error testing providers:", error);
    if (error.message === "Invalid token") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to test providers" }, { status: 500 });
  }
} 