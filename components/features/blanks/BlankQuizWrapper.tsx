"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { AlertCircle, HelpCircle, Timer, CheckCircle, RotateCcw, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { useSession } from "next-auth/react"

import BlankQuizResults from "./BlankQuizResults"
import { FillInTheBlanksQuiz } from "./FillInTheBlanksQuiz"

import PageLoader from "@/components/ui/loader"
import { GuidedHelp } from "@/components/HelpModal"

import { SignInPrompt } from "@/components/SignInPrompt"
import { QuizActions } from "@/components/QuizActions"

import { type BlanksQuizAnswer, saveQuizResult } from "@/lib/quiz-result-service"

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

const MemoizedQuizActions = memo(QuizActions)

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

export default function BlankQuizWrapper({ slug }: { slug: string }) {
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<BlanksQuizAnswer[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const [score, setScore] = useState(false)
  const [showGuidedHelp, setShowGuidedHelp] = useState(false)

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
    }
  }, [])

  const handleComplete = useCallback(
    async (score: number) => {
      if (isAuthenticated && quizData) {
        try {
          setScore(true) // Show loading indicator
          await saveQuizResult({
            quizId: quizData.id,
            answers,
            totalTime: elapsedTime,
            elapsedTime,
            score,
            type: "fill-blanks",
          })
        } catch (error) {
          console.error("Error saving quiz results:", error)
        } finally {
          setScore(false) // Hide loading indicator regardless of success/failure
        }
      }
    },
    [isAuthenticated, quizData, answers, elapsedTime],
  )

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
    <>
      <div className="mb-6">
        <MemoizedQuizActions
          userId={session?.user?.id || ""}
          ownerId={quizData.userId}
          quizId={quizData.id.toString()}
          quizSlug={slug}
          quizType="blanks"
          initialIsPublic={false}
          initialIsFavorite={false}
          position="left-center"
        />
      </div>
      <div className="mb-8 max-w-4xl mx-auto rounded-lg shadow-md border overflow-hidden">
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
              <BlankQuizResults
                answers={answers}
                questions={quizData.questions}
                onRestart={handleRestart}
                onComplete={handleComplete}
              />
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Quiz Completed!</h3>
                <p className="mb-6 text-muted-foreground max-w-md mx-auto">
                  Sign in to see your results and save your progress.
                </p>
                <SignInPrompt callbackUrl={`/dashboard/blanks/${slug}`} />
              </div>
            )
          ) : quizData.questions.length > 0 ? (
            <FillInTheBlanksQuiz
              question={quizData.questions[currentQuestion]}
              onAnswer={handleAnswer}
              questionNumber={currentQuestion + 1}
              totalQuestions={quizData.questions.length}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No questions available for this quiz.</p>
            </div>
          )}
        </div>
      </div>
      <GuidedHelp isOpen={showGuidedHelp} onClose={handleCloseGuidedHelp} />
    </>
  )
}

