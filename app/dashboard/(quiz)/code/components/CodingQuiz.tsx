"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import { ArrowRight, ArrowLeft, Code, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"

import { useAnimation } from "@/providers/animation-provider"
import { MotionWrapper, MotionTransition } from "@/components/ui/animations/motion-wrapper"
// import { formatQuizTime } from "@/lib/utils"
import CodeQuizOptions from "./CodeQuizOptions"
import CodeQuizEditor from "./CodeQuizEditor"
const formatQuizTime = (time: number): string => {
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = time % 60

  return `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}${seconds}s`
}
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
}

export default function CodingQuiz({ question, onAnswer, questionNumber, totalQuestions }: CodingQuizProps) {
  const { animationsEnabled } = useAnimation()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [userCode, setUserCode] = useState<string>(question?.codeSnippet || "")
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Start timer when component mounts
  useEffect(() => {
    const startTime = Date.now()
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    // Initialize user code with the question's code snippet
    if (question?.codeSnippet) {
      setUserCode(question.codeSnippet)
    }

    return () => clearInterval(timer)
  }, [question?.id, question?.codeSnippet]) // Reset timer when question changes

  const options = useMemo(() => {
    return Array.isArray(question?.options) ? question.options : []
  }, [question?.options])

  const handleSelectOption = useCallback((option: string) => {
    setSelectedOption(option)
  }, [])

  const handleCodeChange = useCallback((code: string | undefined) => {
    if (code !== undefined) {
      setUserCode(code)
    }
  }, [])

  // Update the handleSubmit function to properly check answers
  const handleSubmit = useCallback(() => {
    if (isSubmitting) return

    setIsSubmitting(true)

    // For code quizzes, we need to evaluate the code against the expected answer
    const answer = userCode

    // Improved answer validation - check if the answer contains the expected solution
    // or if the selected option matches the correct answer
    let isCorrect = false

    if (question.answer || question.correctAnswer) {
      const correctAnswer = question.answer || question.correctAnswer || ""

      // If we have options and a selected option, check if it matches
      if (options.length > 0 && selectedOption) {
        isCorrect = selectedOption === correctAnswer
      } else {
        // For code answers, check if the user's code contains the expected solution
        // This is a simple check - in production you'd want more sophisticated validation
        isCorrect = answer.includes(correctAnswer)
      }
    }

    // Submit the answer
    setTimeout(() => {
      onAnswer(answer, elapsedTime, isCorrect)
      setIsSubmitting(false)
    }, 300) // Small delay for better UX
  }, [userCode, question, onAnswer, elapsedTime, isSubmitting, options, selectedOption])

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
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex flex-col space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Question {questionNumber} of {totalQuestions}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatQuizTime(elapsedTime)}</span>
            </div>
          </div>
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
              <div className="flex items-start gap-3">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary font-medium px-3 py-1 flex items-center gap-1.5 mt-1"
                >
                  <Code className="h-3.5 w-3.5" />
                  Code Challenge
                </Badge>
                <h2 className="text-lg sm:text-xl font-semibold">{renderQuestionText(question?.question || "")}</h2>
              </div>

              {/* Code Editor */}
              <MotionWrapper animate={animationsEnabled} variant="fade" duration={0.5} delay={0.2}>
                {/* Update the CodeQuizEditor component to take up less space */}
                {/* Replace the existing CodeEditor div with this: */}
                <div className="my-4">
                  <CodeQuizEditor
                    value={userCode}
                    language={question.language || "javascript"}
                    onChange={handleCodeChange}
                    height="180px" // Reduced height
                  />
                </div>
              </MotionWrapper>

              {/* Multiple choice options if available */}
              {options.length > 0 && (
                <MotionWrapper animate={animationsEnabled} variant="fade" duration={0.5} delay={0.2}>
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">Select the correct option:</h3>
                    <CodeQuizOptions
                      options={options}
                      selectedOption={selectedOption}
                      onSelect={handleSelectOption}
                      disabled={isSubmitting}
                    />
                  </div>
                </MotionWrapper>
              )}
            </div>
          </div>
        </MotionTransition>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 md:flex-row flex-col-reverse">
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-mono">{formatQuizTime(elapsedTime)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Time spent on this question</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {questionNumber > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                /* Previous handled by parent */
              }}
              className="gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              <span>Submitting...</span>
            </div>
          ) : (
            <>
              {questionNumber === totalQuestions ? "Finish Quiz" : "Next Question"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
