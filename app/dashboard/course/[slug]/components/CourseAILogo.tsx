"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface CourseAILogoProps {
  show: boolean
  theaterMode?: boolean
  showControls?: boolean
}

export const CourseAILogo: React.FC<CourseAILogoProps> = ({ show, theaterMode = false, showControls = true }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "absolute z-20 pointer-events-none select-none",
            "transition-all duration-300 ease-in-out",
            // Position based on theater mode
            theaterMode ? "top-4 left-4" : "top-3 left-3",
            // Opacity based on controls visibility
            showControls ? "opacity-60 hover:opacity-80" : "opacity-30",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "bg-black/40 backdrop-blur-sm border border-white/10",
              "text-white font-medium text-sm",
              theaterMode ? "text-base" : "text-xs",
            )}
          >
            {/* Logo Icon */}
            <div
              className={cn(
                "flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600",
                theaterMode ? "w-6 h-6" : "w-5 h-5",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={cn("text-white", theaterMode ? "w-4 h-4" : "w-3 h-3")}
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Logo Text */}
            <span className="font-semibold tracking-tight">
              Course<span className="text-blue-400">AI</span>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
