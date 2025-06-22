"use client"

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  useRef,
  type ReactNode 
} from "react"
import { SessionProvider, signOut } from "next-auth/react"
import { useAppDispatch } from "@/store/hooks"
import { 
  initializeAuth,
  loginSuccess, 
  loginFailure, 
  logout as reduxLogout,
  setUser
} from "@/store/slices/auth-slice"
import { resetSubscriptionState } from "@/store/slices/subscription-slice"

/**
 * Enhanced Auth Provider
 *
 * Centralized provider that coordinates:
 * 1. NextAuth SessionProvider
 * 2. Redux auth state
 * 3. Session fetching optimization
 * 4. Clean logout handling
 *
 * This provider ensures session data is fetched only once and
 * properly synchronized between NextAuth and Redux
 */

type EnhancedAuthProviderProps = {
  children: ReactNode
  session?: any
}

// Context to track auth initialization and provide centralized methods
const AuthInitContext = createContext<{
  isInitialized: boolean
  clearAllAuthData: () => void
  cleanLogout: (redirectUrl?: string) => Promise<void>
}>({
  isInitialized: false,
  clearAllAuthData: () => {},
  cleanLogout: async () => {}
})

export const useAuthInit = () => useContext(AuthInitContext)

// Helper function to clear all auth-related data from storage
const clearAllAuthStorage = () => {
  if (typeof window === "undefined") return

  try {
    // Clear next-auth tokens which cause auto-login
    document.cookie = "next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax"
    document.cookie = "next-auth.csrf-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax"
    document.cookie = "next-auth.callback-url=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax"
    document.cookie = "__Secure-next-auth.callback-url=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax"
    
    // Clear localStorage items
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.includes('persist:') || 
      key.includes('auth') || 
      key.includes('redux') || 
      key.includes('next-auth') ||
      key.includes('quiz') ||
      key.includes('course') ||
      key === 'pendingQuizResults'
    )
    
    localStorageKeys.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (e) {
        console.warn("Failed to remove localStorage item:", key, e)
      }
    })
    
    // Clear sessionStorage items
    const sessionStorageKeys = Object.keys(sessionStorage).filter(key => 
      key.includes('next-auth') || 
      key.includes('redux') || 
      key.includes('quiz') || 
      key.includes('guestId')
    )
    
    sessionStorageKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key)
      } catch (e) {
        console.warn("Failed to remove sessionStorage item:", key, e)
      }
    })
  } catch (error) {
    console.error("Error clearing auth storage:", error)
  }
}

export function EnhancedAuthProvider({ children, session }: EnhancedAuthProviderProps) {
  const dispatch = useAppDispatch()
  const [isInitialized, setIsInitialized] = useState(false)
  const authActionsBlocked = useRef<boolean>(false)
  
  // Clean and comprehensive logout function
  const cleanLogout = useCallback(async (redirectUrl = "/") => {
    try {
      // 1. Block concurrent auth actions
      authActionsBlocked.current = true
      
      // 2. Clear Redux state first
      dispatch(reduxLogout())
      dispatch(resetSubscriptionState())
      dispatch(setUser(null))
      
      // 3. Clear all storage
      clearAllAuthStorage()
      
      // 4. Call NextAuth signOut as the last step
      // Setting redirect to true and using callbackUrl ensures complete navigation away
      await signOut({ 
        redirect: true, 
        callbackUrl: redirectUrl
      })
    } catch (error) {
      console.error("Clean logout failed:", error)
      // Force hard navigation on error as fallback
      if (typeof window !== "undefined") {
        window.location.href = redirectUrl
      }
    } finally {
      authActionsBlocked.current = false
    }
  }, [dispatch])

  // Function to clear auth data without redirect
  const clearAllAuthData = useCallback(() => {
    dispatch(reduxLogout())
    dispatch(resetSubscriptionState())
    clearAllAuthStorage()
  }, [dispatch])

  // Initialize auth state from session on mount
  useEffect(() => {
    if (authActionsBlocked.current) return
    
    if (session) {
      // If session was provided via props (from SSR), use it directly
      dispatch(
        loginSuccess({
          user: session?.user || null,
          token: session?.user?.accessToken || null,
        })
      )
      setIsInitialized(true)
    } else {
      // Otherwise initialize from client-side
      dispatch(initializeAuth())
        .unwrap()
        .then(() => {
          setIsInitialized(true)
        })
        .catch((error) => {
          console.error("Auth initialization error:", error)
          setIsInitialized(true) // Still mark as initialized to prevent infinite loading
        })
    }

    // Add window event listener for storage events (for cross-tab logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "next-auth.logout" && e.newValue === "true") {
        // Another tab triggered logout, sync this tab
        dispatch(reduxLogout())
        dispatch(resetSubscriptionState())
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange)
      }
    }
  }, [dispatch, session])

  return (
    <AuthInitContext.Provider
      value={{ isInitialized, clearAllAuthData, cleanLogout }}
    >
      {/* 
        Configure SessionProvider to minimize API calls:
        - Set refetchInterval to 0 to disable polling
        - Disable refetches on window focus
      */}
      <SessionProvider 
        session={session} 
        refetchInterval={0} 
        refetchOnWindowFocus={false}
        refetchWhenOffline={false}
      >
        {children}
      </SessionProvider>
    </AuthInitContext.Provider>
  )
}
