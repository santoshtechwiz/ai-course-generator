"use client"

import { useCallback, useMemo, useState, useEffect, useRef } from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"

import { cn } from "@/lib/utils"
import { formatQuizTime } from "@/lib/utils/quiz-utils"
import type { CodeQuestion } from "./types"
import CodeQuizEditor from "./CodeQuizEditor"
import CodeQuizOptions from "./CodeQuizOptions"

interface CodingQuizProps {
  slug: string // Use slug as the primary identifier
  question: Readonly<CodeQuestion>
  onAnswer: (answer: string, timeSpent: number, isCorrect: boolean) => void
  questionNumber: number
  totalQuestions: number
  isLastQuestion: boolean
  isSubmitting: boolean
  existingAnswer?: string
  feedbackType?: "correct" | "incorrect" | null
}

const TIMER_INTERVAL_MS = 1000

export default function CodingQuizComponent({
  slug,
  question,
  onAnswer,
  questionNumber,
  totalQuestions,
  isLastQuestion,
  isSubmitting,
  existingAnswer,
  feedbackType,
}: CodingQuizProps) {
  const prevQuestionIdRef = useRef<string | null>(null)
  const isMountedRef = useRef(true)

  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [userCode, setUserCode] = useState<string>("")
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [internalSubmitting, setInternalSubmitting] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<string>("")
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const effectivelySubmitting = useMemo(
    () => isSubmitting || internalSubmitting || hasSubmitted || feedbackType !== null,
    [isSubmitting, internalSubmitting, hasSubmitted, feedbackType],
  )

  const isMultipleChoice = useMemo(
    () => Array.isArray(question.options) && question.options.length > 0,
    [question.options],
  )

  const options = useMemo(() => question.options || [], [question.options])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Update this effect to reset state when question changes
  useEffect(() => {
    const questionId = question.id.toString()
    if (questionId !== prevQuestionIdRef.current) {
      prevQuestionIdRef.current = questionId

      // Reset state for the new question
      setSelectedOption(existingAnswer && options.includes(existingAnswer) ? existingAnswer : null)
      setUserCode(existingAnswer || question.codeSnippet || "")
      setStartTime(Date.now())
      setElapsedTime(0)
      setInternalSubmitting(false)
      setHasSubmitted(false)
      setValidationError("")
    }
  }, [question.id, question.codeSnippet, existingAnswer, options])

  // Elapsed time interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (!effectivelySubmitting && isMountedRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }
    }, TIMER_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [startTime, effectivelySubmitting])

  const handleSelectOption = useCallback(
    (option: string) => {
      if (!effectivelySubmitting) {
        setSelectedOption(option)
        setValidationError("")
      }
    },
    [effectivelySubmitting],
  )

  const handleCodeChange = useCallback(
    (code: string | undefined) => {
      if (code !== undefined && !effectivelySubmitting) {
        setUserCode(code)
        setValidationError("")
      }
    },
    [effectivelySubmitting],
  )

  const validateAnswer = useCallback((): boolean => {
    if (isMultipleChoice && !selectedOption) {
      setValidationError("Please select an option before proceeding.")
      return false
    }
    if (!isMultipleChoice && !userCode.trim()) {
      setValidationError("Please write your code answer before submitting.")
      return false
    }
    return true
  }, [isMultipleChoice, selectedOption, userCode])

  const handleSubmit = useCallback(() => {
    if (effectivelySubmitting || !isMountedRef.current) return
    if (!validateAnswer()) return

    const answerTime = Math.floor((Date.now() - startTime) / 1000)

    if (process.env.NODE_ENV !== "test" && answerTime < 1) {
      setValidationError("Please take time to think about your answer.")
      return
    }

    setInternalSubmitting(true)
    setHasSubmitted(true)

    const answer = isMultipleChoice ? selectedOption! : userCode
    const correctAnswer = (question.answer || question.correctAnswer || "").trim().toLowerCase()
    const submittedAnswer = answer.trim().toLowerCase()

    let isCorrect = false
    if (correctAnswer) {
      isCorrect = isMultipleChoice
        ? submittedAnswer === correctAnswer
        : submittedAnswer.includes(correctAnswer) || correctAnswer.includes(submittedAnswer)
    } else {
      isCorrect = submittedAnswer.length > 0
    }

    // Submit answer immediately
    onAnswer(answer, answerTime, isCorrect)

    // Reset internal submitting state after a short delay
    setTimeout(() => {
      if (isMountedRef.current) {
        setInternalSubmitting(false)
      }
    }, 300)
  }, [effectivelySubmitting, validateAnswer, startTime, isMultipleChoice, selectedOption, userCode, question, onAnswer])

  if (!question?.question && !question?.text) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">This question is not available.</p>
        </CardContent>
      </Card>
    )
  }

  const questionText = question.question || question.text || ""

  const getFeedbackStyles = () => {
    if (!feedbackType) return {}
    return {
      borderColor: feedbackType === "correct" ? "green" : "red",
      borderWidth: "2px",
      boxShadow: `0 0 0 2px ${feedbackType === "correct" ? "rgba(0, 128, 0, 0.2)" : "rgba(255, 0, 0, 0.2)"}`,
    }
  }

  return (
    <Card
      className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-sm border"
      data-testid="coding-quiz"
      style={getFeedbackStyles()}
    >
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-center" data-testid="question-progress">
          <h2 className="text-xl font-semibold">
            Question {questionNumber}/{totalQuestions}
          </h2>
          <span className="text-gray-500">{isMultipleChoice ? "Multiple Choice" : "Code Challenge"}</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-medium mb-6">{questionText}</h3>

          {question.codeSnippet && (
            <SyntaxHighlighter
              language={question.language || "javascript"}
              style={vscDarkPlus}
              className="rounded-md mb-4"
            >
              {question.codeSnippet}
            </SyntaxHighlighter>
          )}

          {isMultipleChoice ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium mb-3">Select the correct option:</h3>
              <CodeQuizOptions
                options={options}
                selectedOption={selectedOption || undefined}
                onSelect={handleSelectOption}
                disabled={effectivelySubmitting}
              />
            </div>
          ) : (
            <div className="my-4">
              <h3 className="text-sm font-medium mb-3">Write your code:</h3>
              <CodeQuizEditor
                value={userCode}
                language={question.language || "javascript"}
                onChange={handleCodeChange}
                height="200px"
                disabled={effectivelySubmitting}
                placeholder="// Write your code here..."
              />
            </div>
          )}
        </div>
      </CardContent>

      {validationError && (
        <div className="mb-4 mx-6 p-3 bg-amber-50 border border-amber-200 rounded text-amber-700 text-sm">
          {validationError}
        </div>
      )}

      {feedbackType && (
        <div
          className={cn(
            "mb-4 mx-6 p-3 rounded text-sm",
            feedbackType === "correct"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700",
          )}
        >
          {feedbackType === "correct" ? "Correct! Well done." : "Incorrect. Please review your answer."}
        </div>
      )}

      <CardFooter className="flex justify-end items-center gap-4 border-t pt-6 p-6">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mr-auto">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatQuizTime(elapsedTime)}</span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={effectivelySubmitting || (isMultipleChoice ? !selectedOption : !userCode)}
          className={cn("px-8", effectivelySubmitting && "bg-primary/70")}
          data-testid="submit-answer"
          aria-label={effectivelySubmitting ? "Processing..." : "Submit Answer"}
        >
          {effectivelySubmitting ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            // Always use "Submit Answer" instead of "Next" or "Finish Quiz"
            "Submit Answer"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
