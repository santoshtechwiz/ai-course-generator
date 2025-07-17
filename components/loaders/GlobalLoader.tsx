"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, Loader2, Sparkles } from "lucide-react"
import { useGlobalLoader } from "@/store/global-loader"
import { cn } from "@/lib/utils"

// Design system colors for AI SaaS theme
const THEME_STYLES = {
  primary: {
    bg: "from-blue-500/10 to-cyan-500/10",
    border: "border-blue-200/50 dark:border-blue-800/50",
    accent: "text-blue-600 dark:text-blue-400",
    spinner: "#3B82F6",
  },
  secondary: {
    bg: "from-purple-500/10 to-pink-500/10", 
    border: "border-purple-200/50 dark:border-purple-800/50",
    accent: "text-purple-600 dark:text-purple-400",
    spinner: "#8B5CF6",
  },
  accent: {
    bg: "from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-200/50 dark:border-emerald-800/50", 
    accent: "text-emerald-600 dark:text-emerald-400",
    spinner: "#10B981",
  },
  minimal: {
    bg: "from-gray-500/5 to-slate-500/5",
    border: "border-gray-200/50 dark:border-gray-700/50",
    accent: "text-gray-600 dark:text-gray-400", 
    spinner: "#6B7280",
  },
}

const SIZE_STYLES = {
  xs: { icon: 12, text: "text-xs", spacing: "space-y-1", padding: "p-2" },
  sm: { icon: 16, text: "text-sm", spacing: "space-y-2", padding: "p-3" },
  md: { icon: 20, text: "text-base", spacing: "space-y-3", padding: "p-4" },
  lg: { icon: 24, text: "text-lg", spacing: "space-y-4", padding: "p-6" },
  xl: { icon: 32, text: "text-xl", spacing: "space-y-5", padding: "p-8" },
}

// Loader Variants
function SpinnerLoader({ size, color }: { size: number, color: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 size={size} style={{ color }} />
    </motion.div>
  )
}

function ShimmerLoader({ size, color }: { size: number, color: string }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      <div 
        className="absolute inset-0 rounded-full border-2 border-transparent"
        style={{ borderTopColor: color, borderRightColor: color }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, transparent, ${color}20, transparent)`
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  )
}

function DotsLoader({ size, color }: { size: number, color: string }) {
  const dotSize = size / 4
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ width: dotSize, height: dotSize, backgroundColor: color }}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

function PulseLoader({ size, color }: { size: number, color: string }) {
  return (
    <motion.div
      className="rounded-full"
      style={{ width: size, height: size, backgroundColor: color }}
      animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  )
}

function ProgressRing({ size, color, progress }: { size: number, color: string, progress: number }) {
  const radius = (size - 4) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium" style={{ color }}>
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}

function SuccessIcon({ size }: { size: number }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
    >
      <CheckCircle size={size} className="text-emerald-500" />
    </motion.div>
  )
}

function ErrorIcon({ size }: { size: number }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
    >
      <AlertCircle size={size} className="text-red-500" />
    </motion.div>
  )
}

function renderLoader(variant: string, size: number, color: string, progress?: number) {
  switch (variant) {
    case "shimmer":
      return <ShimmerLoader size={size} color={color} />
    case "dots":
      return <DotsLoader size={size} color={color} />
    case "pulse":
      return <PulseLoader size={size} color={color} />
    case "progress":
      return <ProgressRing size={size} color={color} progress={progress || 0} />
    default:
      return <SpinnerLoader size={size} color={color} />
  }
}

export function GlobalLoader() {
  const { currentLoader, isLoading } = useGlobalLoader()

  // Don't render if no active loader
  if (!isLoading || !currentLoader) {
    return null
  }

  const theme = THEME_STYLES[currentLoader.theme]
  const sizeConfig = SIZE_STYLES[currentLoader.size]

  const renderIcon = () => {
    switch (currentLoader.state) {
      case 'success':
        return <SuccessIcon size={sizeConfig.icon} />
      case 'error':
        return <ErrorIcon size={sizeConfig.icon} />
      default:
        return renderLoader(
          currentLoader.variant,
          sizeConfig.icon,
          theme.spinner,
          currentLoader.progress
        )
    }
  }

  const getMessage = () => {
    return currentLoader.message || 'Loading...'
  }

  const getSubMessage = () => {
    return currentLoader.subMessage
  }

  // Non-blocking loader (inline/overlay)
  if (!currentLoader.isBlocking) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLoader.id}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl backdrop-blur-sm",
            "bg-gradient-to-br border shadow-sm",
            theme.bg,
            theme.border,
            sizeConfig.padding,
            sizeConfig.spacing
          )}
        >
          {renderIcon()}
          
          <motion.p 
            className={cn(
              "font-medium text-center",
              sizeConfig.text,
              currentLoader.state === 'error' ? "text-red-600 dark:text-red-400" :
              currentLoader.state === 'success' ? "text-emerald-600 dark:text-emerald-400" :
              theme.accent
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {getMessage()}
          </motion.p>
          
          {getSubMessage() && (
            <motion.p 
              className={cn(
                "text-center text-muted-foreground",
                sizeConfig.text === "text-xs" ? "text-[10px]" : "text-xs"
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {getSubMessage()}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    )
  }

  // Blocking loader (fullscreen)
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentLoader.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
          className={cn(
            "flex flex-col items-center max-w-sm mx-4 rounded-2xl border shadow-2xl backdrop-blur-xl",
            "bg-gradient-to-br",
            currentLoader.state === 'error' 
              ? "from-red-50/90 to-red-100/90 dark:from-red-950/90 dark:to-red-900/90 border-red-200 dark:border-red-800" 
              : currentLoader.state === 'success'
              ? "from-emerald-50/90 to-emerald-100/90 dark:from-emerald-950/90 dark:to-emerald-900/90 border-emerald-200 dark:border-emerald-800"
              : `${theme.bg} dark:from-gray-900/90 dark:to-gray-800/90 ${theme.border}`,
            sizeConfig.padding,
            sizeConfig.spacing
          )}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          >
            {renderIcon()}
          </motion.div>
          
          <div className={cn("text-center", sizeConfig.spacing)}>
            <motion.h3 
              className={cn(
                "font-semibold",
                sizeConfig.text,
                currentLoader.state === 'error' 
                  ? "text-red-700 dark:text-red-300" 
                  : currentLoader.state === 'success'
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-gray-900 dark:text-gray-100"
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {getMessage()}
            </motion.h3>
            
            {getSubMessage() && (
              <motion.p 
                className={cn(
                  "text-muted-foreground",
                  sizeConfig.text === "text-xs" ? "text-[10px]" : "text-sm"
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {getSubMessage()}
              </motion.p>
            )}
          </div>

          {/* AI-style sparkle decoration for loading */}
          {currentLoader.state === 'loading' && (
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ 
                rotate: [0, 180, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles size={16} className={theme.accent} />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Export individual components for flexibility (but discourage direct usage)
export { SpinnerLoader, ShimmerLoader, DotsLoader, PulseLoader }

// Legacy LoadingSpinner component for backward compatibility
export function LoadingSpinner({ size = 20 }: { size?: number }) {
  console.warn("LoadingSpinner is deprecated. Use GlobalLoader with state management instead.")
  return <SpinnerLoader size={size} color="#3B82F6" />
}
