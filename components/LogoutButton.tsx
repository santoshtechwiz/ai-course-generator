"use client"

import { useState } from "react"
import { LogOut, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface LogoutButtonProps {
  redirectTo?: string
  iconOnly?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function LogoutButton({ 
  redirectTo = "/", 
  iconOnly = false,
  className = "",
  variant = "outline",
  size = "sm"
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { logout } = useAuth()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      await logout({ redirect: true, callbackUrl: redirectTo })
    } catch (error) {
      console.error("Logout failed:", error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {!iconOnly && "Sign out"}
          <LogOut className={`h-4 w-4 ${iconOnly ? '' : 'ml-2'}`} />
        </>
      )}
    </Button>
  )
}
