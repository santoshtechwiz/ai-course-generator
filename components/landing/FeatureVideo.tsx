"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useInView as useFramerInView } from "framer-motion"
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useFramerInView(containerRef, { once: false, amount: 0.3 })
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [progress, setProgress] = useState(0)
  const [isManualNavigation, setIsManualNavigation] = useState(false)

  // Handle feature navigation
  const goToFeature = (index: number) => {
    setIsManualNavigation(true)
    setCurrentFeature(index)
    setProgress(0)

    // Resume auto-progress after manual navigation
    setTimeout(() => {
      setIsManualNavigation(false)
    }, 1000)
  }

  const nextFeature = () => {
    goToFeature((currentFeature + 1) % features.length)
  }

  const prevFeature = () => {
    goToFeature((currentFeature - 1 + features.length) % features.length)
  }

  // Auto-advance functionality with progress tracking
  useEffect(() => {
    if (!isInView || isPaused || isManualNavigation) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      return
    }

    const duration = 6000 // 6 seconds per feature
    const updateInterval = 30 // Update progress every 30ms for smoother animation

    const startTime = Date.now()

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / duration) * 100, 100)
      setProgress(newProgress)

      if (elapsed >= duration) {
        nextFeature()
      }
    }, updateInterval)

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [currentFeature, isInView, isPaused, isManualNavigation])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextFeature()
      } else if (e.key === "ArrowLeft") {
        prevFeature()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentFeature])

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[1400px] mx-auto rounded-[2rem] shadow-xl relative overflow-hidden"
      style={{
        height: "min(70vh, 700px)",
        perspective: "1000px",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
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
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", ease: [0.25, 0.1, 0.25, 1] }}
      />

      {/* Glass overlay */}
      <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px]" />

      {/* Navigation buttons */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 z-20">
        <motion.div
          whileHover={{ scale: 1.1, x: -3 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={prevFeature}
            className="rounded-full bg-background/50 backdrop-blur-md border border-border/20 shadow-lg hover:bg-background/70"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20">
        <motion.div
          whileHover={{ scale: 1.1, x: 3 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={nextFeature}
            className="rounded-full bg-background/50 backdrop-blur-md border border-border/20 shadow-lg hover:bg-background/70"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>

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
              ease: [0.25, 0.1, 0.25, 1],
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
                ease: [0.25, 0.1, 0.25, 1],
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
                    ease: [0.25, 0.1, 0.25, 1],
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
                    ease: [0.25, 0.1, 0.25, 1],
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
                        ease: [0.25, 0.1, 0.25, 1],
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
              transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {features[currentFeature].title}
            </motion.h2>

            {/* Description with text animation */}
            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {features[currentFeature].description}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="absolute bottom-8 left-0 w-full px-6">
          <div className="w-full max-w-3xl mx-auto h-1 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full", `bg-gradient-to-r ${features[currentFeature].gradient}`)}
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.05 }}
            />
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-16 left-0 w-full flex justify-center space-x-3">
        {features.map((_, idx) => (
          <motion.button
            key={`dot-${idx}`}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-colors cursor-pointer",
              idx === currentFeature ? `bg-gradient-to-r ${features[idx].gradient}` : "bg-muted/70",
            )}
            whileHover={{ scale: 1.5 }}
            whileTap={{ scale: 0.9 }}
            animate={idx === currentFeature ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{
              scale: {
                duration: 1.5,
                repeat: idx === currentFeature ? Number.POSITIVE_INFINITY : 0,
                repeatType: "reverse",
                ease: [0.25, 0.1, 0.25, 1],
              },
            }}
            onClick={() => goToFeature(idx)}
            aria-label={`Go to feature ${idx + 1}`}
          />
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className={`absolute w-1.5 h-1.5 rounded-full ${features[currentFeature].color} opacity-30`}
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              x: [
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
              ],
              y: [
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
              ],
              opacity: [0.3, 0.6, 0.3],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 10 + Math.random() * 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default FeatureVideo
