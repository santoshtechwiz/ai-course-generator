"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCcw, Trophy, HelpCircle, ArrowRight, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import QuizOptions from "./CodeQuizOptions"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

import { useSession } from "next-auth/react"

import { useRouter } from "next/navigation"
import type { CodeChallenge } from "@/app/types/types"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { SignInPrompt } from "@/components/SignInPrompt"
import { formatQuizTime } from "@/lib/quiz-result-service"
import { useSaveQuizResult } from "@/hooks/use-save-quiz-result"
import { QuizResultDisplay } from "../mcq/QuizResultDisplay"
import { QuizBase } from "../mcq/QuizBase"

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
  onSubmitAnswer?: (answer: any) => void
  onComplete?: () => void
}

const CodingQuiz: React.FC<CodeQuizProps> = ({
  quizId,
  slug,
  isFavorite,
  isPublic,
  userId,
  ownerId,
  quizData,
  onSubmitAnswer,
  onComplete,
}) => {
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
  const { saveQuizResult, isSaving } = useSaveQuizResult()

  const currentQuestion = useMemo(() => {
    return (
      quizData.questions[currentQuestionIndex] ?? {
        question: "",
        options: [],
        correctAnswer: "",
        codeSnippet: null,
        language: "javascript",
      }
    )
  }, [currentQuestionIndex, quizData.questions])

  const options = useMemo(() => {
    return Array.isArray(currentQuestion.options) ? currentQuestion.options : []
  }, [currentQuestion.options])

  useEffect(() => {
    setStartTimes((prev) => {
      const newStartTimes = [...prev]
      newStartTimes[0] = Date.now()
      return newStartTimes
    })

    const savedResults = localStorage.getItem(`quizResults-${userId}`)
    if (savedResults) {
      setQuizResults(JSON.parse(savedResults))
      setQuizCompleted(true)
    }
  }, [userId])

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

    // Create answer data for the current question
    const answerData = {
      answer: selectedOptions[currentQuestionIndex] || "",
      isCorrect: selectedOptions[currentQuestionIndex] === currentQuestion.correctAnswer,
      timeSpent: timeSpentOnQuestion,
    }

    // Call the onSubmitAnswer prop if provided
    if (onSubmitAnswer) {
      onSubmitAnswer(answerData)
    }

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
          userAnswer: answer || "",
          isCorrect: answer === quizData.questions[index].correctAnswer,
          timeSpent: index === currentQuestionIndex ? (Date.now() - startTimes[index]) / 1000 : timeSpent[index],
          hintsUsed: false,
        }))

        if (status === "authenticated") {
          // Use the saveQuizResult hook
          await saveQuizResult({
            quizId,
            answers,
            totalTime: Math.round(totalTimeSpent),
            score,
            type: "code",
            slug,
          })

          // Store results for display
          setQuizResults({
            slug,
            quizId: quizId,
            answers,
            elapsedTime: Math.round(totalTimeSpent),
            score,
            type: "code",
          })
        } else {
          const results = {
            slug,
            quizId: quizId,
            answers: selectedOptions.map((answer, index) => ({
              userAnswer: answer || "",
              isCorrect: answer === quizData.questions[index].correctAnswer,
              timeSpent: index === currentQuestionIndex ? (Date.now() - startTimes[index]) / 1000 : timeSpent[index],
              hintsUsed: false,
            })),
            elapsedTime: Math.round(totalTimeSpent),
            score,
            type: "code",
          }
          localStorage.setItem(`quizResults-${userId}`, JSON.stringify(results))
          setQuizResults(results)
        }

        setQuizCompleted(true)

        // Call the onComplete prop if provided
        if (onComplete) {
          onComplete()
        }
      } catch (error) {
        console.error("Error submitting quiz data:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [
    currentQuestionIndex,
    quizData.questions,
    quizId,
    selectedOptions,
    calculateScore,
    startTimes,
    timeSpent,
    slug,
    status,
    saveQuizResult,
    currentQuestion.correctAnswer,
    onSubmitAnswer,
    onComplete,
    userId,
  ])

  const restartQuiz = useCallback(() => {
    localStorage.removeItem(`quizResults-${userId}`)
    setCurrentQuestionIndex(0)
    setSelectedOptions(new Array(quizData.questions.length).fill(null))
    setStartTimes(new Array(quizData.questions.length).fill(Date.now()))
    setTimeSpent(new Array(quizData.questions.length).fill(0))
    setQuizCompleted(false)
    setIsSubmitting(false)
    setQuizResults(null)
  }, [quizData.questions.length, userId])

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

  // Format time using the service utility
  const formatTime = useCallback((seconds: number) => {
    return formatQuizTime(seconds)
  }, [])

  // Wrap the component with QuizBase
  const quizContent = () => {
    if (quizCompleted) {
      const correctCount = calculateScore()
      const totalQuestions = quizData.questions.length
      const percentage = (correctCount / totalQuestions) * 100
      const totalTime = quizResults?.elapsedTime ?? timeSpent.reduce((sum, time) => sum + time, 0)

      if (status === "authenticated") {
        return (
          <QuizResultDisplay
            quizId={quizId.toString()}
            title={quizData.title}
            score={percentage}
            totalQuestions={totalQuestions}
            totalTime={totalTime}
            correctAnswers={correctCount}
            type="code"
            slug={slug}
            isLoading={isSaving}
          />
        )
      }

      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center space-y-6">
            <Trophy className="w-16 h-16 text-primary" />
            <h2 className="text-2xl font-bold">Quiz Completed!</h2>
            <p className="text-muted-foreground">Time taken: {formatTime(totalTime)}</p>
            {session ? (
              <>
                <div className="bg-muted rounded-lg p-6 space-y-4 w-full">
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
          </CardContent>
        </Card>
      )
    }

    const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100

    return (
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">Coding Quiz Challenge {quizData.title}</h1>
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
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress: {Math.round(progress)}%</span>
              <span>
                Question {currentQuestionIndex + 1} of {quizData.questions.length}
              </span>
            </div>
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
            ) : currentQuestionIndex === quizData.questions.length - 1 ? (
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

  return (
    <QuizBase quizId={quizId} slug={slug} title={quizData.title} type="code" totalQuestions={quizData.questions.length}>
      {quizContent()}
    </QuizBase>
  )
}

export default CodingQuiz

