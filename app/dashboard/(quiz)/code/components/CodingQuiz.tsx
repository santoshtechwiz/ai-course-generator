"use client"

import { useCallback, useMemo, useState, useEffect, memo } from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"

import { useAnimation } from "@/providers/animation-provider"
import { MotionWrapper, MotionTransition } from "@/components/ui/animations/motion-wrapper"
import { formatQuizTime, isTooFastAnswer } from "@/lib/utils/quiz-performance"
import CodeQuizEditor from "./CodeQuizEditor"
import { cn } from "@/lib/tailwindUtils"

// Define types for props
interface CodingQuizProps {
  question: {
    id: string
    question: string
    codeSnippet?: string
    options?: string[]
    answer?: string
    correctAnswer?: string
    language?: string
  }
  onAnswer: (answer: string, elapsedTime: number, isCorrect: boolean) => void
  questionNumber: number
  totalQuestions: number
  isLastQuestion: boolean
}

// Update the component props type definition
function CodingQuizComponent({ question, onAnswer, questionNumber, totalQuestions, isLastQuestion }: CodingQuizProps) {
  const { animationsEnabled } = useAnimation()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [userCode, setUserCode] = useState<string>(question?.codeSnippet || "")
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [startTime] = useState<number>(Date.now())
  const [tooFastWarning, setTooFastWarning] = useState<boolean>(false)

  // Reset state when question changes
  useEffect(() => {
    setUserCode(question?.codeSnippet || "")
    setSelectedOption(null)
    setElapsedTime(0)
    setTooFastWarning(false)
  }, [question?.id, question?.codeSnippet])

  // Update elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime])

  const options = useMemo(() => {
    return Array.isArray(question?.options) ? question.options : []
  }, [question?.options])

  const handleSelectOption = useCallback((option: string) => {
    setSelectedOption(option)
    setTooFastWarning(false)
  }, [])

  const handleCodeChange = useCallback((code: string | undefined) => {
    if (code !== undefined) {
      setUserCode(code)
      setTooFastWarning(false)
    }
  }, [])

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return

    const answerTime = Date.now() - startTime
    if (isTooFastAnswer(startTime, 1)) {
      setTooFastWarning(true)
      return
    }

    setIsSubmitting(true)

    const answer = options.length > 0 && selectedOption ? selectedOption : userCode
    let isCorrect = false

    if (question.answer || question.correctAnswer) {
      const correctAnswer = question.answer || question.correctAnswer || ""
      isCorrect = options.length > 0 ? selectedOption === correctAnswer : answer.includes(correctAnswer)
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000)

    // Call onAnswer with the selected option or code
    onAnswer(answer, timeSpent, isCorrect)

    // Reset submission state after a short delay
    setTimeout(() => {
      setIsSubmitting(false)
    }, 300)
  }, [userCode, question, onAnswer, startTime, isSubmitting, options, selectedOption])

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

  // If no question is available
  if (!question) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">This question is not available.</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">Loading code challenge...</p>
          </div>
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
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <MotionTransition key={question.id} motionKey={String(question.id || questionNumber)}>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-6">{renderQuestionText(question?.question || "")}</h3>

              {/* Code Editor */}
              <MotionWrapper animate={animationsEnabled} variant="fade" duration={0.5} delay={0.2}>
                <div className="my-4">
                  <CodeQuizEditor
                    value={userCode}
                    language={question.language || "javascript"}
                    onChange={handleCodeChange}
                    height="180px" // Reduced height
                    data-testid="code-editor"
                  />
                </div>
              </MotionWrapper>

              {/* Multiple choice options if available */}
              {options.length > 0 && (
                <MotionWrapper animate={animationsEnabled} variant="fade" duration={0.5} delay={0.2}>
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">Select the correct option:</h3>
                    <div className="space-y-3">
                      {options.map((option, index) => (
                        <div
                          key={index}
                          className={cn(
                            "border rounded-md p-4 cursor-pointer transition-all",
                            selectedOption === option ? "border-primary bg-primary/5" : "hover:bg-gray-50",
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
                </MotionWrapper>
              )}
            </div>
          </div>
        </MotionTransition>
      </CardContent>

      {tooFastWarning && (
        <div className="mb-4 p-2 mx-6 bg-amber-50 border border-amber-200 rounded text-amber-600 text-sm">
          Please take time to read the question carefully before answering.
        </div>
      )}

      <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 p-6">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatQuizTime(elapsedTime)}</span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || (options.length > 0 && !selectedOption)}
          className="px-8"
          data-testid="submit-answer"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              <span>Submitting...</span>
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

// Custom comparison function for memoization
function arePropsEqual(prevProps: CodingQuizProps, nextProps: CodingQuizProps) {
  return (
    prevProps.question.id === nextProps.question.id &&
    prevProps.questionNumber === nextProps.questionNumber &&
    prevProps.isLastQuestion === nextProps.isLastQuestion
  )
}

// Export memoized component with custom comparison
export default memo(CodingQuizComponent, arePropsEqual)
