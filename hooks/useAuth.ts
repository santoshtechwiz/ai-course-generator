import { useState, useEffect, useCallback } from 'react'
import { useSession, signIn, signOut } from "next-auth/react"
import { useAppSelector } from "@/store"
import {
  clearUserRedirectState, 
  setUserRedirectState
} from "@/store/slices/authSlice"
import { useAppDispatch } from "@/store"

// Define proper type for the session
interface AuthSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
  };
  expires?: string;
}

// Define return type for useAuth hook
export interface UseAuthReturn {
  userId: string | null;
  user?: AuthSession['user'];
  isAuthenticated: boolean;
  status: "loading" | "authenticated" | "unauthenticated";
  fromAuth: boolean;
  requireAuth: (callbackUrl?: string) => boolean;
  getAuthRedirectInfo: () => { path: string } | null;
  clearAuthState: () => void;
  setRedirectUrl: (url: string) => void;
  signIn: typeof signIn;
  signOut: typeof signOut;
}

/**
 * Custom hook for authentication state management
 * Provides a simpler, more consistent API for auth operations
 */
export function useAuth(): UseAuthReturn {
  const dispatch = useAppDispatch()
  const { data: session, status } = useSession()
  const [userId, setUserId] = useState<string | null>(null)
  const authState = useAppSelector(state => state.auth)
  
  // Set user ID from session
  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id)
    } else {
      setUserId(null)
    }
  }, [session])
  
  const isAuthenticated = status === "authenticated" && !!userId
  
  // Simple way to check if the URL contains fromAuth=true 
  const fromAuth = typeof window !== 'undefined' && 
    window.location.search?.includes('fromAuth=true')
    
  // Simple helper to get auth redirect info from URL params
  const getAuthRedirectInfo = useCallback(() => {
    if (typeof window === 'undefined') return null
    
    try {
      const url = new URL(window.location.href)
      const redirect = url.searchParams.get('redirect')
      return redirect ? { path: redirect } : null
    } catch (e) {
      return null
    }
  }, [])
  
  // Helper to force authentication
  const requireAuth = useCallback((callbackUrl?: string) => {
    if (status === "unauthenticated") {
      signIn(undefined, callbackUrl ? { callbackUrl } : undefined)
      return false
    }
    return true
  }, [status])
  
  // Clear auth state
  const clearAuthState = useCallback(() => {
    dispatch(clearUserRedirectState())
  }, [dispatch])
  
  // Set redirect URL
  const setRedirectUrl = useCallback((url: string) => {
    dispatch(setUserRedirectState({ path: url }))
  }, [dispatch])
  
  return {
    userId,
    user: session?.user,
    isAuthenticated,
    status,
    fromAuth,
    signIn,
    signOut,
    requireAuth,
    getAuthRedirectInfo,
    clearAuthState,
    setRedirectUrl
  }
}

// Export for testing
export function _createMockUseAuth(overrides = {}): UseAuthReturn {
  return {
    userId: "test-user-id",
    user: { id: "test-user-id", name: "Test User" },
    isAuthenticated: true,
    status: "authenticated",
    fromAuth: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    requireAuth: jest.fn().mockReturnValue(true),
    getAuthRedirectInfo: jest.fn(() => null),
    clearAuthState: jest.fn(),
    setRedirectUrl: jest.fn(),
    ...overrides
  }
}
