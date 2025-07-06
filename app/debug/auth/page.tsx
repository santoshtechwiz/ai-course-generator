"use client"

import { useAuth, useSubscription } from "@/modules/auth"
import { useSession } from "next-auth/react"

export default function AuthDebugPage() {
  const { user, subscription: authSubscription, isAuthenticated, isLoading } = useAuth()
  const { data: session, status } = useSession()
  const { subscription: unifiedSubscription, isLoading: subLoading, error: subError } = useSubscription()

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Auth Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Session (NextAuth)</h2>
          <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({ status, session }, null, 2)}
          </pre>
        </div>        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Auth Provider State</h2>
          <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({ 
              isLoading, 
              isAuthenticated, 
              user, 
              authSubscription 
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Unified Subscription State</h2>
          <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({ 
              subscription: unifiedSubscription,
              isLoading: subLoading,
              error: subError
            }, null, 2)}
          </pre>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Subscription Features Check</h2>
        <div className="space-y-2">
          <p>Plan: {unifiedSubscription?.plan || 'FREE'}</p>
          <p>Status: {unifiedSubscription?.status || 'INACTIVE'}</p>
          <p>Is Active: {unifiedSubscription?.isActive ? 'YES' : 'NO'}</p>
          <p>Is Subscribed: {unifiedSubscription?.isSubscribed ? 'YES' : 'NO'}</p>
          <p>Credits: {unifiedSubscription?.credits || 0}</p>
          <p>Tokens Used: {unifiedSubscription?.tokensUsed || 0}</p>
        </div>
      </div>
    </div>
  )
}
