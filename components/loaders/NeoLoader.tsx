"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, Loader2, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

type LoaderVariant = "spinner" | "dots" | "progress" | "skeleton" | "pulse"
type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl"
type LoaderState = "loading" | "success" | "error" | "idle"

interface NeoLoaderProps {
  state?: LoaderState
  variant?: LoaderVariant
  size?: LoaderSize
  message?: string
  progress?: number
  className?: string
  inline?: boolean
  showStates?: boolean
  autoHide?: boolean
  autoHideDelay?: number
  successIcon?: React.ReactNode
  errorIcon?: React.ReactNode
  spinnerIcon?: React.ReactNode
  fullWidth?: boolean
  minHeight?: string
}

/* ===========================
   🧠 NeoLoader (Unified Neobrutalism Edition)
   =========================== */
export function NeoLoader({
  state = "loading",
  variant = "spinner",
  size = "md",
  message,
  progress,
  className,
  inline = false,
  showStates = true,
  autoHide = false,
  autoHideDelay = 1500,
  successIcon,
  errorIcon,
  spinnerIcon,
  fullWidth = false,
  minHeight = "auto",
}: NeoLoaderProps) {
  const [visible, setVisible] = useState(true)
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

  useEffect(() => {
    if (autoHide && (state === "success" || state === "error")) {
      const t = setTimeout(() => setVisible(false), autoHideDelay)
      return () => clearTimeout(t)
    }
    if (state === "loading") setVisible(true)
  }, [autoHide, autoHideDelay, state])

  const sizeMap: Record<LoaderSize, { container: string; icon: string; text: string }> = {
    xs: { container: "h-4 w-4", icon: "h-3 w-3", text: "text-xs" },
    sm: { container: "h-5 w-5", icon: "h-4 w-4", text: "text-sm" },
    md: { container: "h-7 w-7", icon: "h-5 w-5", text: "text-base" },
    lg: { container: "h-10 w-10", icon: "h-6 w-6", text: "text-lg" },
    xl: { container: "h-14 w-14", icon: "h-8 w-8", text: "text-xl" },
  }

  const containerBase = inline
    ? "inline-flex items-center gap-3 min-h-[1.5em]"
    : "flex flex-col items-center justify-center gap-4 p-6"

  /* 🎨 Spinner (Neobrutal Style) */
  const Spinner = () => (
    <motion.div
      aria-hidden="true"
      className={cn(
        "relative flex items-center justify-center border-4 border-[var(--color-border)] rounded-lg bg-[var(--color-accent)] shadow-[4px_4px_0_0_#000]",
        sizeMap[size].container
      )}
    >
      {spinnerIcon || (
        <motion.div
          animate={isReducedMotion ? {} : { rotate: 360 }}
          transition={isReducedMotion ? {} : { duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <Loader2 className="h-full w-full text-[var(--color-text)]" />
        </motion.div>
      )}
    </motion.div>
  )

  /* 🎨 Dots Loader */
  const Dots = () => (
    <div className={cn("flex items-center justify-center gap-1", sizeMap[size].container)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={isReducedMotion ? {} : { scale: 0.8, opacity: 0.6 }}
          animate={isReducedMotion ? {} : { scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          className={cn(
            "block rounded-full bg-[var(--color-text)]",
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

  /* 🎨 Progress Loader */
  const Progress = () => (
    <div className={cn("space-y-3", fullWidth ? "w-full" : "w-48")}>
      <div className="h-3 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-md overflow-hidden shadow-[3px_3px_0_0_#000]">
        <motion.div
          className="h-full bg-[var(--color-primary)] border-r-2 border-[var(--color-border)]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, progress ?? 0))}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      {progress !== undefined && (
        <div className="flex justify-between items-center">
          <span className={cn("text-[var(--color-text)] font-bold", sizeMap[size].text)}>
            {message || "Loading..."}
          </span>
          <span className={cn("text-[var(--color-text)] font-bold", sizeMap[size].text)}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  )

  /* 🎨 Skeleton Loader */
  const Skeleton = () => (
    <div className={cn("space-y-3", fullWidth ? "w-full" : "w-64")}>
      <div className="h-4 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-md animate-pulse shadow-[3px_3px_0_0_#000]" />
      <div className="h-4 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-md animate-pulse w-3/4 shadow-[3px_3px_0_0_#000]" />
      <div className="h-3 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-md animate-pulse w-1/2 shadow-[3px_3px_0_0_#000]" />
    </div>
  )

  /* 🎨 Pulse Loader */
  const Pulse = () => (
    <motion.div
      animate={isReducedMotion ? {} : { scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={cn(
        "rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-border)] flex items-center justify-center shadow-[4px_4px_0_0_#000]",
        sizeMap[size].container
      )}
    >
      <div className={cn("rounded-full bg-[var(--color-accent)]", sizeMap[size].icon)} />
    </motion.div>
  )

  const stateIcon = () => {
    if (!showStates || state === "loading" || state === "idle" || !visible) return null
    const color = state === "success" ? "bg-[var(--color-success)]" : "bg-[var(--color-error)]"
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "flex items-center justify-center border-4 border-[var(--color-border)] rounded-lg shadow-[4px_4px_0_0_#000]",
          color,
          sizeMap[size].container
        )}
      >
        {state === "success"
          ? (successIcon || <CheckCircle className="text-[var(--color-text)] w-full h-full" />)
          : (errorIcon || <AlertCircle className="text-[var(--color-text)] w-full h-full" />)}
      </motion.div>
    )
  }

  if (!visible && autoHide) return null

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

  return (
    <AnimatePresence>
      <motion.div
        role="status"
        aria-live="polite"
        aria-busy={state === "loading"}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          containerBase,
          "border-4 border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] rounded-xl shadow-[6px_6px_0_0_#000] transition-all duration-200",
          className,
          fullWidth && "w-full"
        )}
        style={{ minHeight: inline ? undefined : minHeight }}
      >
        {getLoaderContent()}
        {message && variant !== "progress" && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn("font-bold text-center text-[var(--color-text)] mt-2", sizeMap[size].text)}
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/* 🧠 PageLoader (Neobrutal Overlay) */
export function PageLoader({
  message = "Loading...",
  variant = "spinner",
  size = "lg",
  className,
  blocking = true,
  showBackdrop = true,
  ...props
}: Omit<NeoLoaderProps, "inline"> & {
  className?: string
  blocking?: boolean
  showBackdrop?: boolean
}) {
  useEffect(() => {
    if (blocking) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = ""
      }
    }
  }, [blocking])

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        showBackdrop && "bg-[var(--color-bg)]/90 backdrop-blur-[2px] border-t-4 border-b-4 border-[var(--color-border)]"
      )}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-sm mx-4"
      >
        <div
          className={cn(
            "rounded-xl border-4 border-[var(--color-border)] bg-[var(--color-card)] shadow-[8px_8px_0_0_#000] p-6",
            className
          )}
        >
          <NeoLoader
            message={message}
            variant={variant}
            size={size}
            fullWidth
            minHeight="120px"
            {...props}
          />
        </div>
      </motion.div>
    </div>
  )
}

/* 🧠 InlineLoader */
export function InlineLoader({
  message,
  variant = "spinner",
  size = "sm",
  className,
  ...props
}: Omit<NeoLoaderProps, "inline">) {
  return (
    <NeoLoader
      message={message}
      variant={variant}
      size={size}
      inline
      className={className}
      {...props}
    />
  )
}

/* 🧠 ButtonLoader */
export function ButtonLoader({
  loading = false,
  children,
  className,
  size = "sm",
  ...props
}: {
  loading?: boolean
  children: React.ReactNode
  className?: string
  size?: LoaderSize
} & Omit<NeoLoaderProps, "state" | "inline">) {
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-[var(--color-card)]/80 border-2 border-[var(--color-border)] rounded-md"
          >
            <NeoLoader
              state="loading"
              variant="spinner"
              size={size}
              inline
              showStates={false}
              {...props}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className={loading ? "invisible" : "visible"}>{children}</div>
    </div>
  )
}

/* 🧠 SkeletonLoader */
export function SkeletonLoader({
  lines = 3,
  className,
  spacing = "md",
}: {
  lines?: number
  className?: string
  spacing?: "sm" | "md" | "lg"
}) {
  const spacingMap = {
    sm: "space-y-2",
    md: "space-y-3",
    lg: "space-y-4",
  }

  return (
    <div className={cn(spacingMap[spacing], className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-md animate-pulse shadow-[3px_3px_0_0_#000]",
            i === lines - 1 && lines > 1 && "w-3/4",
            i === lines - 2 && lines > 2 && "w-5/6"
          )}
        />
      ))}
    </div>
  )
}