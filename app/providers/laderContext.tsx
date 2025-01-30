"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"

interface LoadingContextType {
  isLoading: boolean
  setLoading: (isLoading: boolean) => void
  progress: number
  setProgress: (progress: number) => void
  startNavigation: () => void
  completeNavigation: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export const useLoaderContext = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error("useLoaderContext must be used within a LoadingProvider")
  }
  return context
}

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading)
    if (!loading) {
      setProgress(100)
    } else {
      setProgress(0)
    }
  }, [])

  const startNavigation = useCallback(() => {
    setIsLoading(true)
    setProgress(0)
  }, [])

  const completeNavigation = useCallback(() => {
    setProgress(100)
    setTimeout(() => {
      setIsLoading(false)
    }, 300) // Delay to show the completed progress
  }, [])

  useEffect(() => {
    if (isLoading && progress < 90) {
      const timer = setTimeout(() => {
        setProgress((prevProgress) => Math.min(prevProgress + 10, 90))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, progress])

  const contextValue = React.useMemo(
    () => ({
      isLoading,
      setLoading,
      progress,
      setProgress,
      startNavigation,
      completeNavigation,
    }),
    [isLoading, progress, setLoading, startNavigation, completeNavigation],
  )

  return <LoadingContext.Provider value={contextValue}>{children}</LoadingContext.Provider>
}

