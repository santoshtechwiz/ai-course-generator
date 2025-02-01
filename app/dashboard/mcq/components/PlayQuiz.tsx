"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, ArrowRight, RefreshCcw, AlertTriangle, Trophy, Timer, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
import { toast } from "@/hooks/use-toast"
import { useSession, signIn } from "next-auth/react"
import { SignInPrompt } from "@/app/components/SignInPrompt"
import { submitQuizData } from "@/app/actions/actions"
import { GlobalLoader } from "@/app/components/GlobalLoader"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Question = {
  id: number
  question: string
  answer: string
  option1: string
  option2: string
  option3: string
}

interface PlayQuizProps {
  questions: Question[]
  quizId: number
  slug: string
}

export default function PlayQuiz({ questions, quizId, slug }: PlayQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [uniqueOptions, setUniqueOptions] = useState<string[]>([])
  const [hasError, setHasError] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [questionTimes, setQuestionTimes] = useState<number[]>([])
  const [startTime] = useState<number>(Date.now())
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentQuestion = questions[currentQuestionIndex]

  const saveQuizResults = useCallback(
    async (quizData: any) => {
      try {
        setLoading(true)
        await submitQuizData({
          slug,
          quizId,
          answers: quizData.answers,
          elapsedTime: quizData.totalTime,
          score: quizData.score,
          type: "mcq",
        })
        setLoading(false)
      } catch (error) {
        console.error("Failed to update quiz score:", error)
        setLoading(false)
        toast({
          title: "Error",
          description: "Failed to update quiz score. Please try again.",
          variant: "destructive",
        })
      }
    },
    [slug, quizId],
  )

  const handleQuizCompletion = useCallback(() => {
    const duration = Math.floor((Date.now() - startTime) / 1000)

    const currentTime = timeSpent - (questionTimes.length > 0 ? questionTimes.reduce((a, b) => a + b, 0) : 0)
    const finalUserAnswers = [...userAnswers, selectedAnswer || ""]
    const finalQuestionTimes = [...questionTimes, currentTime]

    setQuizCompleted(true)
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })

    const finalScore = finalUserAnswers.filter((answer, index) => answer === questions[index].answer).length
    setScore(finalScore)

    const quizData = {
      quizId,
      score: finalScore,
      totalTime: duration,
      answers: questions.map((q, index) => ({
        questionId: q.id,
        userAnswer: finalUserAnswers[index] || "",
        isCorrect: finalUserAnswers[index] === q.answer,
        timeSpent: finalQuestionTimes[index] || 0,
      })),
    }

    console.log("Quiz data:", quizData)
    if (isAuthenticated) {
      saveQuizResults(quizData)
    } else {
      localStorage.setItem(
        "quizResults",
        JSON.stringify({
          slug,
          quizData,
          score: finalScore,
          quizCompleted: true,
          timeSpent,
          userAnswers: finalUserAnswers,
          questionTimes: finalQuestionTimes,
        }),
      )
    }
  }, [
    isAuthenticated,
    questions,
    quizId,
    saveQuizResults,
    selectedAnswer,
    slug,
    startTime,
    timeSpent,
    userAnswers,
    questionTimes,
  ])

  useEffect(() => {
    const timer = setInterval(() => {
      if (!quizCompleted) {
        setTimeSpent((prev) => prev + 1)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [quizCompleted])

  useEffect(() => {
    if (currentQuestion) {
      const allOptions = [
        currentQuestion.answer,
        currentQuestion.option1,
        currentQuestion.option2,
        currentQuestion.option3,
      ].filter(Boolean)

      const uniqueOptionsSet = new Set(allOptions)

      if (uniqueOptionsSet.size < 2) {
        setHasError(true)
        return
      }

      if (uniqueOptionsSet.size < 4) {
        const fallbackOptions = [
          "None of the above",
          "All of the above",
          "Not enough information",
          "Cannot be determined",
        ]

        let i = 0
        while (uniqueOptionsSet.size < 4 && i < fallbackOptions.length) {
          uniqueOptionsSet.add(fallbackOptions[i])
          i++
        }
      }

      const shuffledOptions = [...uniqueOptionsSet].sort(() => Math.random() - 0.5)
      setUniqueOptions(shuffledOptions)
      setHasError(false)
    }

    setSelectedAnswer(null)
  }, [currentQuestion])

  const nextQuestion = useCallback(() => {
    setIsSubmitting(true)
    setTimeout(() => {
      const currentTime = timeSpent - (questionTimes.length > 0 ? questionTimes.reduce((a, b) => a + b, 0) : 0)
      setUserAnswers((prev) => [...prev, selectedAnswer || ""])
      setQuestionTimes((prev) => [...prev, currentTime])

      if (selectedAnswer === currentQuestion.answer) {
        setScore((prevScore) => prevScore + 1)
      }

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
        setSelectedAnswer(null)
      } else {
        handleQuizCompletion()
      }
      setIsSubmitting(false)
    }, 500) // Simulate a delay for smoother UX
  }, [
    currentQuestion.answer,
    currentQuestionIndex,
    handleQuizCompletion,
    questions.length,
    questionTimes,
    selectedAnswer,
    timeSpent,
  ])

  const resetQuiz = useCallback(() => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setQuizCompleted(false)
    setHasError(false)
    setTimeSpent(0)
    setUserAnswers([])
    setQuestionTimes([])
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }, [])

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  useEffect(() => {
    if (isAuthenticated) {
      const savedResults = localStorage.getItem("quizResults")
      if (savedResults) {
        const {
          slug: savedSlug,
          quizData,
          score: savedScore,
          quizCompleted: savedQuizCompleted,
          timeSpent: savedTimeSpent,
          userAnswers: savedUserAnswers,
          questionTimes: savedQuestionTimes,
        } = JSON.parse(savedResults)
        if (savedSlug === slug) {
          setScore(savedScore)
          setQuizCompleted(savedQuizCompleted)
          setTimeSpent(savedTimeSpent)
          setUserAnswers(savedUserAnswers)
          setQuestionTimes(savedQuestionTimes)
          saveQuizResults(quizData)
          localStorage.removeItem("quizResults")
        }
      }
    }
  }, [isAuthenticated, slug, saveQuizResults])

  if (loading) return <GlobalLoader loading={loading} />

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Question Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            This question needs review due to insufficient options.
          </p>
          <Button onClick={nextQuestion}>Skip to Next Question</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[95%] md:max-w-3xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="space-y-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">Interactive Quiz Challenge</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-help">
                  <Timer className="w-4 h-4" />
                  {formatTime(timeSpent)}
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
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
        </div>
      </div>
      <div className="pb-6">
        <AnimatePresence mode="wait" initial={false}>
          {!quizCompleted ? (
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
                  <h2 className="text-lg sm:text-xl font-semibold">{currentQuestion?.question}</h2>
                </div>
                <RadioGroup
                  onValueChange={(value) => setSelectedAnswer(value)}
                  value={selectedAnswer || ""}
                  className="space-y-3"
                >
                  {uniqueOptions.map((option, index) => (
                    <motion.div
                      key={`${index}-${option}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div
                        className={cn(
                          "flex items-center space-x-2 p-3 sm:p-4 rounded-lg transition-all",
                          "hover:bg-muted",
                          "border-2 border-transparent",
                          selectedAnswer === option && "border-primary",
                        )}
                      >
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label
                          htmlFor={`option-${index}`}
                          className="flex-grow cursor-pointer font-medium text-sm sm:text-base"
                        >
                          {option}
                        </Label>
                      </div>
                    </motion.div>
                  ))}
                </RadioGroup>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 sm:py-8 space-y-4 sm:space-y-6"
            >
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-yellow-500" />
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold">Quiz Completed!</h2>
                <p className="text-muted-foreground">Time taken: {formatTime(timeSpent)}</p>
              </div>
              {isAuthenticated ? (
                <>
                  <div className="bg-muted rounded-lg p-4 sm:p-6 space-y-4">
                    <div className="text-3xl sm:text-4xl font-bold">
                      {Math.round((score / questions.length) * 100)}%
                    </div>
                    <p className="text-muted-foreground">
                      You got {score} out of {questions.length} questions correct
                    </p>
                  </div>
                  <Button onClick={resetQuiz} className="w-full sm:w-auto">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Retake Quiz
                  </Button>
                </>
              ) : (
                <SignInPrompt callbackUrl={`/dashboard/mcq/${slug}`} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!quizCompleted && (
        <div className="flex justify-between items-center gap-4 border-t pt-6 md:flex-row flex-col-reverse">
          <p className="text-sm text-muted-foreground">
            Question time:{" "}
            {formatTime(timeSpent - (questionTimes.length > 0 ? questionTimes.reduce((a, b) => a + b, 0) : 0))}
          </p>
          <Button onClick={nextQuestion} disabled={!selectedAnswer || isSubmitting} className="w-full sm:w-auto">
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
        </div>
      )}
    </div>
  )
}