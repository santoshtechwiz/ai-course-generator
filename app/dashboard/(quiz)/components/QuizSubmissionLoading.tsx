"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Loader, CheckCircle, Brain, Trophy, Zap } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface QuizSubmissionLoadingProps {
  quizType: "mcq" | "code" | "openended" | "blanks"
  message?: string
  onComplete?: () => void
}

export function QuizSubmissionLoading({ quizType, message, onComplete }: QuizSubmissionLoadingProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState(message || "Processing your submission...")

  const steps = [
    { icon: Brain, message: "Analyzing your answers...", duration: 800 },
    { icon: Zap, message: "Calculating your score...", duration: 600 },
    { icon: Trophy, message: "Preparing your results...", duration: 400 },
    { icon: CheckCircle, message: "Almost ready!", duration: 200 },
  ]

  const quizTypeNames = {
    mcq: "Multiple Choice Quiz",
    code: "Coding Challenge",
    openended: "Open Ended Quiz",
    blanks: "Fill in the Blanks Quiz",
  }

  useEffect(() => {
    let progressTimer: NodeJS.Timeout
    let stepTimer: NodeJS.Timeout

    const runSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i)
        setLoadingMessage(steps[i].message)

        // Animate progress for this step
        const stepProgress = ((i + 1) / steps.length) * 100
        progressTimer = setTimeout(() => {
          setProgress(stepProgress)
        }, 100)

        // Wait for step duration
        await new Promise((resolve) => {
          stepTimer = setTimeout(resolve, steps[i].duration)
        })
      }

      // Complete
      setTimeout(() => {
        onComplete?.()
      }, 300)
    }

    runSteps()

    return () => {
      clearTimeout(progressTimer)
      clearTimeout(stepTimer)
    }
  }, [onComplete])

  const CurrentIcon = steps[currentStep]?.icon || Brain

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto"
      >
        {/* Animated Icon */}
        <motion.div
          key={currentStep}
          initial={{ scale: 0.5, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="mb-8 relative"
        >
          <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center relative overflow-hidden">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-full"
            />
            <CurrentIcon className="w-12 h-12 text-primary z-10" />
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2 mb-3" />
          <motion.p
            key={loadingMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-medium text-foreground"
          >
            {loadingMessage}
          </motion.p>
        </div>

        {/* Quiz Type Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary"
        >
          <Loader className="w-4 h-4 animate-spin" />
          {quizTypeNames[quizType]}
        </motion.div>

        {/* Animated Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center gap-1 mt-6"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.2,
              }}
              className="w-2 h-2 bg-primary rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
