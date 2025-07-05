"use client"

import { useState } from "react"
import { LogIn } from "lucide-react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface LoginButtonProps {
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  iconOnly?: boolean
}

export function LoginButton({ 
  className = "",
  variant = "default",
  size = "default",
  iconOnly = false
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = () => {
    setIsLoading(true)
    // Direct redirect to NextAuth sign-in page
    window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      <LogIn className="h-4 w-4" />
      {!iconOnly && <span className="ml-2">Sign In</span>}
    </Button>
  )
}
