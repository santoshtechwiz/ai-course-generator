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
            "absolute bottom-4 right-4 z-50 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-white/20 max-w-xs w-80",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-blue-200">Next chapter ready</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
              onClick={onCancel}
              aria-label="Cancel auto-play"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Content */}
          <div className="px-4 pb-4">
            <div className="flex items-start gap-4">
              {/* Enhanced Countdown circle */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full border-2 border-blue-500/30 bg-gradient-to-br from-blue-600/20 to-blue-800/20 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-xl font-bold text-blue-300">{countdown}</span>
                </div>
                {/* Animated progress ring */}
                <svg className="absolute inset-0 w-14 h-14 -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="rgb(59 130 246)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (1 - (5 - countdown) / 5)}`}
                    className="transition-all duration-1000 ease-linear filter drop-shadow-lg"
                  />
                </svg>
              </div>

              {/* Next chapter info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-blue-300/80 mb-1 font-medium">Up next</div>
                <div className="text-sm font-medium line-clamp-2 mb-3 text-white leading-relaxed">
                  {nextChapterTitle}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={onContinue}
                    className="h-8 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Continue
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onCancel}
                    className="h-8 px-4 text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium rounded-lg transition-all duration-200"
                  >
                    Stay here
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