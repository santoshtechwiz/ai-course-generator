"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Loader, type LoaderProps } from "./loader"

interface LoaderContextType {
  showLoader: (options?: Partial<LoaderProps>) => void
  hideLoader: () => void
  updateLoader: (options: Partial<LoaderProps>) => void
  isLoading: boolean
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined)

export function useLoader() {
  const context = useContext(LoaderContext)
  if (!context) {
    throw new Error("useLoader must be used within a LoaderProvider")
  }
  return context
}

interface LoaderProviderProps {
  children: React.ReactNode
  defaultOptions?: Partial<LoaderProps>
}

export function LoaderProvider({ children, defaultOptions = {} }: LoaderProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [options, setOptions] = useState<Partial<LoaderProps>>({
    message: "Loading...",
    variant: "fullscreen",
    context: "loading",
    showIcon: true,
    animated: true,
    ...defaultOptions,
  })

  const showLoader = useCallback((newOptions?: Partial<LoaderProps>) => {
    setOptions((prev) => ({ ...prev, ...(newOptions || {}) }))
    setIsLoading(true)
  }, [])

  const hideLoader = useCallback(() => {
    // Graceful exit with animation
    setTimeout(() => setIsLoading(false), 150)
  }, [])

  const updateLoader = useCallback((newOptions: Partial<LoaderProps>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }))
  }, [])

  // Auto-hide loader on route changes
  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = useState(pathname)

  useEffect(() => {
    if (prevPathname !== pathname && isLoading) {
      hideLoader()
      setPrevPathname(pathname)
    }
  }, [pathname, prevPathname, isLoading, hideLoader])

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader, updateLoader, isLoading }}>
      {children}
      <Loader isLoading={isLoading} {...options} />
    </LoaderContext.Provider>
  )
}
