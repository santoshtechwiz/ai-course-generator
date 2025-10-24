"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { CentralizedLoader } from "./CentralizedLoader"

type LoaderType = "page" | "quiz" | "component" | null

interface LoadingStateContextType {
  // Current active loader (highest priority)
  activeLoader: LoaderType
  activeMessage: string
  
  // Actions
  showPageLoader: (message?: string) => void
  showQuizLoader: (message?: string) => void
  showComponentLoader: (message?: string) => void
  hidePageLoader: () => void
  hideQuizLoader: () => void
  hideComponentLoader: () => void
  hideAllLoaders: () => void
  
  // State checks
  isPageLoading: boolean
  isQuizLoading: boolean
  isComponentLoading: boolean
  isAnyLoading: boolean
}

const LoadingStateContext = createContext<LoadingStateContextType | null>(null)

export function useLoadingState() {
  const context = useContext(LoadingStateContext)
  if (!context) {
    throw new Error("useLoadingState must be used within LoadingStateProvider")
  }
  return context
}

interface LoadingStateProviderProps {
  children: React.ReactNode
}

export function LoadingStateProvider({ children }: LoadingStateProviderProps) {
  const [pageLoading, setPageLoading] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)
  const [componentLoading, setComponentLoading] = useState(false)
  const [pageMessage, setPageMessage] = useState("")
  const [quizMessage, setQuizMessage] = useState("")
  const [componentMessage, setComponentMessage] = useState("")

  // Determine active loader based on priority (page > quiz > component)
  const activeLoader: LoaderType = pageLoading ? "page" : quizLoading ? "quiz" : componentLoading ? "component" : null
  const activeMessage = pageLoading ? pageMessage : quizLoading ? quizMessage : componentMessage

  const showPageLoader = useCallback((message = "Loading page...") => {
    setPageLoading(true)
    setPageMessage(message)
  }, [])

  const showQuizLoader = useCallback((message = "Loading quiz...") => {
    setQuizLoading(true)
    setQuizMessage(message)
  }, [])

  const showComponentLoader = useCallback((message = "Loading...") => {
    setComponentLoading(true)
    setComponentMessage(message)
  }, [])

  const hidePageLoader = useCallback(() => {
    setPageLoading(false)
    setPageMessage("")
  }, [])

  const hideQuizLoader = useCallback(() => {
    setQuizLoading(false)
    setQuizMessage("")
  }, [])

  const hideComponentLoader = useCallback(() => {
    setComponentLoading(false)
    setComponentMessage("")
  }, [])

  const hideAllLoaders = useCallback(() => {
    setPageLoading(false)
    setQuizLoading(false)
    setComponentLoading(false)
    setPageMessage("")
    setQuizMessage("")
    setComponentMessage("")
  }, [])

  const contextValue: LoadingStateContextType = {
    activeLoader,
    activeMessage,
    showPageLoader,
    showQuizLoader,
    showComponentLoader,
    hidePageLoader,
    hideQuizLoader,
    hideComponentLoader,
    hideAllLoaders,
    isPageLoading: pageLoading,
    isQuizLoading: quizLoading,
    isComponentLoading: componentLoading,
    isAnyLoading: pageLoading || quizLoading || componentLoading,
  }

  return (
    <LoadingStateContext.Provider value={contextValue}>
      {children}
      {/* Render only the highest priority loader */}
      {activeLoader && (
        <CentralizedLoader
          context={activeLoader}
          variant={activeLoader === "page" ? "skeleton" : "spinner"}
          size="lg"
          message={activeMessage}
          fullScreen
        />
      )}
    </LoadingStateContext.Provider>
  )
}

/* ===========================
   🎯 Convenience Hooks
   =========================== */

// Page-level loading hook
export function usePageLoader() {
  const { showPageLoader, hidePageLoader, isPageLoading } = useLoadingState()
  
  return {
    isLoading: isPageLoading,
    show: showPageLoader,
    hide: hidePageLoader,
  }
}

// Quiz-level loading hook  
export function useQuizLoader() {
  const { showQuizLoader, hideQuizLoader, isQuizLoading } = useLoadingState()
  
  return {
    isLoading: isQuizLoading,
    show: showQuizLoader,
    hide: hideQuizLoader,
  }
}

// Component-level loading hook
export function useComponentLoader() {
  const { showComponentLoader, hideComponentLoader, isComponentLoading } = useLoadingState()
  
  return {
    isLoading: isComponentLoading,
    show: showComponentLoader,
    hide: hideComponentLoader,
  }
}