"use client"

import { Loader2, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks"
import { useAuth } from "@/hooks"
import { useState } from "react"

export function AuthStatusIndicator() {
  const { isAuthenticated, isLoading, user, logout, login } = useAuth()
  const { toast } = useToast()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      // Use the current URL as the redirect target
      const currentPath = typeof window !== 'undefined' 
        ? window.location.pathname + window.location.search 
        : '/';
      
      // Call the logout function from auth context
      await logout({ redirect: true, callbackUrl: currentPath })
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
      setIsSigningOut(false)
    }
  }

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true)
      // Get current page for redirect after login
      const currentPath = typeof window !== 'undefined' 
        ? window.location.pathname + window.location.search 
        : '/';
      
      await login("google", { callbackUrl: currentPath })
    } catch (error) {
      console.error("Sign in error:", error)
      toast({
        title: "Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      })
      setIsSigningIn(false)
    }
  }

  // Use an inline loading state instead of hydrating with different content
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-green-500" />
        <span className="truncate max-w-[150px]">
          {user.name || user.email}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              <span>Signing out...</span>
            </>
          ) : (
            <span>Sign Out</span>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <UserX className="h-4 w-4 text-red-500" />
      <span>Not signed in</span>
      <Button
        variant="outline" 
        size="sm" 
        onClick={handleSignIn}
        disabled={isSigningIn}
      >
        {isSigningIn ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </Button>
    </div>
  )
}
