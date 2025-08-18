"use client"

import React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Play, X, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface AutoPlayNotificationProps {
  visible: boolean
  nextChapterTitle: string
  countdown: number
  onContinue: () => void
  onCancel: () => void
  className?: string
}

const AutoPlayNotification: React.FC<AutoPlayNotificationProps> = ({
  visible,
  nextChapterTitle,
  countdown,
  onContinue,
  onCancel,
  className
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "absolute bottom-4 right-4 z-50 bg-black/90 backdrop-blur-md text-white rounded-xl shadow-2xl border border-white/10 max-w-xs w-80",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Auto-play enabled</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
              onClick={onCancel}
              aria-label="Cancel auto-play"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Content */}
          <div className="px-3 pb-3">
            <div className="flex items-start gap-3">
              {/* Countdown circle */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center">
                  <span className="text-lg font-bold">{countdown}</span>
                </div>
                {/* Animated progress ring */}
                <svg className="absolute inset-0 w-12 h-12 -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="rgb(34 197 94)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (countdown / 5)}`}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
              </div>

              {/* Next chapter info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/70 mb-1">Next chapter</div>
                <div className="text-sm font-medium line-clamp-2 mb-2">
                  {nextChapterTitle}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={onContinue}
                    className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Continue
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onCancel}
                    className="h-7 px-3 text-white/70 hover:text-white hover:bg-white/10 text-xs"
                  >
                    Stay
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default React.memo(AutoPlayNotification)