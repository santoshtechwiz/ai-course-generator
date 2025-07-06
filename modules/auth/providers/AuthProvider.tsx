"use client"

import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useAppDispatch } from '@/store'
import { fetchSubscription, forceSyncSubscription } from '@/store/slices/subscription-slice'

// Types
export interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  credits?: number
  creditsUsed?: number
  isAdmin?: boolean
  userType?: string
  subscriptionPlan?: string | null
  subscriptionStatus?: string | null
}

export interface Subscription {
  plan: string
  status: string
  isActive: boolean
  credits: number
  tokensUsed: number
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
}

export interface AuthState {
  user: User | null
  subscription: Subscription | null
  isAuthenticated: boolean
  isLoading: boolean
  refreshUserData: () => Promise<void>
  refreshSubscription: () => Promise<void>
  syncWithBackend: () => Promise<void>
}

// Context
const AuthContext = createContext<AuthState | undefined>(undefined)

// Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession()
  const dispatch = useAppDispatch()
    // Refresh functions
  const refreshUserData = useCallback(async () => {
    try {
      // Use NextAuth's update mechanism to refresh the session with latest backend data
      await update()
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }, [update])

  const refreshSubscription = useCallback(async () => {
    try {
      // Force refresh the subscription data from Redux
      await dispatch(fetchSubscription({ forceRefresh: true })).unwrap()
    } catch (error) {
      console.error('Failed to refresh subscription data:', error)
    }
  }, [dispatch])

  const syncWithBackend = useCallback(async () => {
    try {
      // 1. Force sync with Stripe/backend to ensure consistency
      await dispatch(forceSyncSubscription()).unwrap()
      // 2. Refresh the session to get the latest auth data
      await update()
    } catch (error) {
      console.error('Failed to sync with backend:', error)
    }
  }, [dispatch, update])
    // Transform session data to our auth state
  const user: User | null = session?.user ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    credits: session.user.credits || 0,
    creditsUsed: session.user.creditsUsed || 0,
    isAdmin: session.user.isAdmin || false,
    userType: session.user.userType || 'FREE',
    subscriptionPlan: session.user.subscriptionPlan,
    subscriptionStatus: session.user.subscriptionStatus,
  } : null

  // Map subscription data from session
  const subscription: Subscription | null = user ? {
    plan: user.subscriptionPlan || 'FREE',
    status: user.subscriptionStatus || 'INACTIVE',
    isActive: user.subscriptionStatus === 'ACTIVE',
    credits: user.credits || 0,
    tokensUsed: 0, // This would come from session if needed
    currentPeriodEnd: null, // This would come from session if needed
    cancelAtPeriodEnd: false,
  } : null

  const authState: AuthState = {
    user,
    subscription,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    refreshUserData,
    refreshSubscription,
    syncWithBackend,
  }

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  )
}

// Hooks
export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useUser(): User | null {
  return useAuth().user
}

export function useSubscription(): Subscription | null {
  return useAuth().subscription
}

export function useAuthStatus(): { isAuthenticated: boolean; isLoading: boolean } {
  const { isAuthenticated, isLoading } = useAuth()
  return { isAuthenticated, isLoading }
}
