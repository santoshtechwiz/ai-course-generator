"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"


interface AuthContextType {
  isLoading: boolean
  isAuthenticated: boolean
  user: any
  credits: number
  subscriptionPlan: string
  signInWithProvider: (provider: string, callbackUrl?: string) => Promise<void>
  signInWithCredentials: (email: string, password: string, callbackUrl?: string) => Promise<boolean>
  signOutUser: (callbackUrl?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState<boolean>(status === "loading")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setIsLoading(status === "loading")
  }, [status])

  // Debug session status
  useEffect(() => {
    console.log("Session status:", status)
    console.log("Session data:", session)
  }, [session, status])

  const signInWithProvider = async (provider: string, callbackUrl = "/") => {
    setIsLoading(true)
    try {
      // We need to handle the case where provider might be undefined
      const providerToUse = provider?.toLowerCase() || "credentials"
      console.log(`Signing in with provider: ${providerToUse}`)

      // For OAuth providers, we need to redirect
      await signIn(providerToUse, { callbackUrl })

      // Note: For OAuth providers, the code below won't execute because of the redirect
      toast({
        title: "Success!",
        description: "You've been successfully logged in.",
      })
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      toast({
        title: "Authentication failed",
        description: `Failed to sign in with ${provider || "provider"}. Please try again.`,
        variant: "destructive",
      })
      setIsLoading(false)
    }
    // We don't set isLoading to false here for OAuth providers because we're redirecting
  }

  const signInWithCredentials = async (email: string, password: string, callbackUrl = "/") => {
    setIsLoading(true)
    try {
      console.log(`Signing in with credentials, redirecting to: ${callbackUrl}`)
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      console.log("Credentials sign-in result:", result)

      if (result?.error) {
        toast({
          title: "Authentication failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
        return false
      }

      toast({
        title: "Success!",
        description: "You've been successfully logged in.",
      })

      router.push(callbackUrl)
      return true
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signOutUser = async (callbackUrl = "/") => {
    setIsLoading(true)
    try {
      console.log("Signing out")
      await signOut({ callbackUrl })
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Sign out failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated: !!session?.user,
        user: session?.user,
        credits: session?.user?.credits || 0,
        subscriptionPlan: session?.user?.subscriptionPlan || "FREE",
        signInWithProvider,
        signInWithCredentials,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
