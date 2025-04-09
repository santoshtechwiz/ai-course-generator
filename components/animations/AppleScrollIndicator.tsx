"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

interface AppleScrollIndicatorProps {
  onClick: () => void
  showAfter?: number
  hideAfter?: number
  className?: string
}

const AppleScrollIndicator = ({
  onClick,
  showAfter = 1000,
  hideAfter = 5000,
  className = "",
}: AppleScrollIndicatorProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    // Show the indicator after a delay
    const showTimer = setTimeout(() => {
      setIsVisible(true)
    }, showAfter)

    // Hide the indicator after user scrolls or after hideAfter
    const hideTimer = setTimeout(() => {
      setIsVisible(false)
    }, hideAfter)

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHasScrolled(true)
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [showAfter, hideAfter])

  return (
    <AnimatePresence>
      {isVisible && !hasScrolled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className={`absolute bottom-10 left-1/2 transform -translate-x-1/2 cursor-pointer ${className}`}
          onClick={onClick}
          role="button"
          aria-label="Scroll down"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onClick()
            }
          }}
        >
          <motion.div className="flex flex-col items-center">
            <motion.span
              className="text-sm text-muted-foreground mb-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              Scroll to explore
            </motion.span>
            <motion.div
              className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/5"
              animate={{
                y: [0, 10, 0],
                boxShadow: [
                  "0 0 0 0 rgba(var(--primary-rgb), 0)",
                  "0 0 0 3px rgba(var(--primary-rgb), 0.1)",
                  "0 0 0 0 rgba(var(--primary-rgb), 0)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <ChevronDown className="h-5 w-5 text-primary" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AppleScrollIndicator
