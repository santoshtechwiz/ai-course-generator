"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { AlertCircle, HelpCircle, Timer, RotateCcw, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"

import BlankQuizResults from "./BlankQuizResults"
import { FillInTheBlanksQuiz } from "./FillInTheBlanksQuiz"
import PageLoader from "@/components/ui/loader"
import { GuidedHelp } from "@/components/HelpModal"
import { SignInPrompt } from "@/components/SignInPrompt"
import { QuizActions } from "@/components/QuizActions"
import { useQuizResult } from "@/hooks/use-quiz-result"
import { QuizSubmissionFeedback } from "@/components/QuizSubmissionFeedback"

interface Question {
  id: number
  question: string
  answer: string
  openEndedQuestion: {
    hints: string[]
    difficulty: string
    tags: string[]
    inputType: string
  }
}

interface QuizData {
  id: number
  questions: Question[]
  title: string
  userId: string
}

interface BlanksQuizAnswer {
  answer: string
  timeSpent: number
  hintsUsed: boolean
}

interface BlankQuizWrapperProps {
  slug: string
}

const saveQuizState = (state: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("quizState", JSON.stringify(state))
  }
}

const loadQuizState = () => {
  if (typeof window !== "undefined") {
    const state = localStorage.getItem("quizState")
    return state ? JSON.parse(state) : null
  }
  return null
}

const BlankQuizWrapper: React.FC<BlankQuizWrapperProps> = ({ slug }) => {
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<BlanksQuizAnswer[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showGuidedHelp, setShowGuidedHelp] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const router = useRouter()

  // Use refs to prevent multiple submissions
  const hasCalledComplete = useRef(false)
  const isSubmittingRef = useRef(false)
  const hasCalledSuccessCallback = useRef(false)

  // Use the centralized quiz result hook
  const { submitQuizResult, isSubmitting, isSuccess, isError, errorMessage, resetSubmissionState, result } =
    useQuizResult({})

  const fetchQuizData = useCallback(async () => {
    try {
      const response = await fetch(`/api/oquiz/${slug}`)
      if (!response.ok) throw new Error("Failed to fetch quiz data")
      const data: QuizData = await response.json()
      setQuizData(data)
      setError(null)
    } catch (error) {
      console.error("Error fetching quiz data:", error)
      setError("Failed to load quiz data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchQuizData()
  }, [fetchQuizData])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (!quizCompleted) {
      timer = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [quizCompleted])

  useEffect(() => {
    if (isAuthenticated) {
      const savedState = loadQuizState()
      if (savedState) {
        setQuizData(savedState.quizData)
        setCurrentQuestion(savedState.currentQuestion)
        setAnswers(savedState.answers)
        setQuizCompleted(savedState.quizCompleted)
        setElapsedTime(savedState.elapsedTime)
        localStorage.removeItem("quizState")
      }
    }
  }, [isAuthenticated])

  // Handle success manually with useEffect
  useEffect(() => {
    if (isSuccess && result && !hasCalledSuccessCallback.current) {
      hasCalledSuccessCallback.current = true
      console.log("Quiz submission successful:", result)
    }
  }, [isSuccess, result])

  // Reset submission state when success or error changes
  useEffect(() => {
    if (isSuccess || isError) {
      isSubmittingRef.current = false
    }
  }, [isSuccess, isError])

  const handleCloseGuidedHelp = () => {
    setShowGuidedHelp(false)
  }

  const handleAnswer = useCallback(
    (answer: string) => {
      const newAnswers = [...answers, { answer, timeSpent: elapsedTime, hintsUsed: false }]
      setAnswers(newAnswers)

      const newCurrentQuestion = currentQuestion + 1
      const newQuizCompleted = !!quizData && newCurrentQuestion >= quizData.questions.length

      setCurrentQuestion(newCurrentQuestion)
      setQuizCompleted(newQuizCompleted)
      setElapsedTime(0)

      if (newQuizCompleted) {
        saveQuizState({
          quizData,
          currentQuestion: newCurrentQuestion,
          answers: newAnswers,
          quizCompleted: newQuizCompleted,
          elapsedTime: 0,
        })
      }
    },
    [elapsedTime, quizData, currentQuestion, answers],
  )

  const handleRestart = useCallback(() => {
    if (window.confirm("Are you sure you want to restart the quiz?")) {
      setCurrentQuestion(0)
      setAnswers([])
      setQuizCompleted(false)
      setStartTime(Date.now())
      setElapsedTime(0)
      setScore(null)
      hasCalledComplete.current = false
      isSubmittingRef.current = false
      hasCalledSuccessCallback.current = false
      console.log("Quiz restarted")
    }
  }, [])

  const handleComplete = useCallback(
    async (calculatedScore: number) => {
      // Prevent multiple submissions
      if (hasCalledComplete.current || isSubmittingRef.current) {
        console.log("Submission already in progress or completed, ignoring")
        return
      }

      // Set the refs immediately to prevent race conditions
      hasCalledComplete.current = true
      isSubmittingRef.current = true

      // Set the score
      setScore(calculatedScore)

      if (isAuthenticated && quizData) {
        try {
          // Format answers for submission
          const formattedAnswers = answers.map((answer, index) => ({
            userAnswer: answer.answer,
            isCorrect: answer.answer.toLowerCase() === quizData.questions[index].answer.toLowerCase(),
            timeSpent: answer.timeSpent,
            hintsUsed: answer.hintsUsed,
          }))

          // Use the centralized quiz submission
          await submitQuizResult(quizData.id.toString(), formattedAnswers, elapsedTime, calculatedScore, "fill-blanks")
        } catch (error) {
          console.error("Error saving quiz results:", error)
          isSubmittingRef.current = false
        }
      }
    },
    [isAuthenticated, quizData, answers, elapsedTime, submitQuizResult],
  )

  // Handle navigation after submission with proper dependencies
  const handleContinue = useCallback(() => {
    if (isSuccess && result && !isSubmittingRef.current) {
      // Navigate to results page with the result ID
      router.push(`/dashboard/quizzes`)
    } else if (isError) {
      // Reset the submission state to try again
      resetSubmissionState()
      isSubmittingRef.current = false
    }
  }, [isSuccess, isError, resetSubmissionState, router, result])

  // Calculate score for the feedback component
  const calculateScore = () => {
    if (!quizData || !answers.length) return 0

    return answers.reduce((score, answer, index) => {
      const isCorrect = answer.answer.toLowerCase() === quizData.questions[index].answer.toLowerCase()
      return score + (isCorrect ? 1 : 0)
    }, 0)
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8 rounded-lg shadow-sm border border-destructive">
        <div className="p-4">
          <h2 className="flex items-center text-destructive font-semibold text-lg">
            <AlertCircle className="w-5 h-5 mr-2" />
            Error Loading Quiz
          </h2>
          <p className="text-muted-foreground my-4">{error}</p>
          <Button onClick={() => fetchQuizData()} className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <PageLoader />
      </div>
    )
  }

  if (!quizData) {
    return (
      <div className="max-w-md mx-auto mt-8 rounded-lg shadow-sm border">
        <div className="p-4">
          <h2 className="flex items-center text-muted-foreground font-semibold text-lg">
            <Info className="w-5 h-5 mr-2" />
            No Quiz Found
          </h2>
          <p className="text-muted-foreground my-4">No quiz data is available for this request.</p>
          <Button variant="outline" onClick={() => window.history.back()} className="w-full">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <QuizActions
        userId={session?.user?.id || ""}
        ownerId={quizData.userId}
        quizId={quizData.id.toString()}
        quizSlug={slug}
        quizType="blanks"
        initialIsPublic={false}
        initialIsFavorite={false}
        position="left-center"
      />

      <div className="max-w-4xl mx-auto rounded-lg shadow-md border overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">Fill in the Blanks Quiz</p>
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center px-2 py-1 bg-muted rounded-md">
                    <Timer className="w-4 h-4 text-primary mr-1.5" />
                    <span className="text-sm font-medium tabular-nums">
                      {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Time elapsed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="outline" size="sm" onClick={() => setShowGuidedHelp(true)}>
              <HelpCircle className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Help</span>
            </Button>
          </div>
        </header>
        <div className="px-6 py-4">
          {quizCompleted ? (
            isAuthenticated ? (
              <>
                <BlankQuizResults
                  answers={answers}
                  questions={quizData.questions}
                  onRestart={handleRestart}
                  onComplete={handleComplete}
                />
                {/* Show feedback when submission is successful */}
                {isSuccess && result && !isSubmitting && (
                  <QuizSubmissionFeedback
                    score={score || calculateScore()}
                    totalQuestions={quizData.questions.length}
                    isSubmitting={isSubmitting}
                    isSuccess={isSuccess}
                    isError={isError}
                    errorMessage={errorMessage}
                    onContinue={handleContinue}
                    quizType="fill-blanks"
                  />
                )}
              </>
            ) : (
              <div className="max-w-4xl mx-auto p-4">
                <h2 className="text-2xl font-bold mb-4">Quiz Completed</h2>
                <p className="mb-4">Sign in to view your results and save your progress.</p>
                <SignInPrompt callbackUrl={`/dashboard/blanks/${slug}`} />
              </div>
            )
          ) : (
            <FillInTheBlanksQuiz
              question={quizData.questions[currentQuestion]}
              questionNumber={currentQuestion + 1}
              totalQuestions={quizData.questions.length}
              onAnswer={handleAnswer}
            />
          )}
        </div>
      </div>
      {showGuidedHelp && <GuidedHelp onClose={handleCloseGuidedHelp} isOpen={false} />}
    </div>
  )
}

export default BlankQuizWrapper

