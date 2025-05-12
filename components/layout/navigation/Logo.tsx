"use client"
import type React from "react"
import { motion } from "framer-motion"

interface LogoProps {
  size?: "small" | "medium" | "large"
  variant?: "default" | "minimal"
}

const Logo: React.FC<LogoProps> = ({ size = "medium", variant = "default" }) => {
  const dimensions = {
    small: { width: 32, height: 32, fontSize: 16, logoGap: 8 },
    medium: { width: 40, height: 40, fontSize: 20, logoGap: 10 },
    large: { width: 48, height: 48, fontSize: 24, logoGap: 12 },
  }

  const { width, height, fontSize, logoGap } = dimensions[size]

  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.3, type: "spring", duration: 1.2, bounce: 0 },
        opacity: { delay: i * 0.3, duration: 0.01 },
      },
    }),
  }

  return (
    <motion.div initial="hidden" animate="visible" className={`flex items-center gap-${logoGap} flex-shrink-0`}>
      <div style={{ width, height }} className="relative">
        <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background circle with gradient */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="url(#logoGradient)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          {/* Neural network lines */}
          <motion.path
            d="M30 30 L50 50 L70 30 M30 70 L50 50 L70 70"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            variants={draw}
            custom={1}
          />

          {/* Circuit board pattern */}
          <motion.path
            d="M20 50 H40 M60 50 H80 M50 20 V40 M50 60 V80"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            variants={draw}
            custom={2}
          />

          {/* Define gradient */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(221, 83%, 53%)" />
              <stop offset="100%" stopColor="hsl(217, 91%, 60%)" />
            </linearGradient>
          </defs>
        </svg>

        {/* AI text as a separate element for better positioning */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-white font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          style={{ fontSize: fontSize * 0.8 }}
        >
          AI
        </motion.div>
      </div>

      {/* CourseAI Text - only show if not minimal variant */}
      {variant !== "minimal" && (
        <motion.span
          className="font-bold tracking-tight text-primary"
          style={{ fontSize: `${fontSize}px` }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          CourseAI
        </motion.span>
      )}
    </motion.div>
  )
}

export default Logo
