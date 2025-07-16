"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestResetPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("")

  const testForgotPassword = async () => {
    setLoading(true)
    setResult("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      
      setResult(JSON.stringify({
        status: response.status,
        ok: response.ok,
        data
      }, null, 2))

    } catch (error) {
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Password Reset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email to test"
            />
          </div>
          
          <Button 
            onClick={testForgotPassword} 
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? "Testing..." : "Test Forgot Password"}
          </Button>

          {result && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Result:</label>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {result}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 