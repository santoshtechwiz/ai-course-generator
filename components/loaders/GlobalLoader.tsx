"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HashLoader } from "react-spinners"
import { AlertCircle, CheckCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { useGlobalLoader } from "@/store/loaders/global-loader"

interface IconProps {
  size?: number
}

interface InlineSpinnerProps {
  size?: number
  className?: string
}

export function InlineSpinner({ size = 16, className = "" }: InlineSpinnerProps) {
  return (
    <HashLoader
      color="#3B82F6"
      size={size}
      cssOverride={{
        display: 'inline-block',
      }}
      className={className}
    />
  )
}

export function LoadingSpinner({ size = 40 }: IconProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      <HashLoader 
        color="#3B82F6"
        size={size}
        cssOverride={{
          display: 'block',
          margin: '0 auto',
        }}
      />
    </motion.div>
  )
}

function SuccessIcon({ size = 40 }: IconProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.3, type: "spring" }}
      className="flex items-center justify-center"
    >
      <CheckCircle 
        size={size} 
        className="text-emerald-500"
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

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-64 mt-4">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
        {Math.round(progress)}% complete
      </p>
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
        >
          {renderIcon()}
          
          <motion.p 
            className={cn(
              "text-sm font-medium mt-3 text-center",
              state === 'error' ? "text-red-600 dark:text-red-400" :
              state === 'success' ? "text-emerald-600 dark:text-emerald-400" :
              "text-gray-700 dark:text-gray-300"
            )}
          >
            {getMessage()}
          </motion.p>
          
          {getSubMessage() && (
            <motion.p 
              className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center"
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex flex-col items-center space-y-4 p-8 rounded-xl shadow-2xl border max-w-sm mx-4",
            state === 'error' 
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30" 
              : state === 'success'
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30"
              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          )}
        >
          {renderIcon()}
          
          <div className="text-center space-y-2">
            <motion.h3 
              className={cn(
                "text-lg font-semibold",
                state === 'error' 
                  ? "text-red-700 dark:text-red-300" 
                  : state === 'success'
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-gray-900 dark:text-gray-100"
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

          {state === 'loading' && typeof progress === 'number' && (
            <ProgressBar progress={progress} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
