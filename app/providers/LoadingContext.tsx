"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"

interface LoadingContextType {
  isLoading: boolean
  setLoading: (isLoading: boolean) => void
  progress: number
  setProgress: (progress: number) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export const useLoaderContext = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider")
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
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      setProgress(100)
    }
  }, [isLoading])

  const contextValue = React.useMemo(
    () => ({
      isLoading,
      setLoading,
      progress,
      setProgress,
    }),
    [isLoading, progress, setLoading],
  )

  return <LoadingContext.Provider value={contextValue}>{children}</LoadingContext.Provider>
}

