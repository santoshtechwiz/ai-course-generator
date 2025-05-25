"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
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
  const percentage = Math.round((score / maxScore) * 100)
  const router = useRouter()
  
  // Trigger animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(true)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-xl text-center text-destructive">Submission Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-destructive/10 rounded-full p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <p className="mb-4">{error}</p>
            <p className="text-sm text-muted-foreground mb-4">
              Your answers are saved locally. You can try submitting again.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-3">
            {onRetry && (
              <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              Return to Dashboard
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-center">Submitting Quiz...</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative mb-6">
              <RefreshCw className="h-12 w-12 text-primary animate-spin" />
            </div>
            <p className="text-center mb-2">
              Finalizing your results
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we process your submission.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }
  
  // Success state
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl text-center">Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <AnimatePresence>
            {showAnimation && (
              <motion.div 
                className="relative mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 30,
                  delay: 0.2
                }}
              >
                <div className="bg-primary/10 rounded-full p-4">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ 
                    repeat: 1, 
                    duration: 1,
                    delay: 0.4,
                    ease: "easeOut" 
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-2xl font-bold text-center mb-2">
              {percentage}%
            </p>
            <p className="text-center mb-4">
              You scored {score} out of {maxScore} points
            </p>
          </motion.div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={onViewResults} 
            className="w-full"
            size="lg"
          >
            View Detailed Results
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
