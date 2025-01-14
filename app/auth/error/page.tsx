'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"

export default function AuthError({
  error = "An unexpected error occurred",
  status
}: {
  error?: string
  status?: number
}) {
  const router = useRouter()

  useEffect(() => {
    if (status === 401) {
      // Unauthorized, redirect to sign-in page
      router.push('/auth/signin')
    }
  }, [status, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-4">Authentication Error</h1>
      <p className="text-xl mb-4">{error}</p>
      <Button onClick={() => router.push('/')}>
        Go back to home
      </Button>
    </div>
  )
}

