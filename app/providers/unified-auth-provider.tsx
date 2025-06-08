"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { UserData } from "@/app/types/auth-types"
import { useSessionService } from "@/app/hooks/useSessionService"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  user: UserData | null
  signInWithProvider: (provider: string, callbackUrl?: string) => Promise<void>
  signInWithCredentials: (email: string, password: string, callbackUrl?: string) => Promise<boolean>
  signOutUser: (callbackUrl?: string) => Promise<void>
  fetchUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { 
    session, 
    authStatus: status, 
    isLoading: sessionLoading, 
    restoreAuthRedirectState, 
    clearAuthState 
  } = useSessionService()
  
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true)
      
      if (status === "loading") {
        return
      }

      if (session?.user?.id) {
        try {
          // Fetch full user data from API if needed
          const response = await fetch("/api/profile")
          if (response.ok) {
            const userData = await response.json()
            setUser({
              ...session.user,
              ...userData.user
            } as UserData)
            
            // Check for redirect state after successful login
            const redirectState = restoreAuthRedirectState()
            if (redirectState?.redirectPath) {
              router.push(redirectState.redirectPath)
              clearAuthState()
            }
          } else {
            // If API fetch fails, use session data as fallback
            setUser(session.user as UserData)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          // Use session data as fallback
          setUser(session.user as UserData)
        }
      } else {
        setUser(null)
      }
      
      setIsLoading(false)
    }

    initializeAuth()
  }, [session, status, router, restoreAuthRedirectState, clearAuthState])

  const signInWithProvider = async (provider: string, callbackUrl?: string): Promise<void> => {
    await signIn(provider, { callbackUrl })
  }

  const signInWithCredentials = async (
    email: string, 
    password: string, 
    callbackUrl?: string
  ): Promise<boolean> => {
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        return false
      }

      if (callbackUrl) {
        router.push(callbackUrl)
      }
      
      return true
    } catch (error) {
      console.error("Error in credential sign-in:", error)
      return false
    }
  }

  const signOutUser = async (callbackUrl?: string): Promise<void> => {
    await signOut({ callbackUrl })
  }

  const fetchUserData = async (): Promise<void> => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const userData = await response.json()
        setUser({
          ...session.user,
          ...userData.user
        } as UserData)
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session?.user,
        isLoading: sessionLoading || isLoading,
        isAdmin: !!user?.isAdmin,
        user,
        signInWithProvider,
        signInWithCredentials,
        signOutUser,
        fetchUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
