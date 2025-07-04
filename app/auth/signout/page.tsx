'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle } from 'lucide-react'
import { useAppDispatch } from '@/store'
import { logout } from '@/store/slices/auth-slice'
import { resetSubscriptionState } from '@/store/slices/subscription-slice'

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
export default function SignOutPage() {  const [isLoading, setIsLoading] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard/explore' // Default to /explore
  // Helper to clear all application state
  const clearAllClientStorage = () => {
    try {
      // Specific keys to clear first (to ensure critical data is removed)
      const criticalKeys = [
        // Auth related
        'auth', 
        'next-auth.session-token', 
        'next-auth.callback-url', 
        'next-auth.csrf-token',
        // Subscription related
        'subscription', 
        'pendingSubscription',
        // State management
        'persist:root',
        'persist:auth',
        'persist:subscription'
      ]
      
      // Clear critical keys first
      criticalKeys.forEach(key => {
        try {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        } catch (e) {
          console.warn(`Failed to remove critical item: ${key}`, e)
        }
      })
      
      // Then clear all remaining localStorage
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
      
      // Clear any potential cookies
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)
      })
    } catch (error) {
      console.error("Error clearing storage:", error)
    }
  }
  useEffect(() => {
    const completeSignOut = async () => {
      try {
        // 1. First clear Redux state
        dispatch(logout())
        dispatch(resetSubscriptionState())
        
        // 2. Clear all client-side storage
        clearAllClientStorage()
        
        // 3. Sign out completely using NextAuth's API
        await signOut({ 
          redirect: false, // We'll handle redirect ourselves
        })

        // Show completed state briefly
        setIsComplete(true)

        // 4. Wait briefly to ensure cookies are cleared
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 5. Hard navigation to ensure complete page refresh
        window.location.href = callbackUrl
      } catch (error) {
        console.error('Error during sign out:', error)
        // On error, still try to redirect with a hard navigation
        window.location.href = callbackUrl
      }
    }

    completeSignOut()
  }, [callbackUrl, dispatch])
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-8 bg-card rounded-lg shadow-lg text-center border border-border">
        {isComplete ? (
          <>
            <CheckCircle className="h-8 w-8 mb-4 mx-auto text-green-500" />
            <h1 className="text-2xl font-semibold mb-2">Signed out successfully!</h1>
            <p className="text-muted-foreground">Redirecting you now...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mb-4 mx-auto text-primary" />
            <h1 className="text-2xl font-semibold mb-2">Signing out...</h1>
            <p className="text-muted-foreground">Please wait while we sign you out securely.</p>
          </>
        )}
      </div>
    </div>
  )
}
