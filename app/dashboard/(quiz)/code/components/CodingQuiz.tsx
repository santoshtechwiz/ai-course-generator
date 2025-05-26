"use client"

import { useCallback, useMemo, useState, useEffect, memo, useRef } from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"
import CodeQuizEditor from "./CodeQuizEditor"
import { cn } from "@/lib/utils"
import { formatQuizTime } from "@/lib/utils/quiz-utils"

interface CodeQuizQuestion {
  id: string | number
  question: string
  text?: string
  codeSnippet?: string
  options?: string[]
  answer?: string
  correctAnswer?: string
  language?: string
  type?: string
}

interface CodingQuizProps {
  question: CodeQuizQuestion
  onAnswer: (answer: string, timeSpent: number, isCorrect: boolean) => void
  questionNumber: number
  totalQuestions: number
  isLastQuestion: boolean
  isSubmitting: boolean
  existingAnswer?: string
}

function CodingQuizComponent({
  question,
  onAnswer,
  questionNumber,
  totalQuestions,
  isLastQuestion,
  isSubmitting = false,
  existingAnswer,
}: CodingQuizProps) {
  // Track the question ID to detect changes
  const prevQuestionIdRef = useRef<string | null>(null)
  const isMountedRef = useRef(true)

  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [userCode, setUserCode] = useState<string>("")
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [internalSubmitting, setInternalSubmitting] = useState<boolean>(false)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [validationError, setValidationError] = useState<string>("")
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Combined submitting state
  const effectivelySubmitting = isSubmitting || internalSubmitting || isAnimating || hasSubmitted

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Initialize state when question changes
  useEffect(() => {
    if (question?.id && question.id !== prevQuestionIdRef.current) {
      console.log(`Question changed to ${question.id}`)
      prevQuestionIdRef.current = question.id.toString()

      // Reset all state for new question
      setUserCode(existingAnswer || question.codeSnippet || "")
      setSelectedOption(existingAnswer && question.options?.includes(existingAnswer) ? existingAnswer : null)
      setValidationError("")
      setStartTime(Date.now())
      setElapsedTime(0)
      setInternalSubmitting(false)
      setIsAnimating(false)
      setHasSubmitted(false) // Reset submission state for new question
    }
  }, [question?.id, question?.codeSnippet, question?.options, existingAnswer])

  // Track elapsed time
  useEffect(() => {
    let mounted = true
    const timer = setInterval(() => {
      if (mounted && !effectivelySubmitting) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }
    }, 1000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [startTime, effectivelySubmitting])

  // Determine if this is a multiple choice question
  const isMultipleChoice = useMemo(() => {
    return question?.options && Array.isArray(question.options) && question.options.length > 0
  }, [question?.options])

  // Memoized options
  const options = useMemo(() => question?.options || [], [question?.options])

  // Handler functions
  const handleSelectOption = useCallback(
    (option: string) => {
      if (effectivelySubmitting) return
      setSelectedOption(option)
      setValidationError("")
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

  const validateAnswer = useCallback(() => {
    if (isMultipleChoice) {
      if (!selectedOption) {
        setValidationError("Please select an option before proceeding.")
        return false
      }
    } else {
      if (!userCode.trim()) {
        setValidationError("Please write your code answer before submitting.")
        return false
      }
    }
    return true
  }, [isMultipleChoice, selectedOption, userCode])

  // Handle submission with MCQ-style approach
  const handleSubmit = useCallback(() => {
    if (effectivelySubmitting || !isMountedRef.current) return

    // Validate answer
    if (!validateAnswer()) {
      return
    }

    const answerTime = Math.floor((Date.now() - startTime) / 1000)

    // Prevent too fast submissions (except in test environment)
    if (process.env.NODE_ENV !== "test" && answerTime < 1) {
      setValidationError("Please take time to read the question carefully.")
      return
    }

    // Set submission state immediately to prevent double clicks
    setHasSubmitted(true)
    setIsAnimating(true)
    setInternalSubmitting(true)

    // Determine answer and correctness
    const answer = isMultipleChoice ? selectedOption || "" : userCode
    let isCorrect = false

    if (question.answer || question.correctAnswer) {
      const correctAnswer = question.answer || question.correctAnswer || ""

      if (isMultipleChoice) {
        // Multiple choice matching
        isCorrect = selectedOption === correctAnswer
      } else {
        // Code answer matching - more flexible matching
        const normalizeCode = (code: string) => code.trim().replace(/\s+/g, " ").toLowerCase()

        const userCodeNormalized = normalizeCode(userCode)
        const correctCodeNormalized = normalizeCode(correctAnswer)

        isCorrect =
          userCodeNormalized.includes(correctCodeNormalized) ||
          correctCodeNormalized.includes(userCodeNormalized) ||
          userCodeNormalized === correctCodeNormalized
      }
    } else {
      // If no correct answer is provided, assume it's correct (for open-ended questions)
      isCorrect = true
    }

    console.log("Submitting answer:", { answer, answerTime, isCorrect })

    // Just save the answer without navigation - parent component handles navigation
    setTimeout(() => {
      onAnswer(answer, answerTime, isCorrect)

      // Reset animation state after a brief delay
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsAnimating(false)
          setInternalSubmitting(false)
        }
      }, 300)
    }, 300)
  }, [effectivelySubmitting, validateAnswer, startTime, isMultipleChoice, selectedOption, userCode, question, onAnswer])

  // Validate question data
  if (!question || !(question.question || question.text)) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">This question is not available.</p>
        </CardContent>
      </Card>
    )
  }

  const questionText = question.question || question.text || ""

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-sm border" data-testid="coding-quiz">
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Question {questionNumber}/{totalQuestions}
          </h2>
          <span className="text-gray-500">{isMultipleChoice ? "Multiple Choice" : "Code Challenge"}</span>
        </div>
        {/* Progress bar */}
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            {/* Question text */}
            <h3 className="text-lg font-medium mb-6">{questionText}</h3>

            {/* Code snippet if provided */}
            {question.codeSnippet && (
              <div className="mb-4">
                <SyntaxHighlighter
                  language={question.language || "javascript"}
                  style={vscDarkPlus}
                  className="rounded-md"
                >
                  {question.codeSnippet}
                </SyntaxHighlighter>
              </div>
            )}

            {/* Multiple choice options */}
            {isMultipleChoice ? (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Select the correct option:</h3>
                <div className="space-y-3">
                  {options.map((option, index) => (
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
            ) : (
              /* Code Editor for coding questions */
              <div className="my-4">
                <h3 className="text-sm font-medium mb-3">Write your code:</h3>
                <CodeQuizEditor
                  value={userCode}
                  language={question.language || "javascript"}
                  onChange={handleCodeChange}
                  height="200px"
                  data-testid="code-editor"
                  disabled={effectivelySubmitting}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Validation error message */}
      {validationError && (
        <div className="mb-4 mx-6 p-3 bg-amber-50 border border-amber-200 rounded text-amber-700 text-sm">
          {validationError}
        </div>
      )}

      {/* Footer with timer and submit button */}
      <CardFooter className="flex justify-end items-center gap-4 border-t pt-6 p-6">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mr-auto">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatQuizTime(elapsedTime)}</span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={effectivelySubmitting || (isMultipleChoice ? !selectedOption : !userCode.trim())}
          className={cn("px-8", effectivelySubmitting ? "bg-primary/70" : "")}
          data-testid="submit-answer"
        >
          {effectivelySubmitting ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Saving Answer...</span>
            </div>
          ) : isLastQuestion ? (
            "Finish Quiz"
          ) : (
            "Next"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

function arePropsEqual(prev: CodingQuizProps, next: CodingQuizProps) {
  return (
    prev.question.id === next.question.id &&
    prev.question.question === next.question.question &&
    prev.questionNumber === next.questionNumber &&
    prev.isLastQuestion === next.isLastQuestion &&
    prev.totalQuestions === next.totalQuestions &&
    prev.isSubmitting === next.isSubmitting &&
    prev.existingAnswer === next.existingAnswer
  )
}

export default memo(CodingQuizComponent, arePropsEqual)
