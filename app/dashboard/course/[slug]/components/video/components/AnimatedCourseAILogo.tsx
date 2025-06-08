"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

interface AnimatedCourseAILogoProps {
  show: boolean
  videoEnding?: boolean; // Add this as an optional prop
  onAnimationComplete: () => void
  className?: string; // Add this as an optional prop
}

const AnimatedCourseAILogo: React.FC<AnimatedCourseAILogoProps> = ({ 
  show, 
  videoEnding = false, // Default to false if not provided
  onAnimationComplete,
  className = "" // Default to empty string if not provided
}) => {
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    if (animationComplete) {
      onAnimationComplete()
    }
  }, [animationComplete, onAnimationComplete])

  // Reset animation complete state when show changes
  useEffect(() => {
    if (show) {
      setAnimationComplete(false)
    }
  }, [show]);

  const handleAnimationComplete = () => {
    // Only set animation complete when hiding the logo
    if (!show) {
      setAnimationComplete(true)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={handleAnimationComplete}
      className={`absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: show ? 1 : 0 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
          duration: 0.7,
          delay: 0.2,
        }}
        className="relative w-64 h-64"
      >
        <Image src="/courseai-logo.png" alt="Course AI Logo" layout="fill" objectFit="contain" />
      </motion.div>
    </motion.div>
  )
}

export default AnimatedCourseAILogo
