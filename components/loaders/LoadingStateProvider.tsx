"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Brain, Zap, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

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
      <AnimatePresence>
        {activeLoader && (
          <SimpleNeobrutalistLoader
            context={activeLoader}
            variant={activeLoader === "page" ? "skeleton" : "spinner"}
            message={activeMessage}
          />
        )}
      </AnimatePresence>
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

/* ===================================================================
   🎨 Simple Neobrutalist Loader Component
   =================================================================== */
function SimpleNeobrutalistLoader({ 
  context, 
  variant, 
  message 
}: { 
  context: LoaderType
  variant: "spinner" | "skeleton"
  message: string 
}) {
  // Context-based styling
  const getContextStyles = () => {
    switch (context) {
      case "page":
        return {
          bg: "bg-yellow-200 dark:bg-yellow-900/30",
          border: "border-yellow-600 dark:border-yellow-400",
          shadow: "shadow-[6px_6px_0_0_rgb(202,138,4)] dark:shadow-[6px_6px_0_0_rgb(250,204,21)]",
          accent: "text-yellow-800 dark:text-yellow-200",
          icon: Zap
        }
      case "quiz":
        return {
          bg: "bg-blue-200 dark:bg-blue-900/30",
          border: "border-blue-600 dark:border-blue-400",
          shadow: "shadow-[6px_6px_0_0_rgb(37,99,235)] dark:shadow-[6px_6px_0_0_rgb(59,130,246)]",
          accent: "text-blue-800 dark:text-blue-200",
          icon: Brain
        }
      default: // component
        return {
          bg: "bg-green-200 dark:bg-green-900/30",
          border: "border-green-600 dark:border-green-400",
          shadow: "shadow-[6px_6px_0_0_rgb(34,197,94)] dark:shadow-[6px_6px_0_0_rgb(74,222,128)]",
          accent: "text-green-800 dark:text-green-200",
          icon: Sparkles
        }
    }
  }

  const styles = getContextStyles()
  const IconComponent = styles.icon

  const Spinner = () => (
    <motion.div
      className={cn(
        "relative flex items-center justify-center border-4 rounded-lg h-12 w-12",
        styles.bg,
        styles.border,
        styles.shadow
      )}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="flex items-center justify-center"
      >
        <IconComponent className={cn(styles.accent, "h-8 w-8")} />
      </motion.div>
    </motion.div>
  )

  const Skeleton = () => (
    <div className="space-y-4 w-full max-w-md">
      {[1, 0.8, 0.6].map((width, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          className={cn(
            "h-4 border-4 rounded-lg",
            styles.bg,
            styles.border,
            styles.shadow
          )}
          style={{ width: `${width * 100}%` }}
        />
      ))}
    </div>
  )

  const loaderContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-8",
        "border-4 border-black dark:border-white bg-white dark:bg-gray-900 rounded-xl shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]"
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {variant === "spinner" ? <Spinner /> : <Skeleton />}
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-bold text-center text-black dark:text-white text-lg"
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-sm mx-4"
      >
        {loaderContent}
      </motion.div>
    </div>
  )
}