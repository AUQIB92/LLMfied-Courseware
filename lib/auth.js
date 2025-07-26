import jwt from "jsonwebtoken"
import { NextResponse } from "next/server"

/**
 * Verify JWT token from request headers
 * @param {Request} request - The incoming request object
 * @returns {Object} The decoded user object from the token
 * @throws {Error} If token is missing or invalid
 */
export async function verifyToken(request) {
  try {
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader) {
      throw new Error("No authorization header provided")
    }

    const token = authHeader.replace("Bearer ", "")
    
    if (!token) {
      throw new Error("No token provided")
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured")
    }

    // Verify and decode the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    return decoded
  } catch (error) {
    // Re-throw with more specific error messages
    if (error.name === 'TokenExpiredError') {
      throw new Error("Token has expired")
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error("Invalid token")
    } else if (error.name === 'NotBeforeError') {
      throw new Error("Token not active yet")
    } else {
      throw error
    }
  }
}

/**
 * Check if user has required role
 * @param {Object} user - The decoded user object from verifyToken
 * @param {string|string[]} requiredRoles - Required role(s) 
 * @returns {boolean} Whether user has required role
 */
export function hasRole(user, requiredRoles) {
  if (!user || !user.role) {
    return false
  }

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return roles.includes(user.role)
}

/**
 * Middleware to verify token and check role
 * @param {Request} request - The incoming request object
 * @param {string|string[]} requiredRoles - Required role(s)
 * @returns {Object} The verified user object
 * @throws {Error} If token is invalid or user doesn't have required role
 */
export async function verifyTokenAndRole(request, requiredRoles = null) {
  const user = await verifyToken(request)
  
  if (requiredRoles && !hasRole(user, requiredRoles)) {
    throw new Error(`Access denied. Required role(s): ${Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles}`)
  }
  
  return user
}

/**
 * Extract user ID from request token
 * @param {Request} request - The incoming request object
 * @returns {string} The user ID
 */
export async function getUserId(request) {
  const user = await verifyToken(request)
  return user.userId || user.id
}

/**
 * Create standardized auth error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Response} NextResponse with error
 */
export function createAuthErrorResponse(message, status = 401) {
  return NextResponse.json(
    { error: message, code: "AUTH_ERROR" },
    { status }
  )
} 