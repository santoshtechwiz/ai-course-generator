"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'

const completionWrapperVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    scale: 0.8, 
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

const checkmarkVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15
    }
  }
}

const particleVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1,
    opacity: [0, 1, 0],
    transition: {
      duration: 0.8,
      times: [0, 0.2, 1]
    }
  }
}

const completionStyles = cva(
  "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
  {
    variants: {
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8"
      },
      variant: {
        default: "",
        success: "bg-green-500/10",
        celebration: "bg-primary/10"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "success"
    }
  }
)

interface ChapterCompletionLoaderProps {
  show: boolean
  onComplete?: () => void
  message?: string
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "celebration"
  autoHide?: boolean
  autoHideDelay?: number
}

export function ChapterCompletionLoader({
  show,
  onComplete,
  message = "Chapter Complete!",
  className,
  size = "md",
  variant = "success",
  autoHide = true,
  autoHideDelay = 2000
}: ChapterCompletionLoaderProps) {
  React.useEffect(() => {
    if (show && autoHide) {
      const timer = setTimeout(() => {
        onComplete?.()
      }, autoHideDelay)
      return () => clearTimeout(timer)
    }
  }, [show, autoHide, autoHideDelay, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn(completionStyles({ size, variant }), className)}
          variants={completionWrapperVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="relative flex flex-col items-center gap-4">
            {/* Celebration particles */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    rotate: `${i * 45}deg`,
                    translateX: "100px"
                  }}
                  variants={particleVariants}
                  initial="initial"
                  animate="animate"
                >
                  <Star className="w-4 h-4 text-primary" />
                </motion.div>
              ))}
            </div>

            {/* Checkmark icon */}
            <motion.div
              variants={checkmarkVariants}
              initial="initial"
              animate="animate"
              className="relative z-10"
            >
              <div className="rounded-full bg-green-500/20 p-2">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </motion.div>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-medium text-primary"
            >
              {message}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ChapterCompletionLoader