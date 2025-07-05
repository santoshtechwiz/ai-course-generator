"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "../providers/AuthProvider"
import { useToast } from "@/hooks"

interface LogoutButtonProps {
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  iconOnly?: boolean
  redirectTo?: string
}

export function LogoutButton({ 
  className = "",
  variant = "outline",
  size = "sm",
  iconOnly = false,
  redirectTo = "/auth/signin"
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { signOut } = useAuth()
  const { toast } = useToast()

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({ callbackUrl: redirectTo })
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSignOut}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      <LogOut className="h-4 w-4" />
      {!iconOnly && <span className="ml-2">Sign Out</span>}
    </Button>
  )
}
