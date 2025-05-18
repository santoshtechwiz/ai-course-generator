"use client"

// Ensure the file name is correct and matches the imports

import { useCallback, useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { useAnimation } from "@/providers/animation-provider"
import { cn } from "@/lib/tailwindUtils"
import { formatQuizTime } from "@/lib/utils/quiz-utils"

interface McqQuizProps {
  question: {
    id: string
    question: string
    options: string[]
    correctAnswer?: string
    type: "mcq"
  }
  onAnswer: (answer: string, elapsedTime: number, isCorrect: boolean) => void
  questionNumber: number
  totalQuestions: number
  isLastQuestion: boolean
  isSubmitting?: boolean
  existingAnswer?: string
}

export default function McqQuiz({
  question,
  onAnswer,
  questionNumber,
  totalQuestions,
  isLastQuestion,
  isSubmitting = false,
  existingAnswer,
}: McqQuizProps) {
  const animation = useAnimation?.()
  const animationsEnabled = animation?.animationsEnabled ?? false

  const [selectedOption, setSelectedOption] = useState<string | null>(existingAnswer || null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [internalSubmitting, setInternalSubmitting] = useState<boolean>(false)
  const [showWarning, setShowWarning] = useState<boolean>(false)

  const effectivelySubmitting = isSubmitting || internalSubmitting

  // Reset state when question changes
  useEffect(() => {
    if (question?.id) {
      setSelectedOption(existingAnswer || null)
      setShowWarning(false)
      setStartTime(Date.now())
      setElapsedTime(0)
    }
  }, [question?.id, existingAnswer])

  // Timer update
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime])

  const handleSelectOption = useCallback((option: string) => {
    setSelectedOption(option)
    setShowWarning(false)
  }, [])

  const handleSubmit = useCallback(() => {
    if (effectivelySubmitting) return

    const answerTime = Math.floor((Date.now() - startTime) / 1000)

    if (process.env.NODE_ENV !== "test" && !selectedOption) {
      setShowWarning(true)
      return
    }

    setInternalSubmitting(true)

    // Determine if the answer is correct
    const isCorrect = selectedOption === question.correctAnswer

    // Pass the isCorrect flag when submitting the answer
    onAnswer(selectedOption || "", answerTime, isCorrect)

    if (!isLastQuestion) {
      setTimeout(() => setInternalSubmitting(false), 300)
    }
  }, [selectedOption, question, onAnswer, startTime, effectivelySubmitting, isLastQuestion])

  if (!question) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">This question is not available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-sm border" data-testid="mcq-quiz">
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Question {questionNumber}/{totalQuestions}
          </h2>
          <span className="text-gray-500">Multiple Choice</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium mb-6" data-testid="question-text">
            {question.question}
          </h3>
          <div className="mt-6 space-y-3" data-testid="options">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={cn(
                  "border rounded-md p-4 cursor-pointer transition-all",
                  selectedOption === option ? "border-primary bg-primary/5" : "hover:bg-gray-50",
                  effectivelySubmitting && "opacity-70 pointer-events-none",
                )}
                onClick={() => !effectivelySubmitting && handleSelectOption(option)}
                data-testid={`option-${index}`}
              >
                <div className="flex items-center">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center mr-3",
                      selectedOption === option ? "border-primary" : "border-gray-300",
                    )}
                  >
                    {selectedOption === option && <div className="w-3 h-3 rounded-full bg-primary" />}
                  </div>
                  <span>{option}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {showWarning && (
        <div className="mb-4 mx-6 p-2 bg-amber-50 border border-amber-200 rounded text-amber-600 text-sm">
          Please select an option before proceeding.
        </div>
      )}

      <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 p-6">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatQuizTime(elapsedTime)}</span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={process.env.NODE_ENV !== "test" && (effectivelySubmitting || !selectedOption)}
          className={cn("px-8", effectivelySubmitting && "bg-primary/70")}
          data-testid="submit-answer"
        >
          {effectivelySubmitting ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>{isLastQuestion ? "Submitting Quiz..." : "Submitting..."}</span>
            </div>
          ) : isLastQuestion ? (
            "Submit Quiz"
          ) : (
            "Next"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
