"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HashLoader, PulseLoader } from "react-spinners"
import { Brain, CheckCircle, AlertCircle, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

interface QuizCreationLoaderProps {
  isLoading: boolean
  status: "idle" | "loading" | "success" | "error"
  progress?: number
  message?: string
  errorMessage?: string
  onRetry?: () => void
  className?: string
}

const statusConfig = {
  idle: {
    icon: Brain,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  loading: {
    icon: Sparkles,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  success: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
  },
}

export function QuizCreationLoader({
  isLoading,
  status,
  progress = 0,
  message,
  errorMessage,
  onRetry,
  className,
}: QuizCreationLoaderProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const getStatusMessage = () => {
    if (status === "error" && errorMessage) return errorMessage
    if (message) return message
    
    switch (status) {
      case "idle":
        return "Ready to create quiz"
      case "loading":
        return "Generating your quiz..."
      case "success":
        return "Quiz created successfully!"
      case "error":
        return "Failed to create quiz"
      default:
        return ""
    }
  }

  const getProgressMessage = () => {
    if (status === "loading" && progress > 0) {
      return `Processing... ${Math.round(progress)}%`
    }
    return ""
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading || status !== "idle" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "relative overflow-hidden rounded-xl border p-6 transition-all duration-300",
            config.bgColor,
            config.borderColor,
            className
          )}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-current to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            {/* Status Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className={cn(
                "flex items-center justify-center w-16 h-16 rounded-full bg-white/80 dark:bg-black/20 border-2",
                config.borderColor
              )}
            >
              {status === "loading" ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <HashLoader size={32} color="#8b5cf6" />
                </motion.div>
              ) : (
                <Icon className={cn("w-8 h-8", config.color)} />
              )}
            </motion.div>

            {/* Status Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {getStatusMessage()}
              </h3>
              
              {getProgressMessage() && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getProgressMessage()}
                </p>
              )}
            </motion.div>

            {/* Progress Bar */}
            {status === "loading" && progress > 0 && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "100%" }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-xs"
              >
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}

            {/* Loading Animation */}
            {status === "loading" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <PulseLoader size={8} color="#8b5cf6" />
                <span>AI is working its magic</span>
              </motion.div>
            )}

            {/* Error Actions */}
            {status === "error" && onRetry && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-2"
              >
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default QuizCreationLoader