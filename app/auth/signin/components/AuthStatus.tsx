"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/modules/auth"


interface AuthStatusProps {
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  minLoadingTime?: number
}

export function AuthStatus({ 
  children, 
  loadingComponent,
  minLoadingTime = 300 
}: AuthStatusProps) {
  const { isLoading } = useAuth()
  const [isInitializing, setIsInitializing] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Add a small delay to ensure UI consistency
    timerRef.current = setTimeout(() => {
      setIsInitializing(false)
    }, minLoadingTime)
    
    // Clear timeout on unmount to prevent memory leaks
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [minLoadingTime])

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
