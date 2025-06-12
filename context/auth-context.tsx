"use client"

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  useRef,
  useMemo,
  ReactNode
} from 'react'
import { useSession, signOut, SessionProvider, SessionProviderProps } from 'next-auth/react'
import { useSessionService } from '@/hooks/useSessionService'
import { invalidateSessionCache } from '@/lib/auth'

export interface AuthContextValue {
  isAuthenticated: boolean
  userId: string | undefined
  isLoading: boolean
  isAdmin: boolean
  user: any
  guestId: string | null
  logout: () => Promise<void>
  status: 'authenticated' | 'loading' | 'unauthenticated'
  session: any
  isInitialized: boolean
  initialize: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  session?: SessionProviderProps['session']
  refetchInterval?: SessionProviderProps['refetchInterval']
}

export function AuthProvider({ 
  children, 
  session, 
  refetchInterval = 0 
}: AuthProviderProps) {
  // Just pass the session to NextAuth's SessionProvider
  return (
    <SessionProvider session={session} refetchInterval={refetchInterval}>
      {children}
    </SessionProvider>
  )
}

interface AuthConsumerProps {
  children: ReactNode
}

export function AuthConsumer({ children }: AuthConsumerProps) {
  const { data: session, status } = useSession()
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Add ref to track if we've checked admin status to break infinite loops
  const authCheckRef = useRef(false)
  
  // Get the session service but handle the case where Redux might not be available yet
  let clearAuthState = () => {
    console.log("Auth state cleared (default implementation)")
  }
  
  try {
    // Try to use the session service, but don't crash if not available
    const sessionService = useSessionService()
    if (sessionService && sessionService.clearAuthState) {
      clearAuthState = sessionService.clearAuthState
    }
  } catch (err) {
    console.warn("Session service not available", err)
  }
  
  // Derive these values directly without useState to reduce render cycles
  const isAuthenticated = status === 'authenticated' && !!session
  const isLoading = status === 'loading'
  const user = session?.user || null

  const initialize = useCallback(() => {
    setIsInitialized(true)
  }, [])

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

    try {
      // Clear server-side session cache
      invalidateSessionCache();
    } catch (e) {
      console.error("Error invalidating session cache:", e);
    }

    // Then sign out with NextAuth
    await signOut({ redirect: false })
  }, [clearAuthState])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isAuthenticated,
    userId: session?.user?.id,
    isLoading,
    isAdmin,
    user,
    guestId: null,
    logout,
    status,
    session,
    isInitialized,
    initialize
  }), [
    isAuthenticated, 
    session, 
    isLoading, 
    isAdmin, 
    user, 
    logout, 
    status, 
    isInitialized, 
    initialize
  ])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthConsumer')
  }
  return context
}
