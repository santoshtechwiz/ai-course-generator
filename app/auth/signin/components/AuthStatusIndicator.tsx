"use client"

import { Loader2, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks"

export function AuthStatusIndicator() {
  const { isAuthenticated, isLoading, user, logout, login } = useAuth()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await logout({ redirect: true, callbackUrl: "/" })
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSignIn = async () => {
    try {
      await login("google", { callbackUrl: "/dashboard" })
    } catch (error) {
      console.error("Sign in error:", error)
      toast({
        title: "Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking authentication...</span>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-green-500" />
        <span>Signed in as {user.name || user.email}</span>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign Out
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
      >
        Sign In
      </Button>
    </div>
  )
}
