"use client"

import { LogIn } from "lucide-react"
import { GlobalLoader } from "@/components/ui/loader"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks"

interface LoginButtonProps {
  provider?: string
  callbackUrl?: string
  iconOnly?: boolean
  text?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function LoginButton({
  provider = "google",
  callbackUrl,
  iconOnly = false,
  text = "Sign In",
  className = "",
  variant = "ghost",
  size = "sm"
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      
      // Use current path for redirect if not specified
      let redirectUrl = callbackUrl;
      if (!redirectUrl && typeof window !== 'undefined') {
        redirectUrl = window.location.pathname + window.location.search;
      }
      
      await login(provider, { callbackUrl: redirectUrl });
      // We won't reach here if the redirect happens successfully
    } catch (error) {
      console.error("Login failed:", error)
      toast({
        title: "Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogin}
      disabled={isLoading}
      className={`${className}`}
    >      {isLoading ? (
        <GlobalLoader size="xs" className="h-4 w-4" />
      ) : (
        <>
          {!iconOnly && <span className="mr-2">{text}</span>}
          <LogIn className="h-4 w-4" />
        </>
      )}
    </Button>
  )
}
