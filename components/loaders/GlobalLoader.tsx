"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HashLoader, PulseLoader, ClipLoader } from "react-spinners"
import { AlertCircle, CheckCircle, X, Loader2, Upload, Route, Database, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGlobalLoader, LoaderType } from "@/store/loaders/global-loader"

interface IconProps {
  size?: number
}

interface InlineSpinnerProps {
  size?: number
  className?: string
  type?: LoaderType
}

// Enhanced spinner with type-specific styling
export function InlineSpinner({ size = 16, className = "", type = 'custom' }: InlineSpinnerProps) {
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
export function LoadingSpinner({ size = 40, type = 'custom', priority = 'medium' }: IconProps & { type?: LoaderType, priority?: string }) {
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

  const { component: SpinnerComponent, color, icon: IconComponent } = getSpinnerProps()

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
      
      {/* Type indicator icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <IconComponent size={size * 0.4} color={color} />
      </div>
    </motion.div>
  )
}

function SuccessIcon({ size = 40, type }: IconProps & { type?: LoaderType }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.3, type: "spring", bounce: 0.5 }}
      className="flex items-center justify-center"
    >
      <CheckCircle 
        size={size} 
        className={cn(
          type === 'route' ? "text-purple-500" :
          type === 'upload' ? "text-emerald-500" :
          type === 'data' ? "text-blue-500" :
          type === 'action' ? "text-orange-500" :
          "text-emerald-500"
        )}
      />
    </motion.div>
  )
}

function ErrorIcon({ size = 40 }: IconProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0, rotate: 180 }}
      transition={{ duration: 0.3, type: "spring" }}
      className="flex items-center justify-center"
    >
      <AlertCircle 
        size={size} 
        className="text-red-500"
      />
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
  const [estimatedProgress, setEstimatedProgress] = React.useState(progress)

  // Auto-estimate progress for certain types
  React.useEffect(() => {
    if (!showProgress && estimatedDuration && startTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const estimated = Math.min(95, (elapsed / estimatedDuration) * 100)
        setEstimatedProgress(estimated)
      }, 100)

      return () => clearInterval(interval)
    }
  }, [showProgress, estimatedDuration, startTime])

  const displayProgress = showProgress ? progress : estimatedProgress
  
  const getProgressColor = () => {
    switch (type) {
      case 'route': return 'from-purple-500 to-purple-600'
      case 'upload': return 'from-emerald-500 to-emerald-600'
      case 'data': return 'from-blue-500 to-cyan-500'
      case 'action': return 'from-orange-500 to-orange-600'
      default: return 'from-blue-500 to-cyan-500'
    }
  }

  return (
    <div className="w-64 mt-4">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", getProgressColor())}
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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
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
  const { 
    state, 
    isLoading, 
    message, 
    subMessage, 
    progress, 
    isBlocking, 
    error,
    allowCancel,
    showProgress,
    type,
    priority,
    cancelLoading,
    estimatedDuration,
    startTime,
    instanceId,
    routeChangeInProgress
  } = useGlobalLoader()

  // Don't render if idle and no route change
  if (state === 'idle' && !routeChangeInProgress) {
    return null
  }

  const renderIcon = () => {
    switch (state) {
      case 'loading':
        return <LoadingSpinner type={type} priority={priority} />
      case 'success':
        return <SuccessIcon type={type} />
      case 'error':
        return <ErrorIcon />
      default:
        return <LoadingSpinner type={type} priority={priority} />
    }
  }

  const getMessage = () => {
    if (routeChangeInProgress && state === 'idle') {
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
    if (routeChangeInProgress && state === 'idle') {
      return 'Loading new page...'
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

  // Non-blocking loader (inline)
  if (!isBlocking && !routeChangeInProgress) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`${state}-${instanceId}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: priority === 'critical' ? 0.1 : 0.2 }}
          className="flex flex-col items-center justify-center p-6"
        >
          {renderIcon()}
          
          <motion.p 
            className={cn(
              "text-sm font-medium mt-3 text-center max-w-sm",
              getMessageColor(state, type)
            )}
          >
            {getMessage()}
          </motion.p>
          
          {getSubMessage() && (
            <motion.p 
              className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center max-w-sm"
            >
              {getSubMessage()}
            </motion.p>
          )}
          
          {(showProgress || estimatedDuration) && state === 'loading' && (
            <ProgressBar 
              progress={progress} 
              showProgress={showProgress}
              estimatedDuration={estimatedDuration}
              startTime={startTime}
              type={type}
            />
          )}

          {allowCancel && state === 'loading' && instanceId && (
            <CancelButton onCancel={() => cancelLoading(instanceId)} />
          )}
        </motion.div>
      </AnimatePresence>
    )
  }

  // Blocking loader (fullscreen) or route change indicator
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${state}-${instanceId}-${routeChangeInProgress}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ 
          duration: priority === 'critical' ? 0.1 : 0.3,
          ease: "easeOut"
        }}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          routeChangeInProgress || isBlocking 
            ? "bg-background/90 backdrop-blur-sm"
            : "bg-background/70 backdrop-blur-sm"
        )}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2, type: "spring" }}
          className={cn(
            "flex flex-col items-center space-y-4 p-8 rounded-xl shadow-2xl border max-w-md mx-4",
            getContainerColor(state, type)
          )}
        >
          {renderIcon()}
          
          <div className="text-center space-y-2">
            <motion.h3 
              className={cn(
                "text-lg font-semibold",
                getMessageColor(state, type)
              )}
            >
              {getMessage()}
            </motion.h3>
            
            {getSubMessage() && (
              <motion.p 
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                {getSubMessage()}
              </motion.p>
            )}
          </div>

          {(showProgress || estimatedDuration) && state === 'loading' && (
            <ProgressBar 
              progress={progress} 
              showProgress={showProgress}
              estimatedDuration={estimatedDuration}
              startTime={startTime}
              type={type}
            />
          )}

          {allowCancel && state === 'loading' && instanceId && (
            <CancelButton onCancel={() => cancelLoading(instanceId)} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Utility functions
function getDefaultLoadingMessage(type?: LoaderType): string {
  switch (type) {
    case 'route': return 'Navigating...'
    case 'upload': return 'Uploading files...'
    case 'data': return 'Loading data...'
    case 'action': return 'Processing...'
    default: return 'Loading...'
  }
}

function getDefaultLoadingSubMessage(type?: LoaderType): string {
  switch (type) {
    case 'route': return 'Loading new page'
    case 'upload': return 'Please wait while we process your files'
    case 'data': return 'Fetching the latest information'
    case 'action': return 'Completing your request'
    default: return 'Please wait...'
  }
}

function getDefaultSuccessMessage(type?: LoaderType): string {
  switch (type) {
    case 'route': return 'Page loaded!'
    case 'upload': return 'Upload complete!'
    case 'data': return 'Data loaded!'
    case 'action': return 'Success!'
    default: return 'Operation completed successfully!'
  }
}

function getDefaultSuccessSubMessage(type?: LoaderType): string {
  switch (type) {
    case 'route': return 'Welcome to your new page'
    case 'upload': return 'Your files have been processed'
    case 'data': return 'Information is now available'
    case 'action': return 'Your request has been completed'
    default: return 'Your request has been processed'
  }
}

function getMessageColor(state: string, type?: LoaderType): string {
  if (state === 'error') {
    return "text-red-600 dark:text-red-400"
  }
  
  if (state === 'success') {
    switch (type) {
      case 'route': return "text-purple-600 dark:text-purple-400"
      case 'upload': return "text-emerald-600 dark:text-emerald-400"
      case 'data': return "text-blue-600 dark:text-blue-400"
      case 'action': return "text-orange-600 dark:text-orange-400"
      default: return "text-emerald-600 dark:text-emerald-400"
    }
  }
  
  return "text-gray-700 dark:text-gray-300"
}

function getContainerColor(state: string, type?: LoaderType): string {
  if (state === 'error') {
    return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30"
  }
  
  if (state === 'success') {
    switch (type) {
      case 'route': return "bg-purple