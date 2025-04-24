"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { quizStorageService } from "@/lib/quiz-storage-service"

import McqQuiz from "./McqQuiz"
import QuizAuthWrapper from "../../components/QuizAuthWrapper"
import { QuizFeedback } from "../../components/QuizFeedback"
import McqQuizResult from "./McqQuizResult"
import { quizService } from "@/lib/QuizService" // Import QuizService
import { useQuiz } from "@/app/context/QuizContext"

interface McqQuizWrapperProps {
  quizData: any
  slug: string
  userId: string
}

export default function McqQuizWrapper({ quizData, slug, userId }: McqQuizWrapperProps) {
  // All hooks must be called unconditionally at the top level
  const { data: session, status } = useSession()
  const router = useRouter()
  const { saveQuizState, saveGuestResult } = useQuiz()

  // State variables
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ answer: string; timeSpent: number; isCorrect: boolean }[]>([])
  const [startTime, setStartTime] = useState(Date.now())
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [hasCleared, setHasCleared] = useState(false)

  // Refs
  const submissionInProgress = useRef(false)
  const hasInitialized = useRef(false)

  // Derived state
  const isLoggedIn = status === "authenticated"
  const quizId = quizData?.id || ""
  const questions = quizData?.questions || []
  const currentQuestionData = questions[currentQuestion] || null
  const totalQuestions = questions?.length || 0

  // Initialize quiz state
  useEffect(() => {
    const initializeQuiz = async () => {
      if (status === "loading" || hasInitialized.current) return

      setIsLoading(true)
      hasInitialized.current = true

      try {
        // Check if quiz data is valid
        if (!quizData) {
          console.error("Quiz data is missing entirely")
          setError("Quiz data could not be loaded. Please try again later.")
          setIsLoading(false)
          return
        }

        if (!questions || !Array.isArray(questions)) {
          console.error("Quiz questions are missing or not an array:", quizData)
          setError("This quiz has no questions. Please try another quiz or create a new one.")
          setIsLoading(false)
          return
        }

        if (questions.length === 0) {
          console.error("Quiz has 0 questions")
          setError("This quiz has no questions. Please try another quiz or create a new one.")
          setIsLoading(false)
          return
        }

        // Check URL parameters first - this takes precedence
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search)
          const hasCompletedParam = urlParams.get("completed") === "true"

          console.log("URL params check - completed:", hasCompletedParam)

          if (hasCompletedParam) {
            console.log("Detected completed=true in URL, showing results")

            // Check for saved result to get the score and answers
            const savedResult = quizService.getQuizResult(quizId)

            if (savedResult) {
              console.log("Found saved result:", savedResult)
              setAnswers(savedResult.answers || [])
              setQuizScore(savedResult.score || 0)
            } else {
              console.log("No saved result found, using default score")
              // If no saved result but completed=true, set a default score
              const defaultScore = 70 // Default score if none found
              setQuizScore(defaultScore)
            }

            setIsCompleted(true)
            setIsLoading(false)
            return
          }

          // If not completed via URL, check for saved result
          const savedResult = quizService.getQuizResult(quizId)

          if (savedResult && savedResult.isCompleted) {
            console.log("Found completed saved result:", savedResult)
            setAnswers(savedResult.answers || [])
            setQuizScore(savedResult.score || 0)
            setIsCompleted(true)
            setIsLoading(false)
            return
          }

          // Check for saved answers if not completed
          const savedAnswers = quizStorageService.getQuizAnswers(quizId)
          if (savedAnswers && savedAnswers.length > 0) {
            console.log("Found saved answers:", savedAnswers)
            setAnswers(savedAnswers)
          }

          // Check for saved state in session storage
          const savedState = quizService.getQuizState(quizId, "mcq")
          if (savedState && savedState.quizId === quizId && savedState.quizType === "mcq") {
            console.log("Found saved quiz state:", savedState)

            if (savedState.isCompleted) {
              console.log("Saved state indicates quiz is completed")
              setIsCompleted(true)

              if (savedState.answers) {
                setAnswers(savedState.answers)
              }

              // Redirect to the completed URL if not already there
              if (!hasCompletedParam) {
                console.log("Redirecting to completed URL")
                router.replace(`/dashboard/mcq/${slug}?completed=true`)
                return
              }
            } else {
              // Not completed, restore state
              setCurrentQuestion(savedState.currentQuestion || 0)
              setStartTime(savedState.startTime || Date.now())

              if (savedState.answers) {
                setAnswers(savedState.answers)
              }
            }

            // Clear saved state
            quizService.clearQuizState(quizId, "mcq")
          }
        }
      } catch (err) {
        console.error("Error initializing quiz:", err)
        setError("Failed to initialize quiz. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    initializeQuiz()
  }, [quizId, status, quizData, questions, router, slug, saveQuizState])

  // Save answers when they change
  useEffect(() => {
    if (answers.length > 0 && quizId) {
      quizStorageService.saveQuizAnswers(quizId, answers)
    }
  }, [answers, quizId])

  // Save state before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isCompleted && answers.length > 0 && quizId) {
        saveQuizState({
          quizId,
          quizType: "mcq",
          slug,
          currentQuestion,
          totalQuestions,
          startTime,
          isCompleted,
          answers,
        })
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [answers, currentQuestion, isCompleted, quizId, totalQuestions, slug, startTime, saveQuizState])

  // Complete quiz function
  const completeQuiz = useCallback(
    (finalAnswers: typeof answers) => {
      if (submissionInProgress.current) return
      submissionInProgress.current = true

      setIsSubmitting(true)
      setError(null)

      try {
        // Calculate score based on correct answers
        const validAnswers = finalAnswers.filter((a) => a !== null && a !== undefined)
        const correctCount = validAnswers.filter((a) => a && a.isCorrect).length

        // Calculate percentage based on valid answers
        const score = Math.round((correctCount / Math.max(1, validAnswers.length)) * 100)

        console.log("Quiz completed:", {
          totalAnswers: validAnswers.length,
          correctAnswers: correctCount,
          score: score,
        })

        setQuizScore(score)

        // Create result object
        const result = {
          quizId,
          slug,
          quizType: "mcq",
          score,
          answers: finalAnswers,
          totalTime: (Date.now() - startTime) / 1000,
          timestamp: Date.now(),
          isCompleted: true,
        }

        // Check if we've already saved this result
        const alreadySaved = typeof window !== "undefined" && localStorage.getItem(`quiz_${quizId}_saved`) === "true"

        // Only save if not already saved
        if (!alreadySaved) {
          // Save to localStorage
          quizService.saveQuizResult(result)

          // If not logged in, save to guest storage
          if (!isLoggedIn) {
            // Always use the slug for the redirect path, never the numeric ID
            const dashboardPath = `/dashboard/mcq/${slug}?completed=true`
            console.log("Setting redirect path with slug:", dashboardPath)

            saveGuestResult({
              ...result,
              redirectPath: dashboardPath,
            })

            saveQuizState({
              quizId,
              quizType: "mcq",
              slug,
              currentQuestion,
              totalQuestions,
              startTime,
              isCompleted: true,
              answers: finalAnswers,
              redirectPath: dashboardPath,
            })
          }
        }

        setIsSuccess(true)
        setShowFeedback(true)
      } catch (err) {
        console.error("Error completing quiz:", err)
        setError("Failed to complete quiz. Please try again.")
        setIsSuccess(false)
      } finally {
        setIsSubmitting(false)
        submissionInProgress.current = false
      }
    },
    [quizId, slug, startTime, isLoggedIn, saveGuestResult, saveQuizState],
  )

  // Handle answer submission
  const handleAnswer = useCallback(
    (answer: string, timeSpent: number, isCorrect: boolean) => {
      console.log("Answer submitted:", { answer, timeSpent, isCorrect, currentQuestion, totalQuestions })

      // Update the answers array with the new answer
      setAnswers((prev) => {
        const newAnswers = [...prev]
        newAnswers[currentQuestion] = { answer, timeSpent, isCorrect }
        return newAnswers
      })

      // Check if this is the last question
      if (currentQuestion >= totalQuestions - 1) {
        console.log("Last question answered, completing quiz")
        // Last question, complete quiz after a small delay to ensure the answer is saved
        setTimeout(() => {
          // We need to include the current answer in the final submission
          setAnswers((prev) => {
            const finalAnswers = [...prev]
            finalAnswers[currentQuestion] = { answer, timeSpent, isCorrect }
            completeQuiz(finalAnswers)
            return finalAnswers
          })
        }, 100)
      } else {
        console.log("Moving to next question:", currentQuestion + 1)
        // Not the last question, move to the next one
        setCurrentQuestion((prev) => prev + 1)
        setStartTime(Date.now()) // Reset timer for the next question
      }
    },
    [currentQuestion, totalQuestions, completeQuiz],
  )

  // Handle quiz restart
  const handleRestart = useCallback(() => {
    setCurrentQuestion(0)
    setAnswers([])
    setStartTime(Date.now())
    setQuizScore(0)
    setError(null)
    setIsCompleted(false)
    setShowFeedback(false)

    // Clear saved state
    quizService.clearQuizState(quizId, "mcq")

    router.refresh()
  }, [router, quizId])

  // Handle feedback continue
  const handleFeedbackContinue = useCallback((proceed: boolean) => {
    setShowFeedback(false)
    if (proceed) {
      setIsCompleted(true)
    }
  }, [])

  // Handle auth modal
  const handleOpenAuthModal = useCallback(() => {
    setShowAuthModal(true)
  }, [])

  const handleAuthModalClose = useCallback(() => {
    setShowAuthModal(false)
  }, [])

  // Render content based on state
  let content

  if (isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading quiz data...</p>
      </div>
    )
  } else if (error) {
    content = (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading quiz</AlertTitle>
        <AlertDescription>
          {error || "We couldn't load the quiz data. Please try again later."}
          <div className="mt-4">
            <Button onClick={() => router.push("/dashboard/mcq")}>Return to Quiz Creator</Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  } else if (!questions || questions.length === 0) {
    content = (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">No questions available for this quiz.</p>
          <p className="text-sm text-muted-foreground mb-6">
            This could be because the quiz is still being generated or there was an error during creation.
          </p>
          <Button onClick={() => router.push("/dashboard/mcq")} className="mt-4">
            Return to Quiz Creator
          </Button>
        </CardContent>
      </Card>
    )
  } else if (!currentQuestionData && !isCompleted) {
    content = (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            {questions.length === 0 ? "No questions available for this quiz." : "Failed to load the current question."}
          </p>
          <Button onClick={() => router.push("/dashboard/mcq")} className="mt-4">
            Return to Quiz Creator
          </Button>
        </CardContent>
      </Card>
    )
  } else if (isCompleted) {
    content = (
      <McqQuizResult
        quizId={quizId}
        slug={slug}
        title={quizData?.title || "Quiz"}
        answers={answers}
        totalQuestions={totalQuestions}
        startTime={startTime}
        score={quizScore}
        onRestart={handleRestart}
        onSignIn={handleOpenAuthModal}
      />
    )
  } else {
    content = (
      <motion.div
        key="quiz"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <McqQuiz
          question={currentQuestionData}
          onAnswer={handleAnswer}
          questionNumber={currentQuestion + 1}
          totalQuestions={totalQuestions}
        />
      </motion.div>
    )
  }

  // Main render - single return statement
  return (
    <QuizAuthWrapper
      quizState={{
        quizId,
        quizType: "mcq",
        quizSlug: slug,
        currentQuestion,
        totalQuestions,
        startTime,
        isCompleted,
      }}
      answers={answers}
      redirectPath={`/dashboard/mcq/${slug}?completed=true`}
      showAuthModal={showAuthModal}
      onAuthModalClose={handleAuthModalClose}
    >
      <div className="w-full max-w-3xl mx-auto p-4">
        {content}

        {showFeedback && (
          <QuizFeedback
            isSubmitting={isSubmitting}
            isSuccess={isSuccess}
            isError={!!error}
            score={quizScore}
            totalQuestions={100}
            onContinue={handleFeedbackContinue}
            quizType="mcq"
            waitForSave={true}
            autoClose={false}
          />
        )}
      </div>
    </QuizAuthWrapper>
  )
}
