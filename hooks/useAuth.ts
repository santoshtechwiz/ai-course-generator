"use client"

import { useCallback, useMemo } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useAppDispatch, useAppSelector } from '@/store'
import { setUserRedirectState, clearUserRedirectState } from '@/store/slices/authSlice'

export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading'

export interface AuthRedirectInfo {
  path: string
}

export interface AuthHook {
  userId: string | null
  isAuthenticated: boolean
  status: AuthStatus
  fromAuth: boolean
  signIn: (provider?: string, options?: any) => Promise<any>
  signOut: () => Promise<any>
  requireAuth: (callbackUrl?: string) => void
  getAuthRedirectInfo: () => AuthRedirectInfo | null
  clearAuthRedirectInfo?: () => void
}

/**
 * Hook for managing authentication state and handling authentication flow
 */
export function useAuth(): AuthHook {
  const { data: session, status } = useSession()
  const dispatch = useAppDispatch()
  const authState = useAppSelector(state => state.auth)
  
  // Get the fromAuth parameter from URL
  const fromAuth = useMemo(() => {
    if (typeof window === 'undefined') return false
    
    // Use URLSearchParams to properly parse URL parameters
    const searchParams = new URLSearchParams(window.location.search)
    return searchParams.has('fromAuth') && searchParams.get('fromAuth') === 'true'
  }, [])
  
  // Get the auth redirect info from URL
  const getAuthRedirectInfo = useCallback((): AuthRedirectInfo | null => {
    if (typeof window === 'undefined') return null
    
    // Parse redirect path from URL parameters
    const searchParams = new URLSearchParams(window.location.search)
    const redirectPath = searchParams.get('redirect')
    
    if (redirectPath) {
      return { path: redirectPath }
    }
    
    return null
  }, [])
  
  // Clear auth redirect info
  const clearAuthRedirectInfo = useCallback(() => {
    dispatch(clearUserRedirectState())
  }, [dispatch])
  
  // Set auth redirect info
  const setAuthRedirectInfo = useCallback((info: any) => {
    dispatch(setUserRedirectState(info))
  }, [dispatch])
  
  // Require authentication
  const requireAuth = useCallback((callbackUrl?: string) => {
    if (status === 'unauthenticated') {
      signIn(undefined, { callbackUrl: callbackUrl || window.location.pathname })
    }
  }, [status])
  
  return {
    userId: session?.user?.id || null,
    isAuthenticated: status === 'authenticated',
    status,
    fromAuth,
    signIn,
    signOut,
    requireAuth,
    getAuthRedirectInfo,
    clearAuthRedirectInfo,
    setAuthRedirectInfo
  }
}

// Helper function for testing
export function _createMockUseAuth(overrides: Partial<AuthHook> = {}): AuthHook {
  return {
    userId: 'test-user-id',
    isAuthenticated: true,
    status: 'authenticated',
    fromAuth: false,
    signIn: async () => null,
    signOut: async () => null,
    requireAuth: () => {},
    getAuthRedirectInfo: () => null,
    clearAuthRedirectInfo: () => {},
    ...overrides
  }
}
