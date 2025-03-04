"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const GlobalLoader: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const handleStart = () => setIsLoading(true)
    const handleComplete = () => setIsLoading(false)

    handleStart()
    const timer = setTimeout(() => handleComplete(), 500) // Simulate a minimum loading time

    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={cn(
        "fixed top-0 left-0 w-full h-1 bg-primary z-50 transition-all duration-300 ease-in-out",
        isLoading ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="h-full w-full bg-primary animate-loader" />
    </div>
  )
}

export default GlobalLoader

