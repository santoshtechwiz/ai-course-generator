'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Clean SignOut Page
 * 
 * This page ensures proper signout by:
 * 1. Clearing browser storage (localStorage/sessionStorage)
 * 2. Properly calling NextAuth's signOut function
 * 3. Waiting for signOut to complete
 * 4. Redirecting to a specified location (or home page)
 * 
 * It provides visual feedback during the logout process
 */
export default function SignOutPage() {
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard/explore' // Default to /explore

  // Helper to clear all application state
  const clearAllClientStorage = () => {
    try {
      // Clear localStorage
      const localStorageKeys = Object.keys(localStorage || {})
      localStorageKeys.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (e) {
          console.warn("Failed to remove localStorage item:", key)
        }
      })
      
      // Clear sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage || {})
      sessionStorageKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key)
        } catch (e) {
          console.warn("Failed to remove sessionStorage item:", key)
        }
      })
    } catch (error) {
      console.error("Error clearing storage:", error)
    }
  }

  useEffect(() => {
    const completeSignOut = async () => {
      try {
        // 1. First clear all client-side storage
        clearAllClientStorage()
        
        // 2. Sign out completely using NextAuth's API
        await signOut({ 
          redirect: false, // We'll handle redirect ourselves
        })

        // 3. Wait briefly to ensure cookies are cleared
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 4. Hard navigation to ensure complete page refresh
        window.location.href = callbackUrl
      } catch (error) {
        console.error('Error during sign out:', error)
        // On error, still try to redirect with a hard navigation
        window.location.href = callbackUrl
      }
    }

    completeSignOut()
  }, [callbackUrl])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-8 bg-card rounded-lg shadow-lg text-center border border-border">
        <Loader2 className="h-8 w-8 animate-spin mb-4 mx-auto text-primary" />
        <h1 className="text-2xl font-semibold mb-2">Signing out...</h1>
        <p className="text-muted-foreground">Please wait while we sign you out securely.</p>
      </div>
    </div>
  )
}
