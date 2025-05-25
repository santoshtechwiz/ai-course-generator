"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface SpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  className = "", 
  size = "md" 
}) => {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  }[size]
  
  return (
    <Loader2 className={`animate-spin ${sizeClass} ${className}`} />
  )
}

interface LoadingOverlayProps {
  message?: string
  isVisible: boolean
  fullScreen?: boolean
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = "Loading...",
  isVisible,
  fullScreen = false
}) => {
  const [dots, setDots] = useState('.')
  
  // Update dots animation
  useEffect(() => {
    if (!isVisible) return
    
    const interval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '.')
    }, 500)
    
    return () => clearInterval(interval)
  }, [isVisible])
  
  if (!isVisible) return null
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`
        flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm
        ${fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 z-10'}
      `}
    >
      <div className="relative">
        <Spinner size="lg" className="text-primary" />
        <motion.div 
          className="absolute inset-0 rounded-full border-2 border-primary"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.5,
            ease: "easeOut" 
          }}
        />
      </div>
      <p className="mt-4 text-center font-medium">
        {message}{dots}
      </p>
    </motion.div>
  )
}

export const SkeletonLoader: React.FC<{
  count?: number
  height?: string
  className?: string
}> = ({
  count = 3,
  height = "h-12",
  className = ""
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`bg-muted rounded-md ${height} ${className}`}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut",
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  )
}
