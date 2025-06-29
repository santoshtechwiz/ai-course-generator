"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { CourseAILoader, type LoaderProps } from "./loader"

interface LoaderContextType {
  showLoader: (options?: Partial<LoaderProps>) => void
  hideLoader: () => void
  updateLoader: (options: Partial<LoaderProps>) => void
  isLoading: boolean
  loaderId: string | null
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
  const [loaderId, setLoaderId] = useState<string | null>(null)
  const [options, setOptions] = useState<Partial<LoaderProps>>({
    message: "Loading...",
    variant: "fullscreen",
    context: "loading",
    showIcon: true,
    animated: true,
    ...defaultOptions,
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadingQueueRef = useRef<Set<string>>(new Set())

  const showLoader = useCallback((newOptions?: Partial<LoaderProps>) => {
    const id = Math.random().toString(36).substr(2, 9)

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Add to loading queue
    loadingQueueRef.current.add(id)

    setOptions((prev) => ({ ...prev, ...(newOptions || {}) }))
    setLoaderId(id)
    setIsLoading(true)

    return id
  }, [])

  const hideLoader = useCallback((id?: string) => {
    if (id && loadingQueueRef.current.has(id)) {
      loadingQueueRef.current.delete(id)
    } else if (!id) {
      // Clear all loaders if no specific ID provided
      loadingQueueRef.current.clear()
    }

    // Only hide if no other loaders are active
    if (loadingQueueRef.current.size === 0) {
      // Graceful exit with animation
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false)
        setLoaderId(null)
      }, 150)
    }
  }, [])

  const updateLoader = useCallback(
    (newOptions: Partial<LoaderProps>) => {
      if (isLoading) {
        setOptions((prev) => ({ ...prev, ...newOptions }))
      }
    },
    [isLoading],
  )

  // Auto-hide loader on route changes
  const pathname = usePathname()
  const prevPathnameRef = useRef(pathname)

  useEffect(() => {
    if (prevPathnameRef.current !== pathname && isLoading) {
      // Clear all loaders on route change
      loadingQueueRef.current.clear()
      hideLoader()
      prevPathnameRef.current = pathname
    }
  }, [pathname, isLoading, hideLoader])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      loadingQueueRef.current.clear()
    }
  }, [])

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader, updateLoader, isLoading, loaderId }}>
      {children}
      {isLoading && <CourseAILoader isLoading={isLoading} {...options} />}
    </LoaderContext.Provider>
  )
}
