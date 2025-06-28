"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Database, Wifi } from "lucide-react"

export default function DatabaseDebugPage() {
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState(null)

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test-db')
      const data = await response.json()
      setConnectionStatus(data)
      setLastChecked(new Date().toLocaleString())
    } catch (error) {
      setConnectionStatus({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      setLastChecked(new Date().toLocaleString())
    }
    setIsLoading(false)
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Database Connection Debug</h1>
          <p className="text-lg text-gray-600">Troubleshoot your MongoDB connection</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              MongoDB Connection Status
            </CardTitle>
            <CardDescription>
              Real-time connection testing and diagnostics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                ) : connectionStatus?.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-semibold">
                  {isLoading ? 'Testing connection...' : 
                   connectionStatus?.success ? 'Connected' : 'Connection Failed'}
                </span>
                {connectionStatus && (
                  <Badge variant={connectionStatus.success ? 'default' : 'destructive'}>
                    {connectionStatus.success ? 'Success' : 'Error'}
                  </Badge>
                )}
              </div>
              <Button onClick={testConnection} disabled={isLoading} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Again
              </Button>
            </div>

            {lastChecked && (
              <p className="text-sm text-gray-500">Last checked: {lastChecked}</p>
            )}

            {connectionStatus && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Connection Details:</h3>
                <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(connectionStatus, null, 2)}
                </pre>
              </div>
            )}

            {connectionStatus && !connectionStatus.success && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Troubleshooting Steps:
                </h3>
                <ol className="text-sm text-red-700 space-y-2 list-decimal list-inside">
                  <li>Check if your <code>.env.local</code> file exists and contains <code>MONGODB_URI</code></li>
                  <li>Verify your MongoDB connection string format</li>
                  <li>If using MongoDB Atlas:
                    <ul className="ml-6 mt-1 list-disc list-inside">
                      <li>Check your IP whitelist in MongoDB Atlas</li>
                      <li>Verify username/password are correct</li>
                      <li>Ensure your cluster is running</li>
                    </ul>
                  </li>
                  <li>If using local MongoDB:
                    <ul className="ml-6 mt-1 list-disc list-inside">
                      <li>Ensure MongoDB service is running</li>
                      <li>Check port 27017 is accessible</li>
                    </ul>
                  </li>
                  <li>Check network connectivity and firewall settings</li>
                </ol>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Environment Configuration:</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Environment:</strong> {connectionStatus?.environment || 'Unknown'}</p>
                <p><strong>Expected .env.local location:</strong> <code>/path/to/your/project/.env.local</code></p>
                <p><strong>Required variables:</strong></p>
                <ul className="ml-4 list-disc list-inside">
                  <li><code>MONGODB_URI</code> - Your MongoDB connection string</li>
                  <li><code>JWT_SECRET</code> - For authentication</li>
                  <li><code>GEMINI_API_KEY</code> - For AI features</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Quick Setup Guide:</h3>
              <div className="text-sm text-yellow-700 space-y-2">
                <p>1. Copy <code>.env.local.example</code> to <code>.env.local</code></p>
                <p>2. For local development:</p>
                <code className="block bg-white p-2 rounded border text-black">
                  MONGODB_URI=mongodb://localhost:27017/ai-tutor-platform
                </code>
                <p>3. For MongoDB Atlas:</p>
                <code className="block bg-white p-2 rounded border text-black">
                  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
                </code>
                <p>4. Restart your development server after making changes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button asChild variant="outline">
            <a href="/">← Back to Home</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
