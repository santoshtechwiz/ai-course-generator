"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Timer, ChevronRight } from "lucide-react"
import { cn } from "@/lib/tailwindUtils"

interface McqQuizProps {
  question: {
    id: string | number
    question: string
    options: string[]
    correctAnswer?: string
    answer?: string
    type: "mcq"
  }
  questionNumber: number
  totalQuestions: number
  onAnswer: (answer: string, elapsedTime: number, isCorrect: boolean) => void
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
  const correctAnswer = question.correctAnswer || question.answer || ""

  // Start the timer when the component mounts
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Reset selection when question changes
  useEffect(() => {
    setSelectedOption(existingAnswer || null)
  }, [question.id, existingAnswer])

  const handleOptionSelect = (option: string) => {
    // Don't allow changes if already submitted
    if (isSubmitting) return

    setSelectedOption(option)
  }

  const handleSubmit = () => {
    if (!selectedOption || isSubmitting) return

    setIsAnimating(true)
    const isCorrect = selectedOption === correctAnswer

    // Submit answer after animation
    setTimeout(() => {
      onAnswer(selectedOption, timer, isCorrect)
      setIsAnimating(false)
    }, 500)
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
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

        <h2 className="text-xl font-semibold">{question.question}</h2>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="space-y-3">
          {question.options?.map((option, index) => (
            <motion.button
              key={index}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOptionSelect(option)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-md border transition-all text-md flex items-start",
                selectedOption === option
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border/60 hover:border-border",
                isAnimating && "pointer-events-none",
              )}
              disabled={isSubmitting}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border text-xs font-medium",
                    selectedOption === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-background",
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </div>
                <span>{option}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Button
          className="ml-auto"
          disabled={!selectedOption || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>{isLastQuestion ? "Finishing..." : "Submitting..."}</span>
            </>
          ) : (
            <span>{isLastQuestion ? "Submit Quiz" : "Next Question"}</span>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
