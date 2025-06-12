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
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { selectAuth, selectUser, selectAuthStatus, loginSuccess, logout as reduxLogout } from '@/store/slices/auth-slice'

// We'll handle Redux dependency differently to avoid context errors
export interface AuthContextValue {
  user: any
  token: string | null
  status: 'authenticated' | 'loading' | 'unauthenticated' | 'idle'
  error: string | null
  isInitialized: boolean
  isAdmin: boolean
  guestId: string | null
  session: any
  logout: (options?: { redirect?: boolean, callbackUrl?: string }) => Promise<void>
  initialize: () => void
  
  // Computed properties for convenience/backward compatibility
  userId: string | undefined
  isAuthenticated: boolean
  isLoading: boolean
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
  const { data: session, status: nextAuthStatus } = useSession()
  const dispatch = useDispatch()
  const reduxAuthState = useSelector(selectAuth)
  
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Add ref to track if we've checked admin status to break infinite loops
  const authCheckRef = useRef(false)
  const syncedWithReduxRef = useRef(false)
  
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
  
  // Sync NextAuth session to Redux store
  useEffect(() => {
    // Only update Redux if session changes and we have a valid session
    if (session && nextAuthStatus === 'authenticated' && !syncedWithReduxRef.current) {
      syncedWithReduxRef.current = true;
      
      try {
        dispatch(loginSuccess({ 
          user: session.user, 
          token: session.user.accessToken || null 
        }));
        
        // Initialize our context state too
        setIsInitialized(true);
        setIsAdmin(!!session.user?.isAdmin);
        setError(null);
      } catch (err) {
        console.error("Error syncing auth state:", err);
      }
    } 
    // Reset when session is gone but we have Redux auth
    else if (!session && nextAuthStatus === 'unauthenticated' && 
             reduxAuthState.status === 'authenticated' && syncedWithReduxRef.current) {
      syncedWithReduxRef.current = false;
      
      try {
        dispatch(reduxLogout());
      } catch (err) {
        console.error("Error during logout:", err);
      }
    }
  }, [session, nextAuthStatus, dispatch, reduxAuthState.status]);
  
  // Map NextAuth status to our unified status
  const status = useMemo(() => {
    // First check Redux for initialization status
    if (!reduxAuthState.isInitialized && !isInitialized) return 'idle';
    if (nextAuthStatus === 'loading') return 'loading';
    if (nextAuthStatus === 'authenticated' && session) return 'authenticated';
    return 'unauthenticated';
  }, [nextAuthStatus, session, isInitialized, reduxAuthState.isInitialized]);
  
  // Compute these values directly
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const user = session?.user || reduxAuthState.user || null;
  const token = session?.token || reduxAuthState.token || null;

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
  const logout = useCallback(async (options = { redirect: false, callbackUrl: '/' }) => {
    // First clean up all session data
    clearAuthState()
    
    // Dispatch Redux logout action
    dispatch(reduxLogout())
    
    syncedWithReduxRef.current = false;

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
    if (options.redirect) {
      await signOut({ callbackUrl: options.callbackUrl, redirect: true });
    } else {
      await signOut({ redirect: false });
    }
  }, [clearAuthState, dispatch])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    token,
    status,
    error: error || reduxAuthState.error,
    isInitialized: isInitialized || reduxAuthState.isInitialized,
    isAdmin,
    guestId: null,
    session,
    logout,
    initialize,
    
    // Computed properties
    userId: user?.id,
    isAuthenticated,
    isLoading
  }), [
    user, 
    token,
    status,
    error,
    reduxAuthState.error,
    isInitialized,
    reduxAuthState.isInitialized,
    isAdmin,
    session,
    logout,
    initialize,
    isAuthenticated,
    isLoading
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
