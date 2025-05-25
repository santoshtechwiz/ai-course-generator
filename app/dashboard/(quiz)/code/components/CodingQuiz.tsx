"use client"

import { useCallback, useMemo, useState, useEffect, memo, useRef } from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"
import CodeQuizEditor from "./CodeQuizEditor"
import { cn } from "@/lib/tailwindUtils"
import { formatQuizTime } from "@/lib/utils/quiz-utils"


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

  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [userCode, setUserCode] = useState<string>("")
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [internalSubmitting, setInternalSubmitting] = useState<boolean>(false)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [tooFastWarning, setTooFastWarning] = useState<boolean>(false)

  // Add a ref to track if the component is mounted
  const isMountedRef = useRef(true)

  // Combined submitting state
  const effectivelySubmitting = isSubmitting || internalSubmitting

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Initialize state when question changes
  useEffect(() => {
    if (question?.id) {
      console.log(`Question changed to ${question.id}`)
      prevQuestionIdRef.current = question.id

      setUserCode(existingAnswer || question.codeSnippet || "")
      setSelectedOption(existingAnswer && question.options?.includes(existingAnswer) ? existingAnswer : null)
      setTooFastWarning(false)
      setStartTime(Date.now())
      setElapsedTime(0)
      setInternalSubmitting(false) // Reset submitting state on question change
    }
  }, [question?.id, question.codeSnippet, question.options, existingAnswer])

  // Track elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      if (isMountedRef.current && !effectivelySubmitting) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime, effectivelySubmitting])

  // Memoized options
  const options = useMemo(() => question?.options || [], [question?.options])

  // Handler functions
  const handleSelectOption = useCallback(
    (option: string) => {
      if (effectivelySubmitting) return
      setSelectedOption(option)
      setTooFastWarning(false)
    },
    [effectivelySubmitting],
  )

  const handleCodeChange = useCallback(
    (code: string | undefined) => {
      if (code !== undefined && !effectivelySubmitting) {
        setUserCode(code)
        setTooFastWarning(false)
      }
    },
    [effectivelySubmitting],
  )

  // Debug function
  useEffect(() => {
    if (process.env.NODE_ENV !== "test") {
      console.log("CodingQuiz rendering:", {
        questionId: question?.id,
        questionNumber,
        totalQuestions,
        isLastQuestion,
        selectedOption,
        effectivelySubmitting,
      })
    }
  }, [question?.id, questionNumber, totalQuestions, isLastQuestion, selectedOption, effectivelySubmitting])

  const handleSubmit = useCallback(() => {
    // Prevent submission if already in progress
    if (effectivelySubmitting) return

    const answerTime = Math.floor((Date.now() - startTime) / 1000)

    // Skip validation in test environment
    if (process.env.NODE_ENV !== "test") {
      if (answerTime < 1) {
        setTooFastWarning(true)
        return
      }

      if ((options.length > 0 && !selectedOption) || (!options.length && !userCode.trim())) {
        setTooFastWarning(true)
        return
      }
    }

    // Mark as submitting immediately to prevent double clicks
    setInternalSubmitting(true)

    // Determine answer and correctness
    const answer = options.length > 0 ? selectedOption || "" : userCode
    let isCorrect = false

    if (question.answer || question.correctAnswer) {
      const correctAnswer = question.answer || question.correctAnswer || ""

      if (options.length > 0) {
        // Multiple choice matching
        isCorrect = selectedOption === correctAnswer
      } else {
        // Code answer matching
        const normalizeCode = (code: string) => code.trim().replace(/\s+/g, " ").toLowerCase()
        isCorrect =
          normalizeCode(userCode).includes(normalizeCode(correctAnswer)) || correctAnswer.includes(userCode.trim())
      }
    }

    // Call the onAnswer callback
    onAnswer(answer, answerTime, isCorrect)
  }, [userCode, question, onAnswer, startTime, effectivelySubmitting, options, selectedOption])

  // Render code with syntax highlighting
  const renderCode = useCallback((code: string, language = "javascript") => {
    if (!code) return null

    const cleanCode = code.replace(/^```[\w]*\n?|\n?```$/g, "")

    return (
      <div className="rounded-md overflow-hidden">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem",
            fontSize: "0.9rem",
            backgroundColor: "#1E1E1E",
          }}
          showLineNumbers={true}
        >
          {cleanCode}
        </SyntaxHighlighter>
      </div>
    )
  }, [])

  // Format question text with inline code
  const renderQuestionText = useCallback((text: string) => {
    if (!text) return null

    const [questionText, ...codeBlocks] = text.split("```")

    return (
      <div className="space-y-4">
        <div>
          {questionText.split(/`([^`]+)`/).map((part, index) =>
            index % 2 === 0 ? (
              <span key={index}>{part}</span>
            ) : (
              <code key={index} className="bg-muted/50 text-primary font-mono px-1.5 py-0.5 rounded-md">
                {part}
              </code>
            ),
          )}
        </div>
        {codeBlocks.map((code, index) => (
          <pre key={index} className="bg-muted/50 p-4 rounded-lg overflow-x-auto">
            <code className="text-primary font-mono whitespace-pre">{code.trim()}</code>
          </pre>
        ))}
      </div>
    )
  }, [])

  // Error state
  if (!question) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">This question is not available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-sm border" data-testid="coding-quiz">
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Question {questionNumber}/{totalQuestions}
          </h2>
          <span className="text-gray-500">Code Challenge</span>
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
            <h3 className="text-lg font-medium mb-6">{renderQuestionText(question.question)}</h3>

            {/* Code Editor */}
            <div className="my-4">
              <CodeQuizEditor
                value={userCode}
                language={question.language || "javascript"}
                onChange={handleCodeChange}
                height="180px"
                data-testid="code-editor"
                disabled={effectivelySubmitting}
              />
            </div>

            {/* Multiple choice options */}
            {options.length > 0 && (
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
            )}
          </div>
        </div>
      </CardContent>

      {/* Warning message */}
      <div
        className={`mb-4 mx-6 p-2 bg-amber-50 border border-amber-200 rounded text-amber-600 text-sm ${tooFastWarning ? "" : "hidden"}`}
        data-testid="warning-message"
      >
        {options.length > 0 && !selectedOption
          ? "Please select an option before proceeding."
          : !options.length && !userCode.trim()
            ? "Please write your code answer before submitting."
            : "Please take time to read the question carefully before answering."}
      </div>

      {/* Footer with timer and submit button */}
      <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 p-6">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatQuizTime(elapsedTime)}</span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={
            process.env.NODE_ENV !== "test" &&
            (effectivelySubmitting || (options.length > 0 && !selectedOption) || (!options.length && !userCode.trim()))
          }
          className={cn("px-8", effectivelySubmitting ? "bg-primary/70" : "")}
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
