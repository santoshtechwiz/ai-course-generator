"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"

interface QuizSubmissionLoadingProps {
  quizType: 'mcq' | 'code' | 'blanks' | 'openended' | 'flashcard'
  message?: string
}

export const QuizSubmissionLoading: React.FC<QuizSubmissionLoadingProps> = ({ 
  quizType,
  message 
}) => {
  const [dots, setDots] = useState('.')
  
  // Update dots animation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '.')
    }, 500)
    
    return () => clearInterval(interval)
  }, [])
  
  // Get appropriate message based on quiz type
  const getSubmissionMessage = () => {
    switch(quizType) {
      case 'mcq':
        return "Submitting your multiple choice answers"
      case 'code':
        return "Processing your code solutions"
      case 'blanks':
        return "Checking your fill-in-the-blank answers"
      case 'openended':
        return "Submitting your written responses"
      case 'flashcard':
        return "Saving your flashcard progress"
      default:
        return "Submitting your quiz"
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl text-center">
            Submitting Quiz{dots}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <div className="relative mb-6">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-primary"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0 }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                ease: "easeOut" 
              }}
            />
          </div>
          <p className="text-center mb-2">
            {message || getSubmissionMessage()}
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Please don't close this page. This may take a moment.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            Your answers are being processed and saved.
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
