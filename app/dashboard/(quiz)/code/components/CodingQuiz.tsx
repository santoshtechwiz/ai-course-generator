"use client"

import React, { useCallback, useMemo, useState } from "react"
import { ArrowRight, ArrowLeft, Code, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"

import { useAnimation } from "@/providers/animation-provider"
import { MotionWrapper, MotionTransition } from "@/components/ui/animations/motion-wrapper"
import { formatQuizTime } from "@/lib/utils"
import CodeQuizOptions from "./CodeQuizOptions"

// Define proper TypeScript interfaces
interface Question {
  id: string
  question: string
  code?: string
  codeSnippet?: string
  language?: string
  options: string[]
  answer: string
  explanation?: string
  difficulty: string
  timeLimit?: number
}

interface CodingQuizProps {
  question: Question
  onAnswer: (answer: string, timeSpent: number, isCorrect: boolean) => void
  questionNumber: number
  totalQuestions: number
}

export default function CodingQuiz({ question, onAnswer, questionNumber, totalQuestions }: CodingQuizProps) {
  const { animationsEnabled } = useAnimation()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  console.log("CodingQuiz question", question)

  // Start timer when component mounts
  React.useEffect(() => {
    const startTime = Date.now()
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(timer)
  }, [question?.id]) // Reset timer when question changes

  const options = useMemo(() => {
    return Array.isArray(question?.options) ? question.options : []
  }, [question?.options])

  const handleSelectOption = useCallback((option: string) => {
    setSelectedOption(option)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!selectedOption || isSubmitting) return

    setIsSubmitting(true)

    // Determine if the selected option is correct
    const isCorrect = selectedOption === question.answer

    // Submit the answer
    setTimeout(() => {
      onAnswer(selectedOption, elapsedTime, isCorrect)
      setIsSubmitting(false)
    }, 300) // Small delay for better UX
  }, [selectedOption, question, onAnswer, elapsedTime, isSubmitting])

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

  const renderOptionContent = useCallback(
    (option: string) => {
      if (!option) return null

      const codeRegex = /```[\s\S]*?```/g
      const parts = option.split(codeRegex)
      const codes = option.match(codeRegex) || []

      return (
        <div className="w-full">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {part && <span className="block mb-2">{part.trim()}</span>}
              {codes[index] && <div className="my-2">{renderCode(codes[index], question?.language)}</div>}
            </React.Fragment>
          ))}
        </div>
      )
    },
    [question?.language, renderCode],
  )

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
        <MotionTransition key={question.id} motionKey={String(question.id)}>
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

              {question?.codeSnippet && (
                <MotionWrapper animate={animationsEnabled} variant="fade" duration={0.5} delay={0.2}>
                  <div className="my-4 overflow-x-auto">{renderCode(question.codeSnippet, question.language)}</div>
                </MotionWrapper>
              )}

              {options.length > 0 && (
                <MotionWrapper animate={animationsEnabled} variant="fade" duration={0.5} delay={0.2}>
                  <CodeQuizOptions
                    options={options}
                    selectedOption={selectedOption}
                    onSelect={handleSelectOption}
                    disabled={isSubmitting}
                    renderOptionContent={renderOptionContent}
                  />
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

        <Button onClick={handleSubmit} disabled={!selectedOption || isSubmitting} className="w-full sm:w-auto">
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
