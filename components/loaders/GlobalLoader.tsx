"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, Brain, Loader2, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

type LoaderVariant = "spinner" | "dots" | "progress" | "skeleton" | "pulse"
type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl"
type LoaderState = "loading" | "success" | "error" | "idle"
type LoaderPriority = "page" | "quiz" | "component" | "inline"

interface LoaderConfig {
  id: string
  priority: LoaderPriority
  state: LoaderState
  variant: LoaderVariant
  size: LoaderSize
  message?: string
  progress?: number
  fullPage?: boolean
  overlay?: boolean
  inline?: boolean
  className?: string
  autoHide?: boolean
  autoHideDelay?: number
}

interface GlobalLoaderContextType {
  showLoader: (config: Omit<LoaderConfig, "id">) => string
  hideLoader: (id: string) => void
  updateLoader: (id: string, updates: Partial<LoaderConfig>) => void
  clearAll: () => void
  isLoading: boolean
  currentLoader: LoaderConfig | null
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType | null>(null)

export function useGlobalLoader() {
  const context = useContext(GlobalLoaderContext)
  if (!context) {
    throw new Error("useGlobalLoader must be used within GlobalLoaderProvider")
  }
  return context
}

// Priority levels (higher number = higher priority)
const PRIORITY_LEVELS = {
  page: 4,
  quiz: 3,
  component: 2,
  inline: 1,
}

/* ===========================
   🎯 Neobrutalism Loader Component
   =========================== */
function NeoBrutalLoader({
  state = "loading",
  variant = "spinner",
  size = "md",
  priority = "component",
  message,
  progress,
  fullPage = false,
  overlay = false,
  inline = false,
  className,
}: Omit<LoaderConfig, "id">) {
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
      setIsReducedMotion(mediaQuery.matches)
      const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches)
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    }
  }, [])

  const sizeMap = {
    xs: { container: "h-4 w-4", icon: "h-3 w-3", text: "text-xs", padding: "p-3" },
    sm: { container: "h-5 w-5", icon: "h-4 w-4", text: "text-sm", padding: "p-4" },
    md: { container: "h-7 w-7", icon: "h-5 w-5", text: "text-base", padding: "p-6" },
    lg: { container: "h-10 w-10", icon: "h-6 w-6", text: "text-lg", padding: "p-8" },
    xl: { container: "h-14 w-14", icon: "h-8 w-8", text: "text-xl", padding: "p-10" },
  }

  // Priority-based styling (Neobrutalism colors)
  const getStylesByPriority = () => {
    switch (priority) {
      case "page":
        return {
          bg: "bg-yellow-200 dark:bg-yellow-900/30",
          border: "border-yellow-600 dark:border-yellow-400",
          shadow: "shadow-[6px_6px_0_0_rgb(202,138,4)]",
          accent: "text-yellow-800 dark:text-yellow-200"
        }
      case "quiz":
        return {
          bg: "bg-blue-200 dark:bg-blue-900/30",
          border: "border-blue-600 dark:border-blue-400",
          shadow: "shadow-[6px_6px_0_0_rgb(37,99,235)]",
          accent: "text-blue-800 dark:text-blue-200"
        }
      case "component":
        return {
          bg: "bg-green-200 dark:bg-green-900/30",
          border: "border-green-600 dark:border-green-400",
          shadow: "shadow-[6px_6px_0_0_rgb(34,197,94)]",
          accent: "text-green-800 dark:text-green-200"
        }
      default: // inline
        return {
          bg: "bg-purple-200 dark:bg-purple-900/30",
          border: "border-purple-600 dark:border-purple-400",
          shadow: "shadow-[6px_6px_0_0_rgb(147,51,234)]",
          accent: "text-purple-800 dark:text-purple-200"
        }
    }
  }

  const styles = getStylesByPriority()
  const sizeConfig = sizeMap[size]

  const containerBase = inline
    ? "inline-flex items-center gap-3 min-h-[1.5em]"
    : `flex flex-col items-center justify-center gap-4 ${sizeConfig.padding}`

  /* 🎨 Neobrutalism Spinner */
  const Spinner = () => (
    <motion.div
      aria-hidden="true"
      className={cn(
        "relative flex items-center justify-center border-4 rounded-lg",
        styles.bg,
        styles.border,
        styles.shadow,
        sizeConfig.container
      )}
    >
      <motion.div
        animate={isReducedMotion ? {} : { rotate: 360 }}
        transition={isReducedMotion ? {} : { duration: 1.2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {priority === "page" ? (
          <Zap className={cn(styles.accent, sizeConfig.icon)} />
        ) : priority === "quiz" ? (
          <Brain className={cn(styles.accent, sizeConfig.icon)} />
        ) : (
          <Loader2 className={cn(styles.accent, sizeConfig.icon)} />
        )}
      </motion.div>
    </motion.div>
  )

  /* 🎨 Neobrutalism Dots */
  const Dots = () => (
    <div className={cn("flex items-center justify-center gap-2", sizeConfig.container)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={isReducedMotion ? {} : { scale: 0.8, opacity: 0.6 }}
          animate={isReducedMotion ? {} : { scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          className={cn(
            "block rounded-full border-2",
            styles.border,
            styles.bg,
            size === "xs" && "h-1 w-1",
            size === "sm" && "h-1.5 w-1.5",
            size === "md" && "h-2 w-2",
            size === "lg" && "h-2.5 w-2.5",
            size === "xl" && "h-3 w-3"
          )}
        />
      ))}
    </div>
  )

  /* 🎨 Neobrutalism Progress */
  const Progress = () => (
    <div className="space-y-3 w-full max-w-xs">
      <div className={cn(
        "h-4 border-4 rounded-lg overflow-hidden",
        "bg-white dark:bg-gray-800",
        styles.border,
        styles.shadow
      )}>
        <motion.div
          className={cn("h-full border-r-4", styles.bg, styles.border)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, progress ?? 0))}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      {progress !== undefined && (
        <div className="flex justify-between items-center">
          <span className={cn("font-bold", styles.accent, sizeConfig.text)}>
            {message || "Loading..."}
          </span>
          <span className={cn("font-bold", styles.accent, sizeConfig.text)}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  )

  /* 🎨 Neobrutalism Skeleton */
  const Skeleton = () => (
    <div className="space-y-4 w-full max-w-md">
      {[1, 0.8, 0.6].map((width, i) => (
        <div
          key={i}
          className={cn(
            "h-4 border-4 rounded-lg animate-pulse",
            styles.bg,
            styles.border,
            styles.shadow
          )}
          style={{ width: `${width * 100}%` }}
        />
      ))}
    </div>
  )

  /* 🎨 Neobrutalism Pulse */
  const Pulse = () => (
    <motion.div
      animate={isReducedMotion ? {} : { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={cn(
        "rounded-full border-4 flex items-center justify-center",
        styles.bg,
        styles.border,
        styles.shadow,
        sizeConfig.container
      )}
    >
      <div className={cn("rounded-full", styles.border.replace("border-", "bg-"), sizeConfig.icon)} />
    </motion.div>
  )

  const stateIcon = () => {
    if (state === "loading" || state === "idle") return null
    const isSuccess = state === "success"
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "flex items-center justify-center border-4 rounded-lg",
          isSuccess ? "bg-green-400 border-green-600" : "bg-red-400 border-red-600",
          "shadow-[4px_4px_0_0_rgb(0,0,0)]",
          sizeConfig.container
        )}
      >
        {isSuccess ? (
          <CheckCircle className="text-black w-full h-full" />
        ) : (
          <AlertCircle className="text-black w-full h-full" />
        )}
      </motion.div>
    )
  }

  const getLoaderContent = () => {
    if (state === "loading") {
      switch (variant) {
        case "spinner": return <Spinner />
        case "dots": return <Dots />
        case "progress": return <Progress />
        case "skeleton": return <Skeleton />
        case "pulse": return <Pulse />
        default: return <Spinner />
      }
    }
    return stateIcon()
  }

  const loaderContent = (
    <motion.div
      role="status"
      aria-live="polite"
      aria-busy={state === "loading"}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        containerBase,
        "border-4 border-black bg-white dark:bg-gray-900 dark:border-gray-300 rounded-xl shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]",
        className
      )}
    >
      {getLoaderContent()}
      {message && variant !== "progress" && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn("font-bold text-center mt-2 text-black dark:text-white", sizeConfig.text)}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  )

  // Full page overlay
  if (fullPage) {
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

  // Overlay mode
  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
        {loaderContent}
      </div>
    )
  }

  // Regular mode
  return loaderContent
}

/* ===========================
   🎯 Global Loader Provider
   =========================== */
export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  const [loaders, setLoaders] = useState<Map<string, LoaderConfig>>(new Map())
  const [currentLoader, setCurrentLoader] = useState<LoaderConfig | null>(null)
  const idCounter = useRef(0)
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Generate unique ID
  const generateId = () => {
    idCounter.current += 1
    return `loader_${idCounter.current}_${Date.now()}`
  }

  // Update current loader based on priority
  useEffect(() => {
    if (loaders.size === 0) {
      setCurrentLoader(null)
      return
    }

    // Find highest priority loader
    let highestPriority = 0
    let selectedLoader: LoaderConfig | null = null

    loaders.forEach((loader) => {
      const priority = PRIORITY_LEVELS[loader.priority]
      if (priority > highestPriority) {
        highestPriority = priority
        selectedLoader = loader
      }
    })

    setCurrentLoader(selectedLoader)
  }, [loaders])

  const showLoader = (config: Omit<LoaderConfig, "id">) => {
    const id = generateId()
    const loaderConfig: LoaderConfig = { ...config, id }

    setLoaders(prev => new Map(prev).set(id, loaderConfig))

    // Auto-hide if specified
    if (config.autoHide) {
      const timeout = setTimeout(() => {
        hideLoader(id)
      }, config.autoHideDelay || 3000)
      timeouts.current.set(id, timeout)
    }

    return id
  }

  const hideLoader = (id: string) => {
    setLoaders(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })

    // Clear timeout
    const timeout = timeouts.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeouts.current.delete(id)
    }
  }

  const updateLoader = (id: string, updates: Partial<LoaderConfig>) => {
    setLoaders(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(id)
      if (existing) {
        newMap.set(id, { ...existing, ...updates })
      }
      return newMap
    })
  }

  const clearAll = () => {
    // Clear all timeouts
    timeouts.current.forEach(timeout => clearTimeout(timeout))
    timeouts.current.clear()
    setLoaders(new Map())
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeouts.current.forEach(timeout => clearTimeout(timeout))
      timeouts.current.clear()
    }
  }, [])

  const contextValue: GlobalLoaderContextType = {
    showLoader,
    hideLoader,
    updateLoader,
    clearAll,
    isLoading: currentLoader !== null,
    currentLoader,
  }

  return (
    <GlobalLoaderContext.Provider value={contextValue}>
      {children}
      <AnimatePresence mode="wait">
        {currentLoader && (
          <NeoBrutalLoader key={currentLoader.id} {...currentLoader} />
        )}
      </AnimatePresence>
    </GlobalLoaderContext.Provider>
  )
}

/* ===========================
   🎯 Convenience Hooks
   =========================== */
export function usePageLoader() {
  const { showLoader, hideLoader } = useGlobalLoader()
  
  return {
    show: (message = "Loading page...") => showLoader({
      priority: "page",
      state: "loading",
      variant: "skeleton",
      size: "lg",
      message,
      fullPage: true,
    }),
    hide: hideLoader,
  }
}

export function useQuizLoader() {
  const { showLoader, hideLoader } = useGlobalLoader()
  
  return {
    show: (message = "Loading quiz...") => showLoader({
      priority: "quiz",
      state: "loading",
      variant: "spinner",
      size: "lg",
      message,
      fullPage: true,
    }),
    hide: hideLoader,
  }
}

export function useComponentLoader() {
  const { showLoader, hideLoader } = useGlobalLoader()
  
  return {
    show: (message = "Loading...", overlay = false) => showLoader({
      priority: "component",
      state: "loading",
      variant: "spinner",
      size: "md",
      message,
      overlay,
    }),
    hide: hideLoader,
  }
}

export function useInlineLoader() {
  const { showLoader, hideLoader } = useGlobalLoader()
  
  return {
    show: (message = "Loading...", variant: LoaderVariant = "dots") => showLoader({
      priority: "inline",
      state: "loading",
      variant,
      size: "sm",
      message,
      inline: true,
    }),
    hide: hideLoader,
  }
}