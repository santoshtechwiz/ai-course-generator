"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"

interface QuizSubmissionLoadingProps {
  quizType: string
}

export function QuizSubmissionLoading({ quizType }: QuizSubmissionLoadingProps) {
  const [progress, setProgress] = useState(10)
  const [message, setMessage] = useState("Processing your answers...")
  
  useEffect(() => {
    // Simulate progress for better UX
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + 5
      })
    }, 300)

    // Update messages for a more engaging loading experience
    const messages = [
      "Processing your answers...",
      "Calculating your score...",
      "Generating feedback...",
      "Almost done...",
      "Finalizing results..."
    ]
    
    let messageIndex = 0
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length
      setMessage(messages[messageIndex])
      
      if (messageIndex === messages.length - 1) {
        clearInterval(messageInterval)
      }
    }, 2000)

    return () => {
      clearInterval(interval)
      clearInterval(messageInterval)
    }
  }, [])

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2 text-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="flex justify-center"
            >
              <div className="relative w-24 h-24 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{progress}%</span>
                </div>
              </div>
            </motion.div>
            
            <h3 className="text-xl font-bold">Finalizing Your {quizType.charAt(0).toUpperCase() + quizType.slice(1)} Quiz</h3>
            <p className="text-muted-foreground" data-testid="submission-progress">{message}</p>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <p className="text-xs text-center text-muted-foreground">Please wait while we process your quiz results...</p>
        </CardContent>
      </Card>
    </div>
  )
}
