"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion, useAnimation } from "framer-motion"
import { cn } from "@/lib/utils"
import { Loader2 } from 'lucide-react'

interface ComponentLoaderProps {
  className?: string
  size?: "sm" | "md" | "lg"
  color?: string
  loadingText?: string
  loadingSteps?: string[]
}

const sizes = {
  sm: "w-24 h-24",
  md: "w-32 h-32",
  lg: "w-40 h-40",
}

const ComponentLoader: React.FC<ComponentLoaderProps> = React.memo(({ 
  className, 
  size = "md", 
  color = "hsl(var(--primary))",
  loadingText = "AI is processing your request",
  loadingSteps = [
    "Analyzing content",
    "Generating insights",
    "Preparing response",
    "Finalizing results"
  ]
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const controls = useAnimation()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const updateStep = useCallback(() => {
    setCurrentStep((prev) => (prev + 1) % loadingSteps.length)
  }, [loadingSteps.length])

  useEffect(() => {
    intervalRef.current = setInterval(updateStep, 3000)

    controls.start({
      scale: [1, 1.1, 1],
      transition: { duration: 2, repeat: Infinity }
    })

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [controls, updateStep])

  const orbitVariants = {
    rotate: (i: number) => ({
      rotate: 360,
      transition: {
        duration: 20 - i * 5,
        ease: "linear",
        repeat: Infinity,
      },
    }),
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)} role="status" aria-live="polite">
      <div className={cn("relative", sizes[size])}>
        {[...Array(3)].map((_, index) => (
          <motion.div
            key={`orbit-${index}`}
            className="absolute inset-0"
            custom={index}
            variants={orbitVariants}
            animate="rotate"
          >
            <div 
              className="absolute inset-0 rounded-full border-2"
              style={{ 
                borderColor: color,
                opacity: 0.2 - index * 0.05,
              }}
            />
          </motion.div>
        ))}

        <motion.div
          className="absolute inset-0 m-auto rounded-full flex items-center justify-center"
          style={{ 
            width: '50%', 
            height: '50%', 
            backgroundColor: color,
          }}
          animate={controls}
        >
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </motion.div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-lg font-semibold mb-2">{loadingText}</p>
        <p className="text-sm text-muted-foreground">{loadingSteps[currentStep]}</p>
      </div>

      <div className="mt-4 flex space-x-2">
        {loadingSteps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full",
              index === currentStep ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  )
})

ComponentLoader.displayName = 'ComponentLoader'

export default ComponentLoader

