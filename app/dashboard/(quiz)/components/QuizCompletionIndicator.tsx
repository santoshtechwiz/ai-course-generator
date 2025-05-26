"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, RefreshCw, Home, Trophy, Sparkles, TrendingUp } from 'lucide-react'
import { useRouter } from "next/navigation"

interface QuizCompletionIndicatorProps {
  score: number
  maxScore: number
  onViewResults: () => void
  onRetry?: () => void
  isSubmitting?: boolean
  error?: string | null
}

export const QuizCompletionIndicator: React.FC<QuizCompletionIndicatorProps> = ({
  score,
  maxScore,
  onViewResults,
  onRetry,
  isSubmitting = false,
  error = null
}) => {
  const [showAnimation, setShowAnimation] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const percentage = Math.round((score / maxScore) * 100)
  const router = useRouter()
  
  // Trigger animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(true)
      if (percentage >= 80) {
        setShowConfetti(true)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [percentage])

  // Get performance level and styling
  const getPerformanceData = () => {
    if (percentage >= 90) return {
      level: "Outstanding",
      color: "text-green-600",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
      borderColor: "border-green-200 dark:border-green-800",
      icon: Trophy,
      message: "Exceptional performance! You've mastered this topic."
    }
    if (percentage >= 80) return {
      level: "Excellent",
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      icon: TrendingUp,
      message: "Great job! You have a strong understanding."
    }
    if (percentage >= 70) return {
      level: "Good",
      color: "text-yellow-600",
      bgColor: "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      icon: CheckCircle,
      message: "Well done! You're on the right track."
    }
    if (percentage >= 50) return {
      level: "Fair",
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20",
      borderColor: "border-orange-200 dark:border-orange-800",
      icon: RefreshCw,
      message: "Good effort! Consider reviewing the material."
    }
    return {
      level: "Needs Improvement",
      color: "text-red-600",
      bgColor: "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20",
      borderColor: "border-red-200 dark:border-red-800",
      icon: RefreshCw,
      message: "Keep practicing! Review the material and try again."
    }
  }

  const performanceData = getPerformanceData()
  const PerformanceIcon = performanceData.icon
  
  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
        className="w-full max-w-lg mx-auto"
      >
        <Card className="border-destructive/20 shadow-xl bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.5 }}
              className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center"
            >
              <AlertCircle className="h-8 w-8 text-destructive" />
            </motion.div>
            <CardTitle className="text-xl text-destructive">Submission Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-foreground font-medium mb-2">{error}</p>
              <p className="text-sm text-muted-foreground mb-4">
                Your answers are saved locally. You can try submitting again.
              </p>
            </motion.div>
          </CardContent>
          <CardFooter className="flex justify-center gap-3 pt-4">
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="outline" 
                className="flex items-center gap-2 hover:bg-destructive/5"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            <Button 
              onClick={() => router.push("/dashboard")} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }
  
  // Loading state
  if (isSubmitting) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-lg mx-auto"
      >
        <Card className="border-primary/20 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Submitting Quiz...</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <motion.div
              className="relative mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full" />
              <motion.div
                className="absolute inset-2 border-2 border-primary/40 border-b-transparent rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center space-y-2"
            >
              <p className="font-medium text-foreground">
                Finalizing your results
              </p>
              <p className="text-sm text-muted-foreground">
                Please wait while we process your submission.
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }
  
  // Success state
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="w-full max-w-lg mx-auto relative"
    >
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                initial={{
                  x: "50%",
                  y: "50%",
                  scale: 0,
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Card className={`shadow-xl ${performanceData.bgColor} ${performanceData.borderColor} border-2`}>
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.5 }}
            className="relative mx-auto mb-4"
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${performanceData.bgColor} border-4 ${performanceData.borderColor}`}>
              <PerformanceIcon className={`h-10 w-10 ${performanceData.color}`} />
            </div>
            
            {percentage >= 90 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, type: "spring" }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </motion.div>
            )}
          </motion.div>
          
          <CardTitle className="text-2xl font-bold">Quiz Completed!</CardTitle>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${performanceData.bgColor} ${performanceData.borderColor} border`}
          >
            <span className={performanceData.color}>{performanceData.level}</span>
          </motion.div>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <AnimatePresence>
            {showAnimation && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 30,
                  delay: 0.8
                }}
                className="space-y-4"
              >
                {/* Score Display */}
                <div className="relative">
                  <div className={`text-5xl font-bold ${performanceData.color} mb-2`}>
                    {percentage}%
                  </div>
                  <div className="text-lg text-foreground font-medium">
                    {score} out of {maxScore} points
                  </div>
                  
                  {/* Animated Progress Ring */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                  >
                    <div className={`w-32 h-32 rounded-full border-4 ${performanceData.borderColor}`} />
                  </motion.div>
                </div>
                
                {/* Performance Message */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="text-muted-foreground max-w-sm mx-auto leading-relaxed"
                >
                  {performanceData.message}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        
        <CardFooter className="pt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="w-full"
          >
            <Button 
              onClick={onViewResults} 
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 transition-all duration-200"
              size="lg"
            >
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2"
              >
                View Detailed Results
                <TrendingUp className="h-4 w-4" />
              </motion.span>
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}