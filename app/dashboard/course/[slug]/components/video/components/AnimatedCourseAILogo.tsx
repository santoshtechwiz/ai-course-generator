"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedCourseAILogoProps {
  show: boolean
  videoEnding?: boolean
  onAnimationComplete?: () => void
  className?: string
}

export const AnimatedCourseAILogo: React.FC<AnimatedCourseAILogoProps> = ({
  show,
  videoEnding = false,
  onAnimationComplete,
  className,
}) => {
  const [animationPhase, setAnimationPhase] = useState<"center" | "slide" | "corner">("center")

  useEffect(() => {
    if (videoEnding && show) {
      // Start with center animation
      setAnimationPhase("center")

      // After 2 seconds, slide to the right
      const slideTimer = setTimeout(() => {
        setAnimationPhase("slide")
      }, 2000)

      // After another 1 second, move to corner
      const cornerTimer = setTimeout(() => {
        setAnimationPhase("corner")
        onAnimationComplete?.()
      }, 3000)

      return () => {
        clearTimeout(slideTimer)
        clearTimeout(cornerTimer)
      }
    } else if (!videoEnding) {
      setAnimationPhase("corner")
    }
  }, [videoEnding, show, onAnimationComplete])

  const getAnimationProps = () => {
    switch (animationPhase) {
      case "center":
        return {
          initial: { opacity: 0, scale: 0.5, x: 0, y: 0 },
          animate: { opacity: 1, scale: 1.2, x: 0, y: 0 },
          transition: { duration: 0.8, ease: "easeOut" },
          className: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
        }
      case "slide":
        return {
          animate: { opacity: 1, scale: 1, x: "200px", y: "-200px" },
          transition: { duration: 1, ease: "easeInOut" },
          className: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
        }
      case "corner":
        return {
          animate: { opacity: 0.8, scale: 0.8, x: 0, y: 0 },
          transition: { duration: 0.5, ease: "easeOut" },
          className: "top-4 right-4",
        }
      default:
        return {
          animate: { opacity: 0.6, scale: 0.8, x: 0, y: 0 },
          className: "top-4 right-4",
        }
    }
  }

  const animationProps = getAnimationProps()

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          {...animationProps}
          exit={{ opacity: 0, scale: 0.5 }}
          className={cn("absolute z-20 pointer-events-none select-none", animationProps.className, className)}
        >
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-lg",
              "bg-black/60 backdrop-blur-md border border-white/20",
              "text-white font-medium",
              animationPhase === "center" ? "text-lg" : "text-sm",
            )}
          >
            {/* Logo Icon */}
            <div
              className={cn(
                "flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600",
                animationPhase === "center" ? "w-8 h-8" : "w-6 h-6",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={cn("text-white", animationPhase === "center" ? "w-5 h-5" : "w-4 h-4")}
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

            {/* Subtitle for center animation */}
            {animationPhase === "center" && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-white/80 text-sm ml-2"
              >
                Interactive Learning
              </motion.span>
            )}
          </div>

          {/* Glow effect for center animation */}
          {animationPhase === "center" && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AnimatedCourseAILogo
