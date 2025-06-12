"use client"

import { useAuthContext, type AuthContextValue } from '@/context/auth-context'

/**
 * useAuth – Secure auth hook using centralized auth context
 * 
 * This hook provides access to authentication state and methods:
 * - isAuthenticated: boolean - whether the user is authenticated
 * - userId: string | undefined - the authenticated user's ID
 * - isLoading: boolean - whether auth state is being loaded
 * - isAdmin: boolean - whether the user has admin privileges
 * - user: object - the user object from the session
 * - logout: () => Promise<void> - function to log the user out
 * - status: 'authenticated' | 'loading' | 'unauthenticated' - auth status
 * - session: object - the full session object
 * - isInitialized: boolean - whether auth has been initialized
 * - initialize: () => void - function to initialize auth
 */
export function useAuth(): AuthContextValue {
  return useAuthContext()
}

export default useAuth
