"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import { QuizLoader, QuizPageLoader, QuizSubmissionLoader, QuizCalculationLoader } from "./QuizLoader"
import { LOADER_MESSAGES } from "@/constants/loader-messages"

type LoaderType = "page" | "submission" | "calculation" | "navigation" | "inline" | null
type LoaderState = "loading" | "success" | "error" | "idle"

interface LoaderConfig {
  type: LoaderType
  state: LoaderState
  message?: string
  progress?: number
  variant?: "spinner" | "dots" | "progress" | "skeleton" | "pulse"
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  autoHide?: boolean
  priority: number // Higher number = higher priority
}

interface QuizLoaderContextType {
  // State
  currentLoader: LoaderConfig | null
  isLoading: boolean
  
  // Actions
  showLoader: (config: Omit<LoaderConfig, "priority"> & { priority?: number }) => string
  hideLoader: (id?: string) => void
  updateLoader: (id: string, updates: Partial<LoaderConfig>) => void
  clearAllLoaders: () => void
  
  // Convenience methods
  showPageLoader: (message?: string) => string
  showSubmissionLoader: (message?: string) => string
  showCalculationLoader: (message?: string) => string
  showNavigationLoader: (message?: string) => string
}

const QuizLoaderContext = createContext<QuizLoaderContextType | null>(null)

export function useQuizLoader() {
  const context = useContext(QuizLoaderContext)
  if (!context) {
    throw new Error("useQuizLoader must be used within a QuizLoaderProvider")
  }
  return context
}

interface QuizLoaderProviderProps {
  children: React.ReactNode
}

export function QuizLoaderProvider({ children }: QuizLoaderProviderProps) {
  const [currentLoader, setCurrentLoader] = useState<LoaderConfig | null>(null)
  const [loaderQueue, setLoaderQueue] = useState<Map<string, LoaderConfig>>(new Map())
  const loaderIdCounter = useRef(0)
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Generate unique loader ID
  const generateId = useCallback(() => {
    loaderIdCounter.current += 1
    return `loader_${loaderIdCounter.current}_${Date.now()}`
  }, [])

  // Update current loader based on priority
  const updateCurrentLoader = useCallback(() => {
    if (loaderQueue.size === 0) {
      setCurrentLoader(null)
      return
    }

    // Find highest priority loader
    let highestPriority = -1
    let selectedLoader: LoaderConfig | null = null

    loaderQueue.forEach((loader) => {
      if (loader.priority > highestPriority) {
        highestPriority = loader.priority
        selectedLoader = loader
      }
    })

    setCurrentLoader(selectedLoader)
  }, [loaderQueue])

  // Show loader with configuration
  const showLoader = useCallback((config: Omit<LoaderConfig, "priority"> & { priority?: number }) => {
    const id = generateId()
    const loaderConfig: LoaderConfig = {
      ...config,
      priority: config.priority ?? getPriorityForType(config.type)
    }

    setLoaderQueue(prev => {
      const newQueue = new Map(prev)
      newQueue.set(id, loaderConfig)
      return newQueue
    })

    // Auto-hide after delay if specified
    if (loaderConfig.autoHide) {
      const timeout = setTimeout(() => {
        hideLoader(id)
      }, 3000) // Default 3 seconds
      
      timeoutRefs.current.set(id, timeout)
    }

    return id
  }, [generateId])

  // Hide specific loader
  const hideLoader = useCallback((id?: string) => {
    if (!id) {
      // Hide current loader if no ID specified
      if (currentLoader) {
        const currentId = Array.from(loaderQueue.entries())
          .find(([, loader]) => loader === currentLoader)?.[0]
        if (currentId) {
          setLoaderQueue(prev => {
            const newQueue = new Map(prev)
            newQueue.delete(currentId)
            return newQueue
          })
          
          // Clear timeout
          const timeout = timeoutRefs.current.get(currentId)
          if (timeout) {
            clearTimeout(timeout)
            timeoutRefs.current.delete(currentId)
          }
        }
      }
      return
    }

    setLoaderQueue(prev => {
      const newQueue = new Map(prev)
      newQueue.delete(id)
      return newQueue
    })

    // Clear timeout
    const timeout = timeoutRefs.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutRefs.current.delete(id)
    }
  }, [currentLoader, loaderQueue])

  // Update existing loader
  const updateLoader = useCallback((id: string, updates: Partial<LoaderConfig>) => {
    setLoaderQueue(prev => {
      const newQueue = new Map(prev)
      const existing = newQueue.get(id)
      if (existing) {
        newQueue.set(id, { ...existing, ...updates })
      }
      return newQueue
    })
  }, [])

  // Clear all loaders
  const clearAllLoaders = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
    timeoutRefs.current.clear()
    
    setLoaderQueue(new Map())
    setCurrentLoader(null)
  }, [])

  // Convenience methods
  const showPageLoader = useCallback((message = LOADER_MESSAGES.LOADING_QUIZ) => {
    return showLoader({
      type: "page",
      state: "loading",
      message,
      variant: "spinner",
      size: "lg"
    })
  }, [showLoader])

  const showSubmissionLoader = useCallback((message = LOADER_MESSAGES.CALCULATING_RESULTS) => {
    return showLoader({
      type: "submission", 
      state: "loading",
      message,
      variant: "spinner",
      size: "lg"
    })
  }, [showLoader])

  const showCalculationLoader = useCallback((message = LOADER_MESSAGES.ANALYZING_PERFORMANCE) => {
    return showLoader({
      type: "calculation",
      state: "loading", 
      message,
      variant: "spinner",
      size: "lg"
    })
  }, [showLoader])

  const showNavigationLoader = useCallback((message = LOADER_MESSAGES.LOADING_NEXT_QUESTION) => {
    return showLoader({
      type: "navigation",
      state: "loading",
      message,
      variant: "dots",
      size: "sm",
      autoHide: true
    })
  }, [showLoader])

  // Update current loader when queue changes
  useEffect(() => {
    updateCurrentLoader()
  }, [loaderQueue, updateCurrentLoader])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
      timeoutRefs.current.clear()
    }
  }, [])

  const contextValue: QuizLoaderContextType = {
    currentLoader,
    isLoading: currentLoader !== null,
    showLoader,
    hideLoader,
    updateLoader,
    clearAllLoaders,
    showPageLoader,
    showSubmissionLoader,
    showCalculationLoader,
    showNavigationLoader
  }

  return (
    <QuizLoaderContext.Provider value={contextValue}>
      {children}
      {/* Render current loader */}
      {currentLoader && (
        <LoaderRenderer config={currentLoader} />
      )}
    </QuizLoaderContext.Provider>
  )
}

// Helper function to get priority for loader type
function getPriorityForType(type: LoaderType): number {
  switch (type) {
    case "page": return 1
    case "navigation": return 2
    case "inline": return 3
    case "calculation": return 4
    case "submission": return 5 // Highest priority
    default: return 0
  }
}

// Component to render the appropriate loader based on config
function LoaderRenderer({ config }: { config: LoaderConfig }) {
  const commonProps = {
    state: config.state,
    message: config.message,
    progress: config.progress,
    variant: config.variant || "spinner",
    size: config.size || "md"
  }

  switch (config.type) {
    case "page":
      return <QuizPageLoader {...commonProps} />
    case "submission":
      return <QuizSubmissionLoader {...commonProps} />
    case "calculation":
      return <QuizCalculationLoader {...commonProps} />
    case "navigation":
      return <QuizLoader {...commonProps} inline context="navigation" />
    case "inline":
      return <QuizLoader {...commonProps} inline context="initial" />
    default:
      return <QuizLoader {...commonProps} />
  }
}