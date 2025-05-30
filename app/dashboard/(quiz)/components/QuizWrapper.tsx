"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface RenderQuestionProps {
  questionNumber: number
  totalQuestions: number
  isSubmitting: boolean
  existingAnswer?: any
  feedbackType?: "correct" | "incorrect" | null
  onAnswer: (...args: any[]) => void
}

interface QuizWrapperProps<T> {
  quizTitle: string
  questions: T[]
  currentQuestionIndex: number
  isSubmitting: boolean
  isQuizComplete: boolean
  onNext: () => void
  onFinish: () => void
  renderQuestion: (question: T, props: RenderQuestionProps) => React.ReactNode
  existingAnswer?: any
  feedbackType?: "correct" | "incorrect" | null
  timerSeconds?: number
  onTimerComplete?: () => void
}

export function QuizWrapper<T>({
  quizTitle,
  questions,
  currentQuestionIndex,
  isSubmitting,
  isQuizComplete,
  onNext,
  onFinish,
  renderQuestion,
  existingAnswer,
  feedbackType,
  timerSeconds = 600,
  onTimerComplete,
}: QuizWrapperProps<T>) {
  const totalQuestions = questions.length
  const question = questions[currentQuestionIndex]
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [remainingTime, setRemainingTime] = useState(timerSeconds)
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1

  // Handle timer countdown
  useEffect(() => {
    if (isQuizComplete) return

    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = Math.max(0, prev - 1)
        
        if (newTime === 0 && onTimerComplete) {
          onTimerComplete()
          if (timerRef.current) clearInterval(timerRef.current)
        }
        return newTime
      })
    }, 1000)
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isQuizComplete, onTimerComplete])

  // Reset timer when question changes
  useEffect(() => {
    setRemainingTime(timerSeconds)
  }, [currentQuestionIndex, timerSeconds])

  // Timer display values
  const minutes = Math.floor(remainingTime / 60)
  const seconds = remainingTime % 60

  if (!question) {
    return (
      <div className="max-w-2xl w-full mx-auto px-2 sm:px-0 py-12 text-center">
        <h2 className="text-xl font-bold mb-2">No Question Found</h2>
        <p className="text-muted-foreground">There are no questions to display.</p>
      </div>
    )
  }

  // Handle button action based on whether it's the last question
  const handleButtonClick = () => {
    // Make sure feedbackType is null before proceeding
    if (feedbackType !== null) {
      return;
    }
    
    if (isLastQuestion) {
      onFinish()
    } else {
      onNext()
    }
  }

  const buttonLabel = isLastQuestion ? "Submit Quiz" : "Next Question"

  // Determine if the button should be disabled
  const isButtonDisabled = 
    isSubmitting ||
    !existingAnswer ||
    feedbackType !== null ||
    isQuizComplete

  return (
    <div className="max-w-2xl w-full mx-auto px-2 sm:px-0">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between text-muted-foreground gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center flex-1 text-foreground">{quizTitle}</h1>
          <span className="text-right min-w-[110px] bg-muted/40 px-3 py-1 rounded-full">
            <span className="font-mono">
              {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
            </span>
          </span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground mt-2 mb-1">
          <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          <span>{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}% complete</span>
        </div>
        <div className="bg-muted/50 rounded-full h-2 mt-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={(question as any)?.id || currentQuestionIndex}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          {renderQuestion(question, {
            questionNumber: currentQuestionIndex + 1,
            totalQuestions,
            isSubmitting,
            existingAnswer,
            feedbackType,
            onAnswer: () => {}, // This will be handled by the specific quiz component
          })}
        </motion.div>
      </AnimatePresence>
      <div className="flex justify-end">
        <Button
          onClick={handleButtonClick}
          disabled={isButtonDisabled}
          className="min-w-[120px]"
          data-testid="next-question"
        >
          {buttonLabel}
        </Button>
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {currentQuestionIndex + 1} / {totalQuestions} questions viewed
        </p>
      </div>
    </div>
  )
}

export default QuizWrapper
