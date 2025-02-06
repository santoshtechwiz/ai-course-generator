"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCcw, Trophy, HelpCircle, ArrowRight, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import QuizOptions from "./CodeQuizOptions"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { submitQuizData } from "@/app/actions/actions"
import { useSession } from "next-auth/react"
import { SignInPrompt } from "@/app/components/SignInPrompt"
import { useRouter } from "next/navigation"
import type { CodeChallenge } from "@/app/types/types"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CodeQuizProps {
  quizId: number
  slug: string
  isFavorite: boolean
  isPublic: boolean
  userId: string
  ownerId: string
  quizData: {
    title: string
    questions: CodeChallenge[]
  }
}

const CodingQuiz: React.FC<CodeQuizProps> = ({ quizId, slug, isFavorite, isPublic, userId, ownerId, quizData }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<(string | null)[]>(
    new Array(quizData.questions.length).fill(null),
  )
  const [startTimes, setStartTimes] = useState<number[]>(new Array(quizData.questions.length).fill(Date.now()))
  const [timeSpent, setTimeSpent] = useState<number[]>(new Array(quizData.questions.length).fill(0))
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const router = useRouter()
  const { data: session, status } = useSession()

  const currentQuestion: CodeChallenge = quizData.questions[currentQuestionIndex] ?? {
    question: "",
    options: [],
    correctAnswer: "",
    codeSnippet: null,
    language: "javascript",
  }
  const options = Array.isArray(currentQuestion.options) ? currentQuestion.options : []

  useEffect(() => {
    setStartTimes((prev) => {
      const newStartTimes = [...prev]
      newStartTimes[0] = Date.now()
      return newStartTimes
    })

    const savedResults = localStorage.getItem("quizResults")
    if (savedResults) {
      setQuizResults(JSON.parse(savedResults))
      setQuizCompleted(true)
    }
  }, [])

  const handleSelectOption = (option: string) => {
    setSelectedOptions((prev) => {
      const newSelectedOptions = [...prev]
      newSelectedOptions[currentQuestionIndex] = option
      return newSelectedOptions
    })
  }

  const calculateScore = useCallback(() => {
    return selectedOptions.reduce((score, selected, index) => {
      const correctAnswer = quizData.questions[index].correctAnswer
      return score + (selected === correctAnswer ? 1 : 0)
    }, 0)
  }, [selectedOptions, quizData.questions])

  const handleNextQuestion = useCallback(async () => {
    const currentTime = Date.now()
    const timeSpentOnQuestion = Math.round((currentTime - startTimes[currentQuestionIndex]) / 1000)

    setTimeSpent((prev) => {
      const newTimeSpent = [...prev]
      newTimeSpent[currentQuestionIndex] = timeSpentOnQuestion
      return newTimeSpent
    })

    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
      setStartTimes((prev) => {
        const newStartTimes = [...prev]
        newStartTimes[currentQuestionIndex + 1] = Date.now()
        return newStartTimes
      })
    } else {
      setIsSubmitting(true)
      try {
        const correctCount = calculateScore()
        const score = (correctCount / quizData.questions.length) * 100
        const totalTimeSpent =
          timeSpent.reduce((sum, time) => sum + time, 0) + (Date.now() - startTimes[currentQuestionIndex]) / 1000

        const answers = selectedOptions.map((answer, index) => ({
          answer: answer || "",
          timeSpent: index === currentQuestionIndex ? (Date.now() - startTimes[index]) / 1000 : timeSpent[index],
          hintsUsed: false,
        }))

        const results = {
          slug,
          quizId: quizId,
          answers,
          elapsedTime: Math.round(totalTimeSpent),
          score,
          type: "code",
        }

        if (status === "authenticated") {
          const submittedResults = await submitQuizData(results, setIsSubmitting)
          setQuizResults(submittedResults)
        } else {
          localStorage.setItem("quizResults", JSON.stringify(results))
          setQuizResults(results)
        }
        setQuizCompleted(true)
      } catch (error) {
        console.error("Error submitting quiz data:", error)
        setIsSubmitting(false)
      }
    }
  }, [
    currentQuestionIndex,
    quizData.questions.length,
    quizId,
    selectedOptions,
    calculateScore,
    startTimes,
    timeSpent,
    slug,
    status,
  ])

  const restartQuiz = useCallback(() => {
    localStorage.removeItem("quizResults")
    setCurrentQuestionIndex(0)
    setSelectedOptions(new Array(quizData.questions.length).fill(null))
    setStartTimes(new Array(quizData.questions.length).fill(Date.now()))
    setTimeSpent(new Array(quizData.questions.length).fill(0))
    setQuizCompleted(false)
    setIsSubmitting(false)
    setQuizResults(null)
  }, [quizData.questions.length])

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

  useEffect(() => {
    const submitSavedResults = async () => {
      if (status === "authenticated" && quizResults && !quizResults.submitted) {
        try {
          const submittedResults = await submitQuizData(quizResults, setIsSubmitting)
          setQuizResults(submittedResults)
          localStorage.removeItem("quizResults")
        } catch (error) {
          console.error("Failed to submit saved quiz results:", error)
        }
      }
    }

    submitSavedResults()
  }, [status, quizResults])

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }, [])

  if (quizCompleted) {
    const correctCount = calculateScore()
    const totalQuestions = quizData.questions.length
    const percentage = (correctCount / totalQuestions) * 100
    const totalTime = quizResults?.elapsedTime ?? timeSpent.reduce((sum, time) => sum + time, 0)

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-screen p-4 bg-background"
      >
        <div className="max-w-2xl w-full text-center space-y-6">
          <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
          <h2 className="text-2xl font-bold">Quiz Completed!</h2>
          <p className="text-muted-foreground">Time taken: {formatTime(totalTime)}</p>
          {status === "authenticated" ? (
            <>
              <div className="bg-muted rounded-lg p-6 space-y-4">
                <div className="text-4xl font-bold">{Math.round(percentage).toFixed(2)}%</div>
                <p className="text-muted-foreground">
                  You got {correctCount} out of {totalQuestions} questions correct
                </p>
              </div>
              <Button onClick={restartQuiz} className="w-full sm:w-auto">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retake Quiz
              </Button>
            </>
          ) : (
            <SignInPrompt callbackUrl={`/dashboard/code/${slug}`} />
          )}
        </div>
      </motion.div>
    )
  }

  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100

  return (
    <div className="w-full  w-[98%] md:max-w-3xl p-4 mx-auto dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="space-y-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">Coding Quiz Challenge</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-help">
                  <Timer className="w-4 h-4" />
                  {formatTime(timeSpent.reduce((a, b) => a + b, 0))}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total time spent on the quiz</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Progress: {Math.round(progress)}%</span>
            <span>
              Question {currentQuestionIndex + 1} of {quizData.questions.length}
            </span>
          </div>
        </div>
      </div>
      <div className="pb-6">
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
                <div className="my-4">{renderCode(currentQuestion.codeSnippet, currentQuestion.language)}</div>
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
      </div>
      <div className="flex justify-between items-center gap-4 border-t pt-6 md:flex-row flex-col-reverse">
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
          ) : currentQuestionIndex === quizData.questions.length - 1 ? (
            "Finish Quiz"
          ) : (
            <>
              Next Question
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default CodingQuiz

