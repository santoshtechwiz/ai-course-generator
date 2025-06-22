"use client"

import { useState, useEffect } from "react"
import { LogOut, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useAuthInit } from "@/providers/enhanced-auth-provider"

interface LogoutButtonProps {
  redirectTo?: string
  iconOnly?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function LogoutButton({ 
  redirectTo = "/explore", // Redirect to /explore after logout
  iconOnly = false,
  className = "",
  variant = "outline",
  size = "sm"
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { logout } = useAuth()
  const { cleanLogout } = useAuthInit()
  const { toast } = useToast()

  // If logging out, show modal dialog and prevent scrolling
  useEffect(() => {
    if (isLoading && typeof window !== 'undefined') {
      document.body.style.overflow = 'hidden'
    } else if (typeof window !== 'undefined') {
      document.body.style.overflow = ''
    }
    return () => {
      if (typeof window !== 'undefined') document.body.style.overflow = ''
    }
  }, [isLoading])

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      
      // Set a flag in localStorage to indicate clean logout
      // This helps prevent automatic re-login attempts
      localStorage.setItem('next-auth.logout-clean', 'true')
      
      // Use our enhanced clean logout to prevent auto-relogin
      await cleanLogout(redirectTo)
      
      // Backup force navigation if the redirect doesn't happen
      // The setTimeout ensures we give NextAuth time to process the logout
      setTimeout(() => {
        if (typeof window !== 'undefined' && document.visibilityState === 'visible') {
          window.location.href = redirectTo
        }
      }, 1000)
    } catch (error) {
      console.error("Logout error:", error)
      setIsLoading(false)
      
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
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
            {!iconOnly && <span className="mr-2">Sign out</span>}
            <LogOut className="h-4 w-4" />
          </>
        )}
      </Button>
      <Dialog open={isLoading} onOpenChange={() => {}}>
        <DialogContent className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-lg font-semibold">Logging out...</div>
        </DialogContent>
      </Dialog>
    </>
  )
}
