"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { memo, useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useDispatch } from "react-redux"

import CodeQuizResult from "./CodeQuizResult"
import CodingQuiz from "./CodingQuiz"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"
import {
  ErrorDisplay,
  LoadingDisplay,
  InitializingDisplay,
  QuizNotFoundDisplay,
  EmptyQuestionsDisplay,
} from "@/app/dashboard/components/QuizStateDisplay"
import type { CodeQuizContentProps, CodeQuizWrapperProps } from "@/app/types/code-quiz-types"
import { useToast } from "@/hooks"
import {  formatQuizTime, calculateTotalTime } from "@/lib/utils/quiz-index"
import { quizUtils } from "@/lib/utils/quiz-utils"
import { useAppSelector } from "@/store"
import { setRedirectUrl } from "@/store/slices/authSlice"
import { initQuiz, resetQuiz, setAuthCheckComplete, submitAnswer, completeQuiz, setPendingAuthRequired } from "@/store/slices/quizSlice"



// Memoize the content component to prevent unnecessary re-renders
export const CodeQuizContent = memo(function CodeQuizContent({ quizData, slug, userId, quizId }: CodeQuizContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const { data: session } = useSession()

  // Use Redux state directly
  const quizReduxState = useAppSelector((state) => state.quiz)
  const authReduxState = useAppSelector((state) => state.auth)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const [startTime] = useState<number>(Date.now())
  const { toast } = useToast()

  // Get questions from props or Redux state
  const quizQuestions = quizData?.questions || quizReduxState?.questions || []

  // Handle reset parameter in URL
  const isReset = searchParams.get("reset") === "true"

  // Initialize quiz in Redux when component mounts
  useEffect(() => {
    if (quizData && !isReset) {
      dispatch(
        initQuiz({
          id: quizData.id || quizId,
          slug,
          title: quizData.title || "Code Quiz",
          quizType: "code",
          questions: quizData.questions || [],
          requiresAuth: quizData.requiresAuth || false,
        }),
      )
    }
  }, [dispatch, quizData, quizId, slug, isReset])

  // Initialize answers array on component mount
  useEffect(() => {
    if (quizQuestions && Array.isArray(quizQuestions) && quizQuestions.length > 0) {
      setAnswers(Array(quizQuestions.length).fill(null))
    }
  }, [quizQuestions])

  // Check if we should show results when state changes
  useEffect(() => {
    if (quizReduxState.isCompleted && authReduxState.isAuthenticated && !isReset) {
      setShowResults(true)
    }
  }, [quizReduxState, authReduxState, isReset])

  // Handle reset parameter in URL
  useEffect(() => {
    if (isReset) {
      // Reset Redux state
      dispatch(resetQuiz())

      // Reset local state
      setCurrentQuestionIndex(0)
      setShowResults(false)
      setQuizResults(null)

      if (quizQuestions && Array.isArray(quizQuestions) && quizQuestions.length > 0) {
        setAnswers(Array(quizQuestions.length).fill(null))
      }

      // Remove the reset parameter from URL to prevent infinite resets
      const url = new URL(window.location.href)
      url.searchParams.delete("reset")
      url.searchParams.delete("t")
      window.history.replaceState({}, "", url)
    }
  }, [isReset, dispatch, quizQuestions])

  // Check for URL parameters that indicate returning from auth
  useEffect(() => {
    const fromAuth = searchParams.get("fromAuth")

    if (fromAuth === "true") {
      // Always set showResults to true when returning from auth
      setShowResults(true)

      // Call setAuthCheckComplete
      dispatch(setAuthCheckComplete(true))
    }
  }, [searchParams, dispatch])

  // Handle result saving notification
  useEffect(() => {
    if (quizReduxState.isCompleted && authReduxState.isAuthenticated && !quizReduxState.resultsSaved) {
      toast({
        title: "Quiz completed!",
        description: "Your results have been saved.",
      })
    }
  }, [quizReduxState, authReduxState, toast])

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("CodeQuizWrapper state:", {
        showResults,
        isCompleted: quizReduxState.isCompleted,
        isAuthenticated: authReduxState.isAuthenticated,
        pendingAuthRequired: quizReduxState.pendingAuthRequired,
        fromAuth: searchParams.get("fromAuth"),
        isReset,
      })
    }
  }, [quizReduxState, authReduxState, searchParams, showResults, isReset])

  // Get current question
  const currentQuestion = quizQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1

  // Handle answer selection
  const handleAnswer = useCallback(
    (selectedAnswer: string, timeSpent: number, isCorrect: boolean) => {
      try {
        if (isCompleting) return

        // Create answer object
        const answer = {
          questionId: currentQuestion?.id || currentQuestionIndex,
          question: currentQuestion?.question,
          answer: selectedAnswer,
          userAnswer: selectedAnswer,
          isCorrect,
          timeSpent,
          index: currentQuestionIndex,
          codeSnippet: selectedAnswer,
          language: currentQuestion?.language || "javascript",
        }

        // Update local state
        const newAnswers = [...answers]
        newAnswers[currentQuestionIndex] = answer
        setAnswers(newAnswers)

        // Submit answer to Redux
        dispatch(
          submitAnswer({
            answer: selectedAnswer,
            userAnswer: selectedAnswer,
            isCorrect,
            timeSpent,
            questionId: currentQuestion?.id || currentQuestionIndex,
            index: currentQuestionIndex,
          }),
        )

        // Move to the next question or complete the quiz
        if (isLastQuestion) {
          handleQuizCompletion(newAnswers)
        } else {
          setCurrentQuestionIndex((prev) => prev + 1)
        }
      } catch (err) {
        console.error("Error handling answer:", err)
      }
    },
    [isCompleting, dispatch, currentQuestion, currentQuestionIndex, isLastQuestion, answers],
  )

  // Handle quiz completion
  const handleQuizCompletion = useCallback(
    async (finalAnswers: any[]) => {
      if (isCompleting) return

      setIsCompleting(true)

      try {
        const answersArray = Array.isArray(finalAnswers) ? finalAnswers : []

        // Calculate score
        const correctAnswers = answersArray.filter((a) => a && a.isCorrect).length
        const totalQuestions = quizQuestions?.length || 0
        const score = quizUtils.calculateScore
          ? quizUtils.calculateScore(
              answersArray.map((a) =>
                a
                  ? {
                      answer: a.answer,
                      isCorrect: a.isCorrect,
                      timeSpent: a.timeSpent,
                    }
                  : { answer: "", isCorrect: false, timeSpent: 0 },
              ),
              "code",
            )
          : Math.round((correctAnswers / totalQuestions) * 100)

        // Calculate total time
        const totalTimeSpent = calculateTotalTime(answersArray.filter(Boolean))
        const formattedTimeSpent = formatQuizTime(totalTimeSpent)

        // Prepare result data
        const resultQuizId = quizId || quizReduxState?.quizId || "test-quiz"
        const quizResult = {
          quizId: resultQuizId,
          slug,
          answers: answersArray,
          score,
          totalQuestions,
          correctAnswers,
          totalTimeSpent,
          completedAt: new Date().toISOString(),
          elapsedTime: Math.floor((Date.now() - startTime) / 1000),
        }

        setQuizResults(quizResult)

        // Complete the quiz in Redux
        dispatch(
          completeQuiz({
            answers: answersArray.map((a) =>
              a
                ? {
                    answer: a.answer,
                    userAnswer: a.userAnswer,
                    isCorrect: a.isCorrect,
                    timeSpent: a.timeSpent,
                    questionId: a.questionId,
                    codeSnippet: a.codeSnippet,
                    language: a.language,
                  }
                : null,
            ),
            score,
            completedAt: new Date().toISOString(),
          }),
        )

        // If the user is authenticated, show results immediately
        if (authReduxState.isAuthenticated) {
          setShowResults(true)
        }
      } catch (err) {
        console.error("Error completing quiz:", err)
      } finally {
        setIsCompleting(false)
      }
    },
    [
      isCompleting,
      dispatch,
      quizQuestions,
      slug,
      startTime,
      authReduxState.isAuthenticated,
      quizId,
      quizReduxState?.quizId,
    ],
  )

  // Handle continuing as guest
  const handleContinueAsGuest = useCallback(() => {
    setShowResults(true)
  }, [])

  // Handle sign in
  const handleSignIn = useCallback(() => {
    // Set redirect URL in Redux
    dispatch(setRedirectUrl(`/dashboard/code/${slug}?fromAuth=true`))

    // Set pending auth required
    dispatch(setPendingAuthRequired(true))

    // Redirect to sign-in page
    router.push("/auth/signin")
  }, [dispatch, router, slug])

  // If there's an error in the Redux state, show the error message
  if (quizReduxState.error) {
    return (
      <ErrorDisplay
        error={quizReduxState.error}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  // If the quiz is completed and the user is not authenticated, show the non-authenticated user sign-in prompt
  if (quizReduxState.isCompleted && !authReduxState.isAuthenticated && !authReduxState.isProcessingAuth) {
    return (
      <NonAuthenticatedUserSignInPrompt onSignIn={function (): void {
        throw new Error("Function not implemented.")
      } } onContinueAsNonAuthenticatedUser={function (): void {
        throw new Error("Function not implemented.")
      } }      
     
      />
    )
  }

  // If the quiz is completed and results are available, show the results
  if ((showResults || quizReduxState.isCompleted) && !isReset) {
    return (
      <CodeQuizResult
        result={{
          quizId: quizId || quizReduxState?.quizId || "test-quiz",
          slug,
          score: quizResults?.score || quizReduxState.score || 0,
          totalQuestions: quizQuestions?.length || 0,
          correctAnswers: (quizResults?.answers || quizReduxState.answers || []).filter((a: any) => a && a.isCorrect)
            .length,
          totalTimeSpent: quizResults?.totalTimeSpent || calculateTotalTime(quizReduxState.answers || []),
          completedAt: quizResults?.completedAt || quizReduxState.completedAt || new Date().toISOString(),
          answers: quizResults?.answers || quizReduxState.answers || [],
        }}
      />
    )
  }

  // If there's no current question and we're not showing results, show a loading indicator
  if (!currentQuestion && !showResults) {
    return <LoadingDisplay />
  }

  // Otherwise, show the quiz
  return (
    <div className="space-y-6">
      {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEBUG_MODE === "true" && (
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-md">
          <h3 className="text-sm text-slate-700">Quiz State Debug</h3>
          <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60 mt-2">
            {JSON.stringify(quizReduxState, null, 2)}
          </pre>
        </div>
      )}

      <CodingQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={quizQuestions?.length || 0}
        isLastQuestion={isLastQuestion}
        key={`question-${currentQuestionIndex}-${isReset ? "reset" : "normal"}`}
      />

      {isCompleting && (
        <div className="p-4 mt-4 border rounded-md">
          <div className="flex items-center justify-center">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
            <p>Submitting your answers...</p>
          </div>
        </div>
      )}
    </div>
  )
})

export default function CodeQuizWrapper({
  quizData,
  slug,
  userId,
  quizId,
  isPublic,
  isFavorite,
  ownerId,
}: CodeQuizWrapperProps) {
  const [isInitializing, setIsInitializing] = useState(true)
  const router = useRouter()
  const hasInitialized = useRef(false)
  const searchParams = useSearchParams()
  const isReset = searchParams.get("reset") === "true"

  // Validate quiz data and slug
  const validQuizId = quizId || ""
  const validSlug = slug && slug !== "unknown" ? slug : ""

  // Skip initialization delay in test environment
  useEffect(() => {
    // Prevent double initialization
    if (hasInitialized.current && !isReset) return
    hasInitialized.current = true

    // Skip delay in test environment
    if (process.env.NODE_ENV === "test") {
      setIsInitializing(false)
      return
    }

    // Short delay to allow state to initialize
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [isReset])

  // Show loading state during initialization
  if (isInitializing) {
    return <InitializingDisplay />
  }

  // Error state if quiz data is invalid
  if (!validQuizId || !validSlug) {
    return <QuizNotFoundDisplay onReturn={() => router.push("/dashboard/quizzes")} />
  }

  // Early return for empty questions
  if (!quizData?.questions || quizData.questions.length === 0) {
    return <EmptyQuestionsDisplay onReturn={() => router.push("/dashboard/quizzes")} />
  }

  return <CodeQuizContent quizData={quizData} slug={validSlug} userId={userId} quizId={validQuizId} />
}
