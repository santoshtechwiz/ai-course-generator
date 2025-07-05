"use client"

import { useSession } from "next-auth/react"
import { useAuth } from "@/modules/auth"
import { Button } from "@/components/ui/button"
import { signIn, signOut } from "next-auth/react"

export default function DebugAuthPage() {
  const { data: session, status } = useSession()
  const auth = useAuth()

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Auth Debug Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">NextAuth Session</h2>
          <p><strong>Status:</strong> {status}</p>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Auth Provider State</h2>
          <p><strong>Is Loading:</strong> {auth.isLoading.toString()}</p>
          <p><strong>Is Authenticated:</strong> {auth.isAuthenticated.toString()}</p>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            User: {JSON.stringify(auth.user, null, 2)}
          </pre>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            Subscription: {JSON.stringify(auth.subscription, null, 2)}
          </pre>
        </div>

        <div className="space-x-4">
          <Button onClick={() => signIn()}>
            Sign In (NextAuth)
          </Button>
          <Button onClick={() => signOut()}>
            Sign Out (NextAuth)
          </Button>
        </div>
      </div>
    </div>
  )
}
