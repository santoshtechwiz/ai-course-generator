"use client"

import type React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CourseAILoaderProps {
  className?: string
  size?: "sm" | "md" | "lg"
  color?: string
}

const sizes = {
  sm: "w-24 h-24",
  md: "w-32 h-32",
  lg: "w-40 h-40",
}

const CourseAILoader: React.FC<CourseAILoaderProps> = ({ className, size = "md", color = "hsl(var(--primary))" }) => {
  const orbitCount = 3
  const particleCount = 6

  const orbitVariants = {
    rotate: {
      rotate: 360,
      transition: {
        duration: 20,
        ease: "linear",
        repeat: Number.POSITIVE_INFINITY,
      },
    },
  }

  const particleVariants = {
    pulse: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Number.POSITIVE_INFINITY,
      },
    },
  }

  const coreVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 3,
        ease: "easeInOut",
        repeat: Number.POSITIVE_INFINITY,
      },
    },
  }

  const glowVariants = {
    pulse: {
      opacity: [0.5, 0.7, 0.5],
      scale: [0.8, 1, 0.8],
      transition: {
        duration: 3,
        ease: "easeInOut",
        repeat: Number.POSITIVE_INFINITY,
      },
    },
  }

  return (
    <div className={cn("relative", sizes[size], className)}>
      {/* Orbits and Particles */}
      {[...Array(orbitCount)].map((_, index) => (
        <motion.div
          key={`orbit-${index}`}
          className="absolute inset-0"
          variants={orbitVariants}
          animate="rotate"
          style={{
            rotateZ: index * (360 / orbitCount),
            rotateY: index * 30,
          }}
        >
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: color,
              opacity: 0.2 - index * 0.05,
            }}
          />
          {[...Array(particleCount)].map((_, pIndex) => (
            <motion.div
              key={`particle-${index}-${pIndex}`}
              className="absolute rounded-full"
              style={{
                width: 6 - index,
                height: 6 - index,
                backgroundColor: color,
                top: `${50 + 45 * Math.cos((2 * Math.PI * pIndex) / particleCount)}%`,
                left: `${50 + 45 * Math.sin((2 * Math.PI * pIndex) / particleCount)}%`,
              }}
              variants={particleVariants}
              animate="pulse"
            />
          ))}
        </motion.div>
      ))}

      {/* Core */}
      <motion.div
        className="absolute inset-0 m-auto rounded-full"
        style={{
          width: "30%",
          height: "30%",
          backgroundColor: color,
        }}
        variants={coreVariants}
        animate="pulse"
      />

      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 m-auto rounded-full blur-md"
        style={{
          width: "40%",
          height: "40%",
          backgroundColor: color,
        }}
        variants={glowVariants}
        animate="pulse"
      />
    </div>
  )
}

export default CourseAILoader
