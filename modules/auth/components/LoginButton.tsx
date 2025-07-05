"use client"

import { useState } from "react"
import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "../providers/AuthProvider"

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
  const { signIn } = useAuth()

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn()
    } finally {
      setIsLoading(false)
    }
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
