"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HelpCircle, ArrowRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import QuizOptions from "./CodeQuizOptions"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { submitQuizData } from "@/app/actions/actions"
import { useSession } from "next-auth/react"

import { useRouter } from "next/navigation"
import type { CodeChallenge } from "@/app/types/types"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CodeQuizProps {
  questions: CodeChallenge[]
  slug: string
  onComplete: (correctCount: number, totalQuestions: number) => void
}

const CodeQuiz: React.FC<CodeQuizProps> = ({ questions, slug, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<(string | null)[]>(new Array(questions.length).fill(null))
  const [startTimes, setStartTimes] = useState<number[]>(new Array(questions.length).fill(Date.now()))
  const [timeSpent, setTimeSpent] = useState<number[]>(new Array(questions.length).fill(0))
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const router = useRouter()
  const { data: session, status } = useSession()

  const currentQuestion: CodeChallenge = questions[currentQuestionIndex] ?? {
    question: "",
    options: [],
    correctAnswer: "",
    codeSnippet: null,
    language: "javascript",
  }
  const options = Array.isArray(currentQuestion.options) ? currentQuestion.options : []

  useEffect(() => {
    // Initialize the first question's start time
    const newStartTimes = [...startTimes]
    newStartTimes[0] = Date.now()
    setStartTimes(newStartTimes)
  }, [])

  // Update timer for current question
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent((prev) => {
        const newTimeSpent = [...prev]
        newTimeSpent[currentQuestionIndex] = (newTimeSpent[currentQuestionIndex] || 0) + 1
        return newTimeSpent
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentQuestionIndex])

  const handleSelectOption = (option: string) => {
    setSelectedOptions((prev) => {
      const newSelectedOptions = [...prev]
      newSelectedOptions[currentQuestionIndex] = option
      return newSelectedOptions
    })
  }

  const calculateScore = useCallback(() => {
    return selectedOptions.reduce((score, selected, index) => {
      if (index >= questions.length) return score
      const correctAnswer = questions[index].correctAnswer
      return score + (selected === correctAnswer ? 1 : 0)
    }, 0)
  }, [selectedOptions, questions])

  const handleNextQuestion = useCallback(async () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1)

      // Set start time for the next question
      setStartTimes((prev) => {
        const newStartTimes = [...prev]
        newStartTimes[currentQuestionIndex + 1] = Date.now()
        return newStartTimes
      })
    } else {
      // Quiz completed, submit results
      setIsSubmitting(true)
      try {
        const correctCount = calculateScore()
        const score = (correctCount / questions.length) * 100
        const totalTimeSpent = timeSpent.reduce((sum, time) => sum + time, 0)

        const answers = selectedOptions.map((answer, index) => ({
          answer: answer || "",
          isCorrect: answer === questions[index].correctAnswer,
          timeSpent: timeSpent[index] || 0,
          hintsUsed: false,
        }))

        const results = {
          slug,
          quizId: 0, // This will be set by the server
          answers,
          elapsedTime: Math.round(totalTimeSpent),
          score,
          type: "code",
        }

        if (status === "authenticated") {
          await submitQuizData(results)
        }

        onComplete(correctCount, questions.length)
        setQuizCompleted(true)
      } catch (error) {
        console.error("Error submitting quiz data:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [currentQuestionIndex, questions, selectedOptions, calculateScore, timeSpent, slug, status, onComplete])

  const renderQuestionText = useCallback((text: string) => {
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

  const renderCode = useCallback((code: string, language = "javascript") => {
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

  const renderOptionContent = useCallback(
    (option: string) => {
      const codeRegex = /```[\s\S]*?```/g
      const parts = option.split(codeRegex)
      const codes = option.match(codeRegex) || []

      return (
        <div className="w-full">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {part && <span className="block mb-2">{part.trim()}</span>}
              {codes[index] && <div className="my-2">{renderCode(codes[index], currentQuestion.language)}</div>}
            </React.Fragment>
          ))}
        </div>
      )
    },
    [currentQuestion.language, renderCode],
  )

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }, [])

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary font-medium px-3 py-1">
              Coding Challenge
            </Badge>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-mono">{formatTime(timeSpent.reduce((a, b) => a + b, 0))}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total time spent on the quiz</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="w-full space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold">{renderQuestionText(currentQuestion.question)}</h2>
              </div>
              {currentQuestion.codeSnippet && (
                <div className="my-4 overflow-x-auto">
                  {renderCode(currentQuestion.codeSnippet, currentQuestion.language)}
                </div>
              )}
              <QuizOptions
                options={options}
                selectedOption={selectedOptions[currentQuestionIndex]}
                onSelect={handleSelectOption}
                disabled={false}
                renderOptionContent={renderOptionContent}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 md:flex-row flex-col-reverse">
        <p className="text-sm text-muted-foreground">
          Question time: {formatTime(timeSpent[currentQuestionIndex] || 0)}
        </p>
        <Button
          onClick={handleNextQuestion}
          disabled={selectedOptions[currentQuestionIndex] === null || isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            "Submitting..."
          ) : currentQuestionIndex === questions.length - 1 ? (
            "Finish Quiz"
          ) : (
            <>
              Next Question
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default CodeQuiz

