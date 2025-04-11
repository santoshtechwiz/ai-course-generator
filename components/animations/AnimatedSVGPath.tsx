"use client"

import { motion } from "framer-motion"

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
  return (
    <motion.path
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill}
      className={className}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{
        pathLength: {
          delay,
          duration,
          ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
        },
        opacity: {
          delay,
          duration: Math.min(0.5, duration / 2),
        },
      }}
      style={{ willChange: "transform, opacity" }}
    />
  )
}

export default AnimatedSVGPath
