"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

interface EnhancedLoaderProps {
  state: LoadingState
  message?: string
  size?: 'sm' | 'md' | 'lg'
  showRetry?: boolean
  onRetry?: () => void
  className?: string
  children?: React.ReactNode
}

export function EnhancedLoader({
  state,
  message,
  size = 'md',
  showRetry = false,
  onRetry,
  className,
  children
}: EnhancedLoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const getStateConfig = (state: LoadingState) => {
    switch (state) {
      case 'loading':
        return {
          icon: <Loader2 className={cn(sizeClasses[size], "animate-spin")} />,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          message: message || 'Loading...',
          showRetry: false
        }
      case 'success':
        return {
          icon: <CheckCircle className={sizeClasses[size]} />,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950',
          message: message || 'Success!',
          showRetry: false
        }
      case 'error':
        return {
          icon: <XCircle className={sizeClasses[size]} />,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950',
          message: message || 'Something went wrong',
          showRetry: showRetry
        }
      default:
        return {
          icon: <AlertCircle className={sizeClasses[size]} />,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50',
          message: message || 'Idle',
          showRetry: false
        }
    }
  }

  const config = getStateConfig(state)

  if (children) {
    return (
      <div className={cn("relative", className)}>
        <AnimatePresence mode="wait">
          {state === 'loading' && (
            <motion.div
              key="loading-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg"
            >
              <div className="flex flex-col items-center gap-3 p-6">
                <div className={cn("p-3 rounded-full", config.bgColor)}>
                  <div className={config.color}>
                    {config.icon}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {config.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn("flex flex-col items-center justify-center gap-4 p-6", className)}
    >
      <motion.div
        className={cn("p-4 rounded-full", config.bgColor)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className={config.color}>
          {config.icon}
        </div>
      </motion.div>

      <div className="text-center space-y-3">
        <p className="text-sm font-medium">
          {config.message}
        </p>

        {config.showRetry && onRetry && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// Page-level loading component
interface PageLoaderProps {
  message?: string
  showProgress?: boolean
  progress?: number
}

export function PageLoader({ message, showProgress = false, progress }: PageLoaderProps) {
  return (
    <div className="flex min-h-[40vh] sm:min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <EnhancedLoader
            state="loading"
            message={message || "Loading page..."}
            size="lg"
          />

          {showProgress && (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  className="bg-primary h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress || 0}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {progress || 0}% complete
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Skeleton loader for content
interface SkeletonLoaderProps {
  lines?: number
  className?: string
}

export function SkeletonLoader({ lines = 3, className }: SkeletonLoaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-muted rounded"
          initial={{ opacity: 0.5, width: "100%" }}
          animate={{
            opacity: [0.5, 1, 0.5],
            width: ["100%", "90%", "100%"]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  )
}

// Full-screen loading overlay
interface FullScreenLoaderProps {
  message?: string
  showProgress?: boolean
  progress?: number
}

export function FullScreenLoader({ message, showProgress, progress }: FullScreenLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="w-full max-w-sm">
          <CardContent className="p-4 sm:p-6 md:p-8 text-center">
            <EnhancedLoader
              state="loading"
              message={message || "Loading..."}
              size="lg"
            />

            {showProgress && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-full bg-muted rounded-full h-2">
                  <motion.div
                    className="bg-primary h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress || 0}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {progress || 0}% complete
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
