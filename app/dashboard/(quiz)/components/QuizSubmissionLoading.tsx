"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Brain, CheckCircle2, Loader2 } from "lucide-react"

interface QuizSubmissionLoadingProps {
  quizType?: 'mcq' | 'code' | 'blanks' | 'openended' | 'flashcard' | 'fill-blanks'
  message?: string
  progress?: number
}

export const QuizSubmissionLoading: React.FC<QuizSubmissionLoadingProps> = ({ 
  quizType = 'mcq',
  message,
  progress
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
    if (message) return message
    
    switch(quizType) {
      case 'mcq':
        return "Submitting your multiple choice answers"
      case 'code':
        return "Processing your code solutions"
      case 'blanks':
      case 'fill-blanks':
        return "Checking your fill-in-the-blank answers"
      case 'openended':
        return "Submitting your written responses"
      case 'flashcard':
        return "Saving your flashcard progress"
      default:
        return "Submitting your quiz"
    }
  }

  const [progressState, setProgress] = useState(0)
  
  // Simulate progress for better UX
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return Math.min(prev + 5, 100)
      })
    }, 200)
    
    return () => clearInterval(interval)
  }, [])

  const getQuizTypeLabel = () => {
    switch (quizType) {
      case "mcq": return "Multiple Choice Quiz"
      case "blanks": return "Fill-in-the-Blanks Quiz"
      case "openended": return "Open-Ended Quiz"
      case "coding": return "Coding Challenge"
      default: return "Quiz"
    }
  }

  return (
    <div className="min-h-[500px] flex items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full px-4"
      >
        <Card className="border shadow-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4">
              <Brain className="h-12 w-12 text-primary mx-auto" />
            </div>
            <CardTitle className="text-xl font-bold">Processing Your Results</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              We're analyzing your {getQuizTypeLabel()} answers...
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-2">
              <Progress value={progressState} className="h-2" />
              <p className="text-xs text-right text-muted-foreground">{progressState}%</p>
            </div>
            
            <div className="space-y-3">
              <Step 
                icon={CheckCircle2} 
                label="Checking answers" 
                status={progressState > 30 ? "completed" : "loading"} 
              />
              <Step 
                icon={Brain} 
                label="Calculating performance" 
                status={progressState > 60 ? "completed" : progressState > 30 ? "loading" : "waiting"} 
              />
              <Step 
                icon={CheckCircle2} 
                label="Preparing your results" 
                status={progressState > 90 ? "completed" : progressState > 60 ? "loading" : "waiting"} 
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

interface StepProps {
  icon: React.ElementType
  label: string
  status: "waiting" | "loading" | "completed"
}

function Step({ icon: Icon, label, status }: StepProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`rounded-full p-2 ${
        status === "completed" ? "bg-green-100 text-green-600" : 
        status === "loading" ? "bg-blue-100 text-blue-600 animate-pulse" :
        "bg-muted text-muted-foreground"
      }`}>
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <span className={`text-sm ${
        status === "waiting" ? "text-muted-foreground" : "font-medium"
      }`}>
        {label}
      </span>
      {status === "completed" && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto"
        >
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </motion.div>
      )}
    </div>
  )
}