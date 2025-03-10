"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import {
  Bot,
  BookOpen,
  FileText,
  Sparkles,
  BrainCircuit,
  ListChecks,
  Rocket,
  Zap,
  Brain,
  Code,
  Target,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Bot,
    secondaryIcons: [Rocket, Brain, Star],
    title: "Your AI Learning Partner",
    description: "Experience personalized learning with our advanced AI that adapts to your unique needs.",
    gradient: "from-blue-500 to-cyan-500",
    color: "text-blue-500",
  },
  {
    icon: BookOpen,
    secondaryIcons: [Code, Target, Zap],
    title: "Smart Course Generation",
    description: "Transform any topic into a structured learning experience in seconds.",
    gradient: "from-purple-500 to-pink-500",
    color: "text-purple-500",
  },
  {
    icon: FileText,
    secondaryIcons: [Brain, Star, Rocket],
    title: "Instant Transcripts",
    description: "Generate accurate transcripts in seconds for any course.",
    gradient: "from-indigo-500 to-purple-500",
    color: "text-indigo-500",
  },
  {
    icon: BrainCircuit,
    secondaryIcons: [Zap, Code, Target],
    title: "Auto Quiz Generation",
    description: "AI automatically creates relevant quizzes to test your understanding.",
    gradient: "from-pink-500 to-rose-500",
    color: "text-pink-500",
  },
  {
    icon: ListChecks,
    secondaryIcons: [Target, Brain, Code],
    title: "Custom Quiz Creation",
    description: "Design your own quizzes or let AI enhance your existing questions.",
    gradient: "from-violet-500 to-purple-500",
    color: "text-violet-500",
  },
  {
    icon: Sparkles,
    secondaryIcons: [Star, Rocket, Zap],
    title: "Interactive Learning",
    description: "Engage with dynamic content that makes learning more effective.",
    gradient: "from-rose-500 to-orange-500",
    color: "text-rose-500",
  },
]

const FeatureVideo: React.FC = () => {
  const [currentFeature, setCurrentFeature] = useState(0)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.3 })

  // Auto-advance functionality
  useEffect(() => {
    if (!isInView) return

    let startTime = Date.now()
    const duration = 5000 // 5 seconds per feature

    // Update progress every 16ms (roughly 60fps)
    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / duration) * 100, 100)
      setProgress(newProgress)

      if (elapsed >= duration) {
        startTime = Date.now()
        setCurrentFeature((prev) => (prev + 1) % features.length)
      }
    }

    intervalRef.current = setInterval(updateProgress, 16)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [currentFeature, isInView, features.length])

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[1400px] mx-auto rounded-xl shadow-lg bg-background relative overflow-hidden"
      style={{ height: "600px" }}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{
          background: [
            `linear-gradient(120deg, ${features[currentFeature].gradient.split(" ")[1]} 0%, ${features[currentFeature].gradient.split(" ")[3]} 100%)`,
            `linear-gradient(240deg, ${features[currentFeature].gradient.split(" ")[1]} 0%, ${features[currentFeature].gradient.split(" ")[3]} 100%)`,
            `linear-gradient(360deg, ${features[currentFeature].gradient.split(" ")[1]} 0%, ${features[currentFeature].gradient.split(" ")[3]} 100%)`,
          ],
        }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center p-6 md:p-10 h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={`feature-${currentFeature}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
            className="flex flex-col items-center text-center"
          >
            {/* Main Icon with Animation */}
            <motion.div
              className="relative mb-8 md:mb-12"
              initial={{ scale: 0.9, rotate: -5 }}
              animate={{
                scale: [0.9, 1.05, 1],
                rotate: [-5, 5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            >
              <div
                className={cn("relative w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56", "flex items-center justify-center")}
              >
                {/* Glowing background effect */}
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-full opacity-20",
                    `bg-gradient-to-r ${features[currentFeature].gradient}`,
                  )}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                />

                {/* Main icon */}
                <motion.div
                  className={cn("relative z-10", features[currentFeature].color)}
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 0.95, 1],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                >
                  {React.createElement(features[currentFeature].icon, {
                    className: "w-full h-full",
                  })}
                </motion.div>

                {/* Orbiting secondary icons */}
                {features[currentFeature].secondaryIcons.map((Icon, idx) => (
                  <motion.div
                    key={`orbit-${idx}`}
                    className={cn("absolute w-8 h-8 md:w-12 md:h-12", features[currentFeature].color)}
                    animate={{
                      rotate: 360 * (idx % 2 === 0 ? 1 : -1),
                      scale: [0.8, 1, 0.8],
                    }}
                    transition={{
                      rotate: {
                        duration: 8 + idx * 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      },
                      scale: {
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      },
                    }}
                    style={{
                      left: `${50 + 45 * Math.cos((2 * Math.PI * idx) / 3)}%`,
                      top: `${50 + 45 * Math.sin((2 * Math.PI * idx) / 3)}%`,
                      transformOrigin: "center center",
                    }}
                  >
                    <Icon />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Title with text animation */}
            <motion.h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 text-foreground tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {features[currentFeature].title}
            </motion.h2>

            {/* Description with text animation */}
            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {features[currentFeature].description}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="absolute bottom-6 left-0 w-full px-6">
          <div className="w-full max-w-3xl mx-auto h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full", `bg-gradient-to-r ${features[currentFeature].gradient}`)}
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.05 }}
            />
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-12 left-0 w-full flex justify-center space-x-2">
        {features.map((_, idx) => (
          <div
            key={`dot-${idx}`}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              idx === currentFeature ? `bg-gradient-to-r ${features[idx].gradient}` : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  )
}

export default FeatureVideo