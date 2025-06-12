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
import { useSession, signOut, signIn, SessionProvider, SessionProviderProps } from 'next-auth/react'
import { invalidateSessionCache } from '@/lib/auth'
import { useRouter } from 'next/navigation'

// Instead of importing directly, check if Redux is available at runtime
let useDispatch: () => any;
let reduxLogout: () => any;
let loginSuccess: (payload: any) => any;

// Try to import Redux - we'll handle the case where it's not available
try {
  const redux = require('@/store/slices/auth-slice');
  reduxLogout = redux.logout;
  loginSuccess = redux.loginSuccess;
  
  const reactRedux = require('react-redux');
  useDispatch = reactRedux.useDispatch;
} catch (error) {
  // Create stub functions if Redux is not available
  useDispatch = () => (action: any) => console.log('Redux not available, action:', action);
  reduxLogout = () => ({ type: 'auth/logout' });
  loginSuccess = (payload: any) => ({ type: 'auth/loginSuccess', payload });
}

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
  login: (provider: string, options?: { callbackUrl?: string }) => Promise<void>
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
      <AuthConsumer>{children}</AuthConsumer>
    </SessionProvider>
  )
}

interface AuthConsumerProps {
  children: ReactNode
}

export function AuthConsumer({ children }: AuthConsumerProps) {
  const { data: session, status: nextAuthStatus } = useSession()
  
  // Use a ref to store the dispatch function that we can safely call
  const dispatchRef = useRef<((action: any) => void) | null>(null)
  
  // Try to get the dispatch function, but don't crash if Redux is not available
  useEffect(() => {
    try {
      const dispatch = useDispatch();
      if (typeof dispatch === 'function') {
        dispatchRef.current = dispatch;
      }
    } catch (error) {
      console.warn("Redux dispatch not available:", error);
      // Create a dummy dispatch function
      dispatchRef.current = (action) => {
        console.log("Redux action dispatched without Redux provider:", action);
      };
    }
  }, []);
  
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Add ref to track if we've checked admin status to break infinite loops
  const authCheckRef = useRef(false)
  const syncedWithReduxRef = useRef(false)
  
  // Clean method to clear all auth-related state and storage
  const clearAuthState = useCallback(() => {
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

    // Dispatch Redux logout action if Redux is available
    try {
      if (dispatchRef.current) {
        dispatchRef.current(reduxLogout());
      }
    } catch (err) {
      console.warn("Redux dispatch failed:", err)
    }
    
    // Reset context state
    syncedWithReduxRef.current = false;
    authCheckRef.current = false;
    setIsAdmin(false);
  }, [])
  
  // Sync NextAuth session to Redux store
  useEffect(() => {
    // Only update Redux if session changes and we have a valid session
    if (session && nextAuthStatus === 'authenticated' && !syncedWithReduxRef.current) {
      syncedWithReduxRef.current = true;
      
      try {
        if (dispatchRef.current) {
          dispatchRef.current(loginSuccess({ 
            user: session.user, 
            token: session.user.accessToken || null 
          }));
        }
        
        // Initialize our context state too
        setIsInitialized(true);
        setIsAdmin(!!session.user?.isAdmin);
        setError(null);
      } catch (err) {
        console.error("Error syncing auth state:", err);
      }
    } 
    // Reset when session is gone but we still have Redux auth
    else if (!session && nextAuthStatus === 'unauthenticated' && syncedWithReduxRef.current) {
      clearAuthState();
    }
  }, [session, nextAuthStatus, clearAuthState]);
  
  // Map NextAuth status to our unified status
  const status = useMemo(() => {
    // First check for initialization status
    if (!isInitialized && nextAuthStatus === 'loading') return 'idle';
    if (nextAuthStatus === 'loading') return 'loading';
    if (nextAuthStatus === 'authenticated' && session) return 'authenticated';
    return 'unauthenticated';
  }, [nextAuthStatus, session, isInitialized]);
  
  // Compute these values directly
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const user = session?.user || null;
  const token = session?.user?.accessToken || null;

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
  const logout = useCallback(async (options = { redirect: true, callbackUrl: '/' }) => {
    // First clean up all session data
    clearAuthState();
    
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
  }, [clearAuthState])

  // Centralized login function
  const login = useCallback(async (provider: string, options = { callbackUrl: '/dashboard' }) => {
    if (!provider) {
      setError("No authentication provider specified");
      return;
    }

    try {
      await signIn(provider, { callbackUrl: options.callbackUrl });
    } catch (error) {
      console.error(`Login error with provider ${provider}:`, error);
      setError(`Failed to login with ${provider}`);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    token,
    status,
    error,
    isInitialized,
    isAdmin,
    guestId: null,
    session,
    logout,
    login,
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
    isInitialized,
    isAdmin,
    session,
    logout,
    login,
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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Legacy alias for backward compatibility
export function useAuthContext(): AuthContextValue {
  return useAuth()
}
