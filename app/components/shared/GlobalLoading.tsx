"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import CourseAILoader from "@/app/dashboard/course/components/CourseAILoader"
interface LoadingContextType {
  isLoading: boolean
  setLoading: (isLoading: boolean) => void
  progress: number
  setProgress: (progress: number) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export const useLoading = () => {
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
    if (loading) {
      setProgress(0)
    } else {
      setProgress(100)
    }
  }, [])

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading, progress, setProgress }}>
      {children}
    </LoadingContext.Provider>
  )
}


interface RouteMessages {
  [key: string]: string
}

const routeMessages: RouteMessages = {
  "/dashboard": "Loading Dashboard...",
  "/dashboard/quizzes": "Preparing Quizzes...",
  "/dashboard/courses": "Loading Courses...",
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <motion.div
    className="h-1 bg-gradient-to-r from-primary via-secondary to-accent fixed top-0 left-0 right-0 z-[10000]"
    initial={{ width: 0 }}
    animate={{ width: `${value}%` }}
    transition={{ duration: 0.3 }}
  />
)

export function GlobalLoading(): JSX.Element {
  const pathname = usePathname()
  const { isLoading, progress, setProgress } = useLoading()

  const loadingMessage = useMemo(() => {
    const path = pathname || ""
    return routeMessages[path] || "Loading..."
  }, [pathname])

  useEffect(() => {
    if (isLoading && progress < 90) {
      const timer = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)
      return () => clearInterval(timer)
    }
  }, [isLoading, progress, setProgress])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn("fixed inset-0 z-[9999]", "bg-background/80 dark:bg-background/90", "backdrop-blur-sm")}
        >
          <ProgressBar value={progress} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <CourseAILoader />
            </motion.div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="text-sm font-medium text-muted-foreground"
            >
              {loadingMessage}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

