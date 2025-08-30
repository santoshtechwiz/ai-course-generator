"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedLoaderProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  variant?: 'spinner' | 'pulse' | 'dots'
  className?: string
}

export function EnhancedLoader({
  message = "Loading...",
  size = 'medium',
  variant = 'spinner',
  className
}: EnhancedLoaderProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  }

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className={cn("border-2 border-primary border-t-transparent rounded-full", sizeClasses[size])}
          />
        )
      case 'pulse':
        return (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={cn("bg-primary rounded-full", sizeClasses[size])}
          />
        )
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className={cn("bg-primary rounded-full", sizeClasses.small)}
              />
            ))}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-3", className)}>
      {renderLoader()}
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground text-center"
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}

interface SkeletonLoaderProps {
  lines?: number
  className?: string
}

export function SkeletonLoader({ lines = 1, className }: SkeletonLoaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-muted rounded animate-pulse"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      ))}
    </div>
  )
}

interface PageLoaderProps {
  message?: string
  className?: string
}

export function PageLoader({ message = "Loading page...", className }: PageLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("min-h-screen flex items-center justify-center bg-background", className)}
    >
      <EnhancedLoader message={message} size="large" />
    </motion.div>
  )
}

interface FullScreenLoaderProps {
  message?: string
  overlay?: boolean
}

export function FullScreenLoader({ message, overlay = true }: FullScreenLoaderProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "fixed inset-0 flex items-center justify-center z-50",
          overlay && "bg-background/80 backdrop-blur-sm"
        )}
      >
        <EnhancedLoader message={message} size="large" />
      </motion.div>
    </AnimatePresence>
  )
}

interface StateLoaderProps {
  state: 'loading' | 'success' | 'error' | 'idle'
  message?: string
  successMessage?: string
  errorMessage?: string
  className?: string
}

export function StateLoader({
  state,
  message = "Loading...",
  successMessage = "Success!",
  errorMessage = "Error occurred",
  className
}: StateLoaderProps) {
  const getIcon = () => {
    switch (state) {
      case 'loading':
        return <Loader2 className="h-6 w-6 animate-spin text-primary" />
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />
      case 'idle':
        return <AlertCircle className="h-6 w-6 text-muted-foreground" />
      default:
        return null
    }
  }

  const getMessage = () => {
    switch (state) {
      case 'success':
        return successMessage
      case 'error':
        return errorMessage
      default:
        return message
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("flex flex-col items-center justify-center space-y-3", className)}
    >
      {getIcon()}
      <p className="text-sm text-muted-foreground text-center">
        {getMessage()}
      </p>
    </motion.div>
  )
}
