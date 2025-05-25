"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Timer, ChevronRight } from 'lucide-react'
import { cn } from "@/lib/utils"

interface McqQuizQuestion {
  id: string
  text: string
  type: "mcq"
  options: Array<{ id: string; text: string }> | string[]
  correctOptionId: string
}

interface McqQuizProps {
  question: McqQuizQuestion
  questionNumber: number
  totalQuestions: number
  onAnswer: (answer: string) => void
  isLastQuestion?: boolean
  isSubmitting?: boolean
  existingAnswer?: string
}

export default function McqQuiz({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  isLastQuestion = false,
  isSubmitting = false,
  existingAnswer,
}: McqQuizProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(existingAnswer || null)
  const [timer, setTimer] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [startTime] = useState(Date.now())

  // Memoized options for performance with better validation
  const options = useMemo(() => {
    if (!question?.options || !Array.isArray(question.options)) return []
    
    return question.options.map((option, index) => {
      if (typeof option === "string") {
        return { id: option, text: option }
      }
      if (option && typeof option === "object" && option.id && option.text) {
        return option
      }
      // Fallback for malformed options
      return { id: `option_${index}`, text: String(option) }
    })
  }, [question?.options])

  // Start timer when component mounts
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Reset selection when question changes
  useEffect(() => {
    setSelectedOption(existingAnswer || null)
    setTimer(0)
  }, [question?.id, existingAnswer])

  // Handle option selection with validation
  const handleOptionSelect = useCallback(
    (optionId: string) => {
      if (isSubmitting || isAnimating || !optionId) return
      setSelectedOption(optionId)
    },
    [isSubmitting, isAnimating],
  )

  // Handle answer submission with validation
  const handleSubmit = useCallback(() => {
    if (!selectedOption || isSubmitting || isAnimating || !question?.correctOptionId) return

    setIsAnimating(true)
    // Only pass selectedOption to onAnswer (Redux handles correctness)
    setTimeout(() => {
      onAnswer(selectedOption)
      setIsAnimating(false)
    }, 300)
  }, [selectedOption, isSubmitting, isAnimating, question?.correctOptionId, onAnswer])

  // Format timer display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  // Memoized button text for performance
  const buttonText = useMemo(() => {
    if (isSubmitting || isAnimating) {
      return isLastQuestion ? "Finishing..." : "Submitting..."
    }
    return isLastQuestion ? "Submit Quiz" : "Next Question"
  }, [isSubmitting, isAnimating, isLastQuestion])

  // Validate question data
  if (!question || !question.text || !options.length) {
    return (
      <Card className="w-full shadow-md border border-border/60">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Question data is not available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-md border border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            Question {questionNumber}
            <ChevronRight className="h-4 w-4" />
            {totalQuestions}
          </span>

          <span className="bg-muted/50 text-muted-foreground px-3 py-1 rounded-full text-xs font-mono flex items-center">
            <Timer className="h-3.5 w-3.5 mr-1" />
            {formatTime(timer)}
          </span>
        </div>

        <h2 className="text-xl font-semibold leading-relaxed">{question.text}</h2>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="space-y-3">
          {options.map((option, index) => (
            <motion.button
              key={option.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOptionSelect(option.id)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 text-sm flex items-start hover:shadow-sm",
                selectedOption === option.id
                  ? "border-primary bg-primary/10 text-primary font-medium shadow-sm"
                  : "border-border/60 hover:border-border hover:bg-muted/30",
                (isAnimating || isSubmitting) && "pointer-events-none opacity-75",
              )}
              disabled={isSubmitting || isAnimating}
            >
              <div className="flex items-start gap-3 w-full">
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border text-xs font-medium mt-0.5 flex-shrink-0",
                    selectedOption === option.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-background",
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="leading-relaxed">{option.text}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Button
          className="ml-auto min-w-[120px]"
          disabled={!selectedOption || isSubmitting || isAnimating}
          onClick={handleSubmit}
        >
          {(isSubmitting || isAnimating) && (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          <span>{buttonText}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}