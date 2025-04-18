"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/providers/unified-auth-provider"

interface AuthStatusProps {
  children: React.ReactNode
  loadingComponent?: React.ReactNode
}

export function AuthStatus({ children, loadingComponent }: AuthStatusProps) {
  const { isLoading } = useAuth()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    // Add a small delay to ensure UI consistency
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  if (isInitializing || isLoading) {
    return (
      loadingComponent || (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    )
  }

  return <>{children}</>
}
