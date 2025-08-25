"use client"

import { createContext, useContext } from "react"

export interface LoaderContextType {
  isLoading: boolean
  setLoading: (loading: boolean) => void
}

export const LoaderContext = createContext<LoaderContextType | undefined>(undefined)

export function useGlobalLoader(): LoaderContextType {
  const context = useContext(LoaderContext)
  if (!context) {
    throw new Error("useGlobalLoader must be used within a GlobalLoadingProvider")
  }
  return context
}
