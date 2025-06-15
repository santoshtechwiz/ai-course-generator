"use client"

import { useState, useEffect } from "react"
import { LogOut, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks"
import { Dialog, DialogContent } from "@/components/ui/dialog"

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
  const { toast } = useToast()

  // If logging out, show modal dialog
  useEffect(() => {
    if (isLoading && typeof window !== 'undefined') {
      document.body.style.overflow = 'hidden';
    } else if (typeof window !== 'undefined') {
      document.body.style.overflow = '';
    }
    return () => {
      if (typeof window !== 'undefined') document.body.style.overflow = '';
    }
  }, [isLoading])

  const handleLogout = async () => {
    const targetPath = "/explore";
    try {
      setIsLoading(true)
      await logout({ 
        redirect: true,
        callbackUrl: targetPath
      });
      if (typeof window !== 'undefined') {
        window.location.href = targetPath;
      }
    } catch (error) {
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
      <Dialog open={isLoading}>
        <DialogContent className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-lg font-semibold">Logging out...</div>
        </DialogContent>
      </Dialog>
    </>
  )
}
