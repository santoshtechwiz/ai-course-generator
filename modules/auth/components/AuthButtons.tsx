"use client"

import { LoginButton } from "./LoginButton"
import { LogoutButton } from "./LogoutButton"
import { useAuth } from "../providers/AuthProvider"

interface AuthButtonsProps {
  className?: string
}

export function AuthButtons({ className = "" }: AuthButtonsProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-9 w-20 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className={className}>
      {isAuthenticated ? <LogoutButton /> : <LoginButton />}
    </div>
  )
}
