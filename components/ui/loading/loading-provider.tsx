"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/tailwindUtils"

// Define the status types for our loading states
type LoadingStatus = "loading" | "success" | "error" | "warning" | null

// Define the context type
interface LoadingContextType {
  isLoading: boolean
  status: LoadingStatus
  message: string
  startLoading: (message?: string) => void
  stopLoading: () => void
  showSuccess: (message?: string, duration?: number) => void
  showError: (message?: string, duration?: number) => void
  showWarning: (message?: string, duration?: number) => void
  setLoadingState: (isLoading: boolean, message?: string) => void
}

// Create the context
const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

// Custom hook to use the loading context
export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider")
  }
  return context
}

interface LoadingProviderProps {
  children: ReactNode
  initialState?: boolean
}

// The main LoadingProvider component
export function LoadingProvider({ children, initialState = false }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(initialState)
  const [status, setStatus] = useState<LoadingStatus>(null)
  const [message, setMessage] = useState("")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadingCountRef = useRef(0)

  // Clear any existing timeouts when unmounting
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Start loading with an optional message
  const startLoading = useCallback((message = "Loading...") => {
    loadingCountRef.current += 1
    setIsLoading(true)
    setStatus("loading")
    setMessage(message)
  }, [])

  // Stop loading
  const stopLoading = useCallback(() => {
    loadingCountRef.current = Math.max(0, loadingCountRef.current - 1)

    if (loadingCountRef.current === 0) {
      setIsLoading(false)
      // Keep the status for a moment before clearing
      setTimeout(() => {
        setStatus(null)
        setMessage("")
      }, 300)
    }
  }, [])

  // Show success message
  const showSuccess = useCallback((message = "Operation completed successfully", duration = 2000) => {
    setStatus("success")
    setMessage(message)
    setIsLoading(false)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setStatus(null)
      setMessage("")
    }, duration)
  }, [])

  // Show error message
  const showError = useCallback((message = "An error occurred", duration = 3000) => {
    setStatus("error")
    setMessage(message)
    setIsLoading(false)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setStatus(null)
      setMessage("")
    }, duration)
  }, [])

  // Show warning message
  const showWarning = useCallback((message = "Warning", duration = 3000) => {
    setStatus("warning")
    setMessage(message)
    setIsLoading(false)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setStatus(null)
      setMessage("")
    }, duration)
  }, [])

  // Set loading state directly
  const setLoadingState = useCallback(
    (isLoading: boolean, message?: string) => {
      if (isLoading) {
        startLoading(message)
      } else {
        stopLoading()
      }
    },
    [startLoading, stopLoading],
  )

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        status,
        message,
        startLoading,
        stopLoading,
        showSuccess,
        showError,
        showWarning,
        setLoadingState,
      }}
    >
      {children}
      <AnimatePresence>
        {(isLoading || status) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ pointerEvents: "none" }}
          >
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative z-10 flex flex-col items-center gap-4 p-6 rounded-lg bg-card shadow-lg"
              style={{ pointerEvents: "auto" }}
              role="alert"
              aria-live="assertive"
            >
              {status === "loading" && <Loader2 className="w-10 h-10 text-primary animate-spin" />}
              {status === "success" && <CheckCircle2 className="w-10 h-10 text-green-500" />}
              {status === "error" && <XCircle className="w-10 h-10 text-red-500" />}
              {status === "warning" && <AlertCircle className="w-10 h-10 text-yellow-500" />}

              {message && <p className="text-sm font-medium text-center max-w-xs">{message}</p>}

              {isLoading && (
                <div className="w-full mt-2">
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{
                        width: ["0%", "100%", "0%"],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LoadingContext.Provider>
  )
}

// Enhanced LoadingButton with better UX
export function LoadingButton({
  loading,
  children,
  className,
  loadingText = "Loading...",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
  loadingText?: string
}) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      disabled={loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      )}
      {!loading && children}
    </button>
  )
}

// Enhanced LoadingIndicator with better animation
export function LoadingIndicator({
  className,
  size = "md",
  message,
}: {
  className?: string
  size?: "sm" | "md" | "lg"
  message?: string
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary", className)} />
      {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}

// Enhanced SectionLoader with better animation
export function SectionLoader({ className, message = "Loading content..." }: { className?: string; message?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 space-y-4", className)}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <LoadingIndicator size="lg" />
      </motion.div>
      <motion.p
        className="text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {message}
      </motion.p>
    </div>
  )
}

// Global loading hook for API requests
export function useApiLoading() {
  const { startLoading, stopLoading, showSuccess, showError } = useLoading()

  const fetchWithLoading = useCallback(
    async <T,>(
      url: string,
      options?: RequestInit,
      successMessage?: string,
      loadingMessage = "Loading...",
    ): Promise<T> => {
      try {
        startLoading(loadingMessage)
        const response = await fetch(url, options)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "An error occurred" }))
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (successMessage) {
          showSuccess(successMessage)
        } else {
          stopLoading()
        }

        return data as T
      } catch (error: any) {
        showError(error.message || "An error occurred")
        throw error
      }
    },
    [startLoading, stopLoading, showSuccess, showError],
  )

  return { fetchWithLoading }
}
