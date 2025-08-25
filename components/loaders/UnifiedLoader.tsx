"use client"

import React, { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HashLoader, PulseLoader, ClipLoader } from "react-spinners"
import { AlertCircle, CheckCircle, X, Loader2, Upload, Route, Database, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoaderType } from "./global-loaders"
import { useGlobalLoader } from "./GlobalLoaderProvider"

interface IconProps {
  size?: number
  type?: LoaderType
}

interface LoaderState {
  state: string
  message: string
  subMessage: string
  progress: number
  isBlocking: boolean
  allowCancel: boolean
  showProgress: boolean
  type: LoaderType
  priority: string
  error?: string
  estimatedDuration?: number
  startTime?: number
  instanceId: string
  variant: 'inline' | 'page' | 'fullscreen'
  routeChangeInProgress: boolean
}

// Enhanced spinner with type-specific styling
function InlineSpinner({ size = 16, className = "", type = 'custom' }: IconProps & { className?: string }) {
  const getSpinnerColor = () => {
    switch (type) {
      case 'route': return '#8B5CF6' // Purple
      case 'upload': return '#10B981' // Green
      case 'data': return '#3B82F6' // Blue
      case 'action': return '#F59E0B' // Orange
      default: return '#3B82F6'
    }
  }

  return (
    <PulseLoader
      color={getSpinnerColor()}
      size={size}
      cssOverride={{
        display: 'inline-block',
      }}
      className={className}
    />
  )
}

// Adaptive loading spinner based on type and priority
function LoadingSpinner({ size = 40, type = 'custom', priority = 'medium' }: IconProps & { priority?: string }) {
  const getSpinnerProps = () => {
    switch (type) {
      case 'route':
        return {
          component: ClipLoader,
          color: '#8B5CF6',
          icon: Route,
        }
      case 'upload':
        return {
          component: HashLoader,
          color: '#10B981',
          icon: Upload,
        }
      case 'data':
        return {
          component: ClipLoader,
          color: '#3B82F6',
          icon: Database,
        }
      case 'action':
        return {
          component: HashLoader,
          color: '#F59E0B',
          icon: Zap,
        }
      default:
        return {
          component: HashLoader,
          color: '#6B7280',
          icon: Loader2,
        }
    }
  }

  const { component: SpinnerComponent, color } = getSpinnerProps()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        duration: priority === 'critical' ? 0.1 : 0.2,
        type: "spring",
        stiffness: priority === 'critical' ? 400 : 200
      }}
      className="relative flex items-center justify-center"
    >
      <SpinnerComponent
        color={color}
        size={size}
        cssOverride={{
          display: 'block',
        }}
      />
    </motion.div>
  )
}

function SuccessIcon({ size = 40, type }: IconProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-green-500"
    >
      <CheckCircle size={size} />
    </motion.div>
  )
}

function ErrorIcon({ size = 40 }: IconProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-red-500"
    >
      <AlertCircle size={size} />
    </motion.div>
  )
}

// Enhanced progress bar with animations and estimations
function ProgressBar({ 
  progress, 
  showProgress, 
  estimatedDuration, 
  startTime, 
  type 
}: { 
  progress: number
  showProgress: boolean
  estimatedDuration?: number
  startTime?: number
  type?: LoaderType
}) {
  const displayProgress = useMemo(() => {
    if (!showProgress) return 0
    if (progress > 0) return progress
    if (estimatedDuration && startTime) {
      const elapsed = Date.now() - startTime
      return Math.min(90, (elapsed / estimatedDuration) * 100)
    }
    return 0
  }, [progress, showProgress, estimatedDuration, startTime])

  return (
    <div className="w-full mt-4">
      <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            type === 'route' ? 'bg-purple-500' :
            type === 'upload' ? 'bg-green-500' :
            type === 'data' ? 'bg-blue-500' :
            type === 'action' ? 'bg-yellow-500' :
            'bg-gray-500'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {Math.round(displayProgress)}% complete
        </p>
        {estimatedDuration && startTime && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            ~{Math.max(0, Math.round((estimatedDuration - (Date.now() - startTime)) / 1000))}s remaining
          </p>
        )}
      </div>
    </div>
  )
}

// Cancel button component
function CancelButton({ onCancel, disabled }: { onCancel: () => void, disabled?: boolean }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onCancel}
      disabled={disabled}
      className={cn(
        "flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors mt-4",
        disabled 
          ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      )}
    >
      <X size={16} />
      <span>Cancel</span>
    </motion.button>
  )
}

export function GlobalLoader() {
  const { activeInstance, routeChangeInProgress: isRouteChanging, cancelLoading } = useGlobalLoader()

  // All hook calls need to be at the top level and unconditional
  const loaderState = useMemo<LoaderState | null>(() => {
    if (!activeInstance && !isRouteChanging) {
      return null
    }

    const state = activeInstance?.state || 'idle'
    const message = activeInstance?.options?.message || ''
    const subMessage = activeInstance?.options?.subMessage || ''
    const progress = activeInstance?.options?.progress || 0
    const isBlocking = activeInstance?.options?.isBlocking || false
    const allowCancel = activeInstance?.options?.allowCancel || false
    const showProgress = activeInstance?.options?.showProgress || false
    const type = (activeInstance?.options?.type || 'custom') as LoaderType
    const priority = activeInstance?.options?.priority || 'medium'
    const error = activeInstance?.error
    const estimatedDuration = activeInstance?.estimatedDuration
    const startTime = activeInstance?.startTime
    const instanceId = activeInstance?.id || ''

    // Determine the loader variant based on context
    const variant = isBlocking || (type === 'route' && isRouteChanging)
      ? 'fullscreen' as const
      : priority === 'high' || type === 'route'
        ? 'page' as const
        : 'inline' as const

    return {
      state,
      message,
      subMessage,
      progress,
      isBlocking,
      allowCancel,
      showProgress,
      type,
      priority,
      error,
      estimatedDuration,
      startTime,
      instanceId,
      variant,
      routeChangeInProgress: isRouteChanging
    }
  }, [activeInstance, isRouteChanging])

  // Early return if no loader state
  if (!loaderState) {
    return null
  }

  const {
    state,
    message,
    subMessage,
    progress,
    isBlocking,
    allowCancel,
    showProgress,
    type,
    priority,
    error,
    estimatedDuration,
    startTime,
    instanceId,
    variant,
    routeChangeInProgress
  } = loaderState

  const renderIcon = () => {
    switch (state) {
      case 'loading':
        return <LoadingSpinner 
          type={type} 
          priority={priority}
          size={variant === 'inline' ? 24 : 40} 
        />
      case 'success':
        return <SuccessIcon 
          type={type}
          size={variant === 'inline' ? 24 : 40}
        />
      case 'error':
        return <ErrorIcon 
          size={variant === 'inline' ? 24 : 40}
        />
      default:
        return <LoadingSpinner 
          type={type} 
          priority={priority}
          size={variant === 'inline' ? 24 : 40}
        />
    }
  }

  const getMessage = () => {
    // For route changes, show appropriate navigation message
    if (type === 'route') {
      if (state === 'loading' || isRouteChanging) {
        return message || 'Loading page...'
      }
      return 'Navigating...'
    }
    
    switch (state) {
      case 'success':
        return message || getDefaultSuccessMessage(type)
      case 'error':
        return error || 'An error occurred'
      default:
        return message || getDefaultLoadingMessage(type)
    }
  }

  const getSubMessage = () => {
    // Don't show default submessages for route changes
    if (type === 'route' && !subMessage) {
      return null
    }
    
    if (subMessage) return subMessage
    
    switch (state) {
      case 'success':
        return getDefaultSuccessSubMessage(type)
      case 'error':
        return 'Please try again or contact support'
      default:
        return getDefaultLoadingSubMessage(type)
    }
  }

  // Generate loader content with proper spacing and animations
  const content = (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${state}-${instanceId}`}
        initial={{ opacity: 0, y: variant === 'inline' ? 5 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: variant === 'inline' ? -5 : -10 }}
        transition={{ 
          duration: priority === 'critical' ? 0.1 : 0.2,
          ease: 'easeInOut'
        }}
        className={cn(
          "flex flex-col items-center justify-center",
          variant === 'inline' ? 'p-2' : 'p-6',
          variant === 'fullscreen' ? 'min-h-[200px]' : ''
        )}
      >
        {renderIcon()}
        
        <motion.p 
          className={cn(
            "font-medium text-center max-w-sm",
            variant === 'inline' ? 'text-sm mt-2' : 'text-base mt-3',
            getMessageColor(state, type)
          )}
        >
          {getMessage()}
        </motion.p>

        {getSubMessage() && (
          <motion.p 
            className={cn(
              "text-muted-foreground text-center max-w-sm",
              variant === 'inline' ? 'text-xs mt-0.5' : 'text-sm mt-1'
            )}
          >
            {getSubMessage()}
          </motion.p>
        )}

        {showProgress && (
          <div className={cn(
            variant === 'inline' ? 'mt-2 w-32' : 'mt-4 w-64'
          )}>
            <ProgressBar
              progress={progress}
              showProgress={showProgress}
              estimatedDuration={estimatedDuration}
              startTime={startTime}
              type={type}
            />
          </div>
        )}

        {allowCancel && (
          <div className={cn(
            variant === 'inline' ? 'mt-2' : 'mt-4'
          )}>
            <CancelButton 
              onCancel={() => cancelLoading(instanceId)} 
              disabled={state !== 'loading'}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )

  if (content) {
    // Return the appropriate wrapper based on variant
    switch (variant) {
      case 'fullscreen':
        return (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            {content}
          </div>
        )
      case 'page':
        return (
          <div className="min-h-[400px] flex items-center justify-center">
            {content}
          </div>
        )
      default: // inline
        return content
    }
  }
  return null
}

// Utility functions
function getDefaultLoadingMessage(type?: LoaderType): string {
  switch (type) {
    case 'route': return 'Loading page...'
    case 'upload': return 'Uploading...'
    case 'data': return 'Loading data...'
    case 'action': return 'Processing...'
    default: return 'Loading...'
  }
}

function getDefaultLoadingSubMessage(type?: LoaderType): string {
  switch (type) {
    case 'route': return ''
    case 'upload': return 'This may take a moment'
    case 'data': return 'Fetching latest data'
    case 'action': return 'Please wait'
    default: return ''
  }
}

function getDefaultSuccessMessage(type?: LoaderType): string {
  switch (type) {
    case 'route': return 'Page loaded'
    case 'upload': return 'Upload complete'
    case 'data': return 'Data loaded'
    case 'action': return 'Complete'
    default: return 'Success'
  }
}

function getDefaultSuccessSubMessage(type?: LoaderType): string {
  switch (type) {
    case 'route': return ''
    case 'upload': return 'Your files have been uploaded'
    case 'data': return 'All data is up to date'
    case 'action': return 'Action completed successfully'
    default: return ''
  }
}

function getMessageColor(state: string, type?: LoaderType): string {
  switch (state) {
    case 'error':
      return 'text-red-600 dark:text-red-400'
    case 'success':
      return 'text-green-600 dark:text-green-400'
    default:
      switch (type) {
        case 'route': return 'text-purple-600 dark:text-purple-400'
        case 'upload': return 'text-green-600 dark:text-green-400'
        case 'data': return 'text-blue-600 dark:text-blue-400'
        case 'action': return 'text-yellow-600 dark:text-yellow-400'
        default: return 'text-gray-700 dark:text-gray-300'
      }
  }
}
