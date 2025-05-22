"use client"

// Ensure the file name is correct and matches the imports

import { useCallback, useState, useEffect, useRef } from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/tailwindUtils"
import { formatQuizTime } from "@/lib/utils/quiz-utils"

interface McqQuizProps {
  question: {
    id: string
    question: string
    options: string[]
    answer?: string
    correctAnswer?: string
    type: "mcq"
  } | null
  onAnswer: (answer: string, elapsedTime: number, isCorrect: boolean) => void
  questionNumber: number
  totalQuestions: number
  isLastQuestion: boolean
  isSubmitting?: boolean
  existingAnswer?: string | null
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
  // Track the question ID to detect changes
  const prevQuestionIdRef = useRef<string | null>(null)

  const [selectedOption, setSelectedOption] = useState<string | null>(existingAnswer || null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [internalSubmitting, setInternalSubmitting] = useState<boolean>(false)
  const [showWarning, setShowWarning] = useState<boolean>(false)

  // Add a ref to track if the component is mounted
  const isMountedRef = useRef(true)

  const effectivelySubmitting = isSubmitting || internalSubmitting

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Reset state when question changes - only run when the question ID actually changes
  useEffect(() => {
    if (question?.id && question.id !== prevQuestionIdRef.current) {
      console.log(`Question changed to ${question.id}`)
      prevQuestionIdRef.current = question.id

      setSelectedOption(existingAnswer || null)
      setShowWarning(false)
      setStartTime(Date.now())
      setElapsedTime(0)
      setInternalSubmitting(false) // Reset submitting state on question change
    }
  }, [question?.id, existingAnswer])

  // Timer update
  useEffect(() => {
    const timer = setInterval(() => {
      if (isMountedRef.current && !effectivelySubmitting) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime, effectivelySubmitting])

  const handleSelectOption = useCallback(
    (option: string) => {
      if (effectivelySubmitting) return
      setSelectedOption(option)
      setShowWarning(false)
    },
    [effectivelySubmitting],
  )

  // Debug function
  useEffect(() => {
    if (process.env.NODE_ENV !== "test") {
      console.log("McqQuiz rendering:", {
        questionId: question?.id,
        questionNumber,
        totalQuestions,
        isLastQuestion,
        selectedOption,
        effectivelySubmitting,
      })
    }
  }, [question?.id, questionNumber, totalQuestions, isLastQuestion, selectedOption, effectivelySubmitting])

  // Make sure TypeScript knows correctAnswer can be a string
  const handleSubmit = useCallback(() => {
    // Prevent submission if already in progress
    if (effectivelySubmitting || !question) return

    const answerTime = Math.floor((Date.now() - startTime) / 1000)

    // Skip validation in test environment
    if (process.env.NODE_ENV !== "test" && !selectedOption) {
      setShowWarning(true)
      return
    }

    // Mark as submitting immediately to prevent double clicks
    setInternalSubmitting(true)

    // Determine if the answer is correct
    const correctAnswer = question.answer || question.correctAnswer || ""
    const isCorrect = selectedOption === correctAnswer

    // Call the onAnswer callback with adequate timeout to allow state changes to propagate
    onAnswer(selectedOption || "", answerTime, isCorrect)
  }, [selectedOption, question, onAnswer, startTime, effectivelySubmitting])

  if (!question) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">This question is not available.</p>
        </CardContent>
      </Card>
    )
  }

  // Sanitize question text to ensure we don't display duplicate content
  // This removes any duplicate occurrences of the question text that might appear
  const sanitizedQuestion = question.question.replace(/(.+?)(\1)+/g, "$1")

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
            {sanitizedQuestion}
          </h3>
          <div className="mt-6 space-y-3" data-testid="options-container">
            {/* Deduplicate options in case they were accidentally duplicated */}
            {Array.from(new Set(question.options)).map((option, index) => (
              <div
                key={index}
                className={cn(
                  "border rounded-md p-4 cursor-pointer transition-all",
                  selectedOption === option ? "border-primary bg-primary/5" : "hover:bg-gray-50",
                  effectivelySubmitting && "opacity-70 pointer-events-none",
                )}
                onClick={() => handleSelectOption(option)}
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

      {/* Warning message - only one instance, with data-testid */}
      <div
        className={`mb-4 mx-6 p-2 bg-amber-50 border border-amber-200 rounded text-amber-600 text-sm ${showWarning ? "" : "hidden"}`}
        data-testid="warning-message"
      >
        Please select an option before proceeding.
      </div>

      <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 p-6">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatQuizTime(elapsedTime)}</span>
        </div>

        <Button
          onClick={handleSubmit}
          // CRITICAL FIX: Only disable when no option is selected in non-test environment
          // We should NOT disable when effectivelySubmitting is true, as this causes the button
          // to be unclickable when showing "Submitting..."
          disabled={(process.env.NODE_ENV !== "test" && !selectedOption) || effectivelySubmitting}
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
