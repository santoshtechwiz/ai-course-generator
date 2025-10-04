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
        <div className="h-11 w-full max-w-[80px] sm:max-w-[100px] bg-gray-200 rounded min-h-[44px]"></div>
      </div>
    )
  }

  return (
    <div className={className}>
      {isAuthenticated ? <LogoutButton /> : <LoginButton />}
    </div>
  )
}
