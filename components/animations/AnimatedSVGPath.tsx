"use client"

import { motion } from "framer-motion"

interface AnimatedSVGPathProps {
  d: string
  stroke?: string
  strokeWidth?: number
  fill?: string
  delay?: number
  duration?: number
  repeat?: number | "loop" | "mirror"
  className?: string
}

const AnimatedSVGPath = ({
  d,
  stroke = "currentColor",
  strokeWidth = 2,
  fill = "none",
  delay = 0,
  duration = 2,
  repeat = 0,
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
          type: "spring",
          duration,
          bounce: 0,
        },
        opacity: { delay, duration: duration * 0.5 },
      }}
      style={{ willChange: "opacity, stroke-dashoffset" }}
    />
  )
}

export default AnimatedSVGPath
