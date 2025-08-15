"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useGlobalLoader } from "@/store/loaders/global-loader"

interface IconProps {
  size?: number
}

interface ProgressBarProps {
  progress: number
  isDeterministic?: boolean
}

// Modern, deterministic spinner component
function ModernSpinner({ size = 40 }: IconProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="relative"
      style={{ width: size, height: size }}
    >
      <svg
        className="animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-primary/20"
        />
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-primary"
          strokeDasharray="62.83"
          strokeDashoffset="47.12"
        />
      </svg>
    </motion.div>
  )
}

// Inline spinner for small contexts
export function InlineSpinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <ModernSpinner size={size} />
    </div>
  )
}

// Main loading spinner
export function LoadingSpinner({ size = 40 }: IconProps) {
  return <ModernSpinner size={size} />
}

// Success icon with smooth animation
function SuccessIcon({ size = 40 }: IconProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
      className="flex items-center justify-center"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-emerald-500"
      >
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
        <motion.path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        />
      </svg>
    </motion.div>
  )
}

// Error icon with attention-grabbing animation
function ErrorIcon({ size = 40 }: IconProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0, rotate: 180 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
      className="flex items-center justify-center"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-red-500"
      >
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
        <motion.path
          d="M15 9l-6 6M9 9l6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        />
      </svg>
    </motion.div>
  )
}

// Modern progress bar with smooth animations
function ProgressBar({ progress, isDeterministic = true }: ProgressBarProps) {
  return (
    <div className="w-64 mt-4">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            duration: isDeterministic ? 0.3 : 0.1, 
            ease: "easeOut" 
          }}
        >
          {/* Shimmer effect for loading state */}
          {progress < 100 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
          )}
        </motion.div>
      </div>
      <motion.p 
        className="text-xs text-center text-muted-foreground mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {isDeterministic ? `${Math.round(progress)}% complete` : 'Processing...'}
      </motion.p>
    </div>
  )
}

export function GlobalLoader() {
  const { 
    state, 
    isLoading, 
    message, 
    subMessage, 
    progress, 
    isBlocking, 
    error 
  } = useGlobalLoader()

  // Don't render anything if idle
  if (state === 'idle') {
    return null
  }

  const renderIcon = () => {
    switch (state) {
      case 'loading':
        return <LoadingSpinner />
      case 'success':
        return <SuccessIcon />
      case 'error':
        return <ErrorIcon />
      default:
        return null
    }
  }

  const getMessage = () => {
    switch (state) {
      case 'success':
        return message || 'Operation completed successfully!'
      case 'error':
        return error || 'An error occurred'
      default:
        return message || 'Loading...'
    }
  }

  const getSubMessage = () => {
    if (subMessage) return subMessage
    
    switch (state) {
      case 'success':
        return 'Your request has been processed'
      case 'error':
        return 'Please try again or contact support'
      default:
        return undefined
    }
  }

  // Non-blocking loader (inline)
  if (!isBlocking) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center justify-center p-6"
          role="status"
          aria-live="polite"
          aria-label={getMessage()}
        >
          {renderIcon()}
          
          <motion.p 
            className={cn(
              "text-sm font-medium mt-3 text-center",
              state === 'error' ? "text-destructive" :
              state === 'success' ? "text-success" :
              "text-foreground"
            )}
          >
            {getMessage()}
          </motion.p>
          
          {getSubMessage() && (
            <motion.p 
              className="text-xs text-muted-foreground mt-1 text-center"
            >
              {getSubMessage()}
            </motion.p>
          )}
          
          {state === 'loading' && typeof progress === 'number' && (
            <ProgressBar progress={progress} />
          )}
        </motion.div>
      </AnimatePresence>
    )
  }

  // Blocking loader (fullscreen)
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="loader-title"
        aria-describedby="loader-description"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex flex-col items-center space-y-4 p-8 rounded-xl shadow-2xl border max-w-sm mx-4",
            state === 'error' 
              ? "bg-destructive/5 border-destructive/20" 
              : state === 'success'
              ? "bg-success/5 border-success/20"
              : "bg-card border-border"
          )}
        >
          {renderIcon()}
          
          <div className="text-center space-y-2">
            <motion.h3 
              id="loader-title"
              className={cn(
                "text-lg font-semibold",
                state === 'error' 
                  ? "text-destructive" 
                  : state === 'success'
                  ? "text-success"
                  : "text-foreground"
              )}
            >
              {getMessage()}
            </motion.h3>
            
            {getSubMessage() && (
              <motion.p 
                id="loader-description"
                className="text-sm text-muted-foreground"
              >
                {getSubMessage()}
              </motion.p>
            )}
          </div>

          {state === 'loading' && typeof progress === 'number' && (
            <ProgressBar progress={progress} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
