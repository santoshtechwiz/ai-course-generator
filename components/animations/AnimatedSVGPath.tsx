// Optimize AnimatedSVGPath component for better performance
"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface AnimatedSVGPathProps {
  d: string
  stroke?: string
  strokeWidth?: number
  fill?: string
  delay?: number
  duration?: number
  className?: string
}

const AnimatedSVGPath = ({
  d,
  stroke = "currentColor",
  strokeWidth = 2,
  fill = "none",
  delay = 0,
  duration = 1.5,
  className = "",
}: AnimatedSVGPathProps) => {
  const [isClient, setIsClient] = useState(false)

  // Only run animations on client-side to avoid hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Optimize the path animation for better performance
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          duration,
          delay,
          ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
        },
        opacity: {
          duration: Math.min(duration * 0.5, 0.5), // Reduced opacity animation duration
          delay,
          ease: "easeIn",
        },
      },
    },
  }

  // Don't render animations during SSR to avoid hydration issues
  if (!isClient) {
    return (
      <path d={d} stroke={stroke} strokeWidth={strokeWidth} fill={fill} className={className} style={{ opacity: 0 }} />
    )
  }

  return (
    <motion.path
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill}
      className={className}
      variants={pathVariants}
      initial="hidden"
      animate="visible"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ willChange: "stroke-dashoffset, opacity" }}
    />
  )
}

export default AnimatedSVGPath
