"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useDispatch } from 'react-redux'
import { useSessionService } from '@/hooks/useSessionService'
import type { AppDispatch } from '@/store'
import { invalidateSessionCache } from '@/lib/auth'

export interface AuthHookResult {
  isAuthenticated: boolean
  userId: string | undefined
  isLoading: boolean
  isAdmin: boolean
  user: any
  guestId: string | null
  logout: () => Promise<void>
  status: 'authenticated' | 'loading' | 'unauthenticated'
  session: any
}

/**
 * useAuth – Secure auth hook using NextAuth only (no Redux, no storage)
 */
export function useAuth(): AuthHookResult {
  const { data: session, status } = useSession()
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const dispatch = useDispatch<AppDispatch>()
  const { clearAuthState } = useSessionService()
  
  // Add ref to track if we've checked admin status to break infinite loops
  const authCheckRef = useRef(false)
  
  // Derive these values directly without useState to reduce render cycles
  const isAuthenticated = status === 'authenticated' && !!session
  const isLoading = status === 'loading'
  const user = session?.user || null

  // Use useEffect with proper dependencies
  useEffect(() => {
    // Only check admin status when authentication state changes
    // and we haven't already checked for this session
    if (isAuthenticated && !authCheckRef.current) {
      // Mark that we've checked this session
      authCheckRef.current = true
      // Check for admin role
      const userIsAdmin = session?.user?.isAdmin || false

      // Only update state if value actually changes
      if (userIsAdmin !== isAdmin) {
        setIsAdmin(userIsAdmin)
      }
    }
    
    // Reset our check flag if user logs out
    if (!isAuthenticated) {
      authCheckRef.current = false
      if (isAdmin) setIsAdmin(false)
    }
  }, [isAuthenticated, session, isAdmin])

  // Enhanced logout that clears all session data
  const logout = useCallback(async () => {
    // First clean up all session data
    clearAuthState()

    // Clear local/session storage
    if (typeof window !== 'undefined') {
      // Clear auth-related items from localStorage
      const lsKeys = Object.keys(localStorage)
      lsKeys.forEach(key => {
        if (key.includes('token') || 
            key.includes('user') || 
            key.includes('auth') ||
            key.includes('session')) {
          localStorage.removeItem(key)
        }
      })
      
      try {
        // Clear auth-related items from sessionStorage
        const ssKeys = Object.keys(sessionStorage);
        ssKeys.forEach(key => {
          // Clear auth and quiz-related data
          if (key.includes('auth_') || key.includes('quiz_') || 
              key.includes('pendingQuiz') || key === 'callbackUrl') {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.error("Error clearing session data:", e);
      }
    }

    // Clear server-side session cache
    invalidateSessionCache();

    // Then sign out with NextAuth
    await signOut({ redirect: false })
  }, [clearAuthState])

  return {
    isAuthenticated,
    userId: session?.user?.id,
    isLoading,
    isAdmin,
    user,
    guestId: null,
    logout,
    status,
    session,
  }
}

export default useAuth
