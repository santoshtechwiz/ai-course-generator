"use client"

import { useAuth } from "@/modules/auth"
import { useSession } from "next-auth/react"

export default function AuthDebugPage() {
  const { user, subscription, isAuthenticated, isLoading } = useAuth()
  const { data: session, status } = useSession()

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Auth Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Session (NextAuth)</h2>
          <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({ status, session }, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Auth Provider State</h2>
          <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({ 
              isLoading, 
              isAuthenticated, 
              user, 
              subscription 
            }, null, 2)}
          </pre>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">PDF Download Check</h2>
        <div className="space-y-2">
          <p>Can Download PDF: {subscription?.features?.advancedAnalytics ? 'YES' : 'NO'}</p>
          <p>Subscription Plan: {subscription?.plan || 'None'}</p>
          <p>Subscription Status: {subscription?.status || 'None'}</p>
          <p>Advanced Analytics Feature: {subscription?.features?.advancedAnalytics ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>
    </div>
  )
}
