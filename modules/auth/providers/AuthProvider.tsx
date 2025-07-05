'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  mapSubscriptionPlan, 
  mapSubscriptionStatus, 
  getFeaturesByPlanForAuth 
} from '@/app/dashboard/subscription/components/subscription-plans'
import type { SubscriptionPlanType } from '@/app/types/subscription'

// Types
export type User = {
  id: string
  email: string
  name: string
  username?: string
  avatarUrl?: string
  isEmailVerified: boolean
  stripeCustomerId?: string
  credits: number
  isAdmin: boolean
  createdAt: string
  updatedAt: string
  profileData?: {
    bio?: string
    website?: string
    location?: string
    socialLinks?: {
      twitter?: string
      linkedin?: string
      github?: string
    }
  }
}

export type Subscription = {
  id: string
  userId: string
  plan: SubscriptionPlanType
  status: 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
  features: {
    maxQuizzes: number
    maxFlashcards: number
    maxStudySessions: number
    advancedAnalytics: boolean
    prioritySupport: boolean
    customization: boolean
  }
}

export type AuthState = {
  isLoading: boolean
  isAuthenticated: boolean
  user: User | null
  subscription: Subscription | null
}

// Context
type AuthContextType = {
  state: AuthState
  signOut: () => Promise<void>
  refreshUserData: () => Promise<void>
  refreshSubscriptionData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider
type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    subscription: null
  })

  // Create user object from session data
  const createUserFromSession = (session: any): User | null => {
    if (!session?.user) return null

    return {
      id: session.user.id || 'session-user',
      email: session.user.email || '',
      name: session.user.name || '',
      username: session.user.name || '',
      avatarUrl: session.user.image || undefined,
      isEmailVerified: true,
      stripeCustomerId: undefined,
      credits: session.user.credits || 0,
      isAdmin: session.user.isAdmin || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profileData: undefined
    }
  }

  // Create subscription object from session data
  const createSubscriptionFromSession = (session: any): Subscription | null => {
    if (!session?.user) return null

    // SECURITY: Only use verified database data from session
    // Never infer subscription plans client-side - this is a security vulnerability
    const plan = mapSubscriptionPlan(session.user.subscriptionPlan)
    const subscriptionStatus = mapSubscriptionStatus(session.user.subscriptionStatus)
    const features = getFeaturesByPlanForAuth(plan)

    return {
      id: `session-${session.user.id}`,
      userId: session.user.id || 'session-user',
      plan,
      status: subscriptionStatus,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      features
    }
  }

  // Update state when session changes
  useEffect(() => {
    if (status === 'loading') {
      setState(prev => ({ ...prev, isLoading: true }))
      return
    }

    if (!session) {
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        subscription: null
      })
      return
    }

    // Create user and subscription from session data
    const user = createUserFromSession(session)
    const subscription = createSubscriptionFromSession(session)
    
    setState({
      isLoading: false,
      isAuthenticated: true,
      user,
      subscription
    })
  }, [session, status])

  // Refresh functions (simplified - just update from current session)
  const refreshUserData = async () => {
    if (session) {
      const user = createUserFromSession(session)
      setState(prev => ({ ...prev, user }))
    }
  }

  const refreshSubscriptionData = async () => {
    if (session) {
      const subscription = createSubscriptionFromSession(session)
      setState(prev => ({ ...prev, subscription }))
    }
  }

  // Sign out function (simplified)
  const handleSignOut = async () => {
    try {
      // Clear state immediately
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        subscription: null
      })
      
      // Call NextAuth signOut
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: false 
      })
      
      // Redirect to sign-in page
      router.push('/auth/signin')
      
    } catch (error) {
      console.error('Error during sign out:', error)
      // Force redirect even if there's an error
      router.push('/auth/signin')
    }
  }

  const contextValue: AuthContextType = {
    state,
    signOut: handleSignOut,
    refreshUserData,
    refreshSubscriptionData
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hooks
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  // Return both the full context and individual state properties for convenience
  return {
    ...context,
    isLoading: context.state.isLoading,
    isAuthenticated: context.state.isAuthenticated,
    user: context.state.user,
    subscription: context.state.subscription
  }
}

export function useUser() {
  const { state } = useAuth()
  return state.user
}

export function useSubscription() {
  const { state } = useAuth()
  return state.subscription
}

export function useAuthStatus() {
  const { state } = useAuth()
  return {
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    hasValidSession: state.isAuthenticated && state.user !== null
  }
}
