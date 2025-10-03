"use client"

import { AuthDebugPanel } from "@/components/admin/AuthDebugPanel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

export default function AuthDebugPage() {
  const [apiTestResult, setApiTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAuthCheck = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/check')
      const result = await response.json()
      setApiTestResult({ status: response.status, data: result })
    } catch (error) {
      setApiTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const testUsersAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users')
      const result = await response.json()
      setApiTestResult({ 
        status: response.status, 
        data: result,
        endpoint: '/api/users'
      })
    } catch (error) {
      setApiTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Authentication Debug</h1>
        <p className="text-muted-foreground">Debug authentication issues</p>
      </div>

      <AuthDebugPanel />

      <Card>
        <CardHeader>
          <CardTitle>API Testing</CardTitle>
          <CardDescription>
            Test API endpoints to debug authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testAuthCheck} disabled={loading}>
              Test Auth Check
            </Button>
            <Button onClick={testUsersAPI} disabled={loading} variant="outline">
              Test Users API
            </Button>
          </div>

          {apiTestResult && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(apiTestResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}