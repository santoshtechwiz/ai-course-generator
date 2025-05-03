"use client"

import { useRouter } from "next/navigation"
import { memo, useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"

import CodeQuizResult from "./CodeQuizResult"
import CodingQuiz from "./CodingQuiz"
import GuestSignInPrompt from "../../components/GuestSignInPrompt"
import { useQuiz } from "@/app/context/QuizContext"
import { ErrorDisplay, LoadingDisplay, InitializingDisplay, QuizNotFoundDisplay, EmptyQuestionsDisplay } from "@/app/dashboard/components/QuizStateDisplay"
import { CodeQuizContentProps, CodeQuizWrapperProps } from "@/app/types/code-quiz-types"
import { useToast } from "@/hooks"


// Memoize the content component to prevent unnecessary re-renders
export const CodeQuizContent = memo(function CodeQuizContent({ quizData, slug, userId, quizId }: CodeQuizContentProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const [startTime] = useState<number>(Date.now())
  const { toast } = useToast()

  // Use the quiz context for state management
  const {
    state: contextState,
    submitAnswer: submitQuizAnswer,
    completeQuiz,
    handleAuthenticationRequired,
    setAuthCheckComplete,
  } = useQuiz()

  // Get questions from props or context
  const quizQuestions = quizData?.questions || contextState?.questions || []

  // Initialize answers array on component mount
  useEffect(() => {
    if (quizQuestions && Array.isArray(quizQuestions) && quizQuestions.length > 0) {
      setAnswers(Array(quizQuestions.length).fill(null))
    }
  }, [quizQuestions])

  // Check if we should show results when state changes
  useEffect(() => {
    if (contextState.isCompleted && contextState.isAuthenticated) {
      setShowResults(true)
    }
  }, [contextState])

  // Check for URL parameters that indicate returning from auth
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth")

      if (fromAuth === "true" && contextState.isCompleted && contextState.pendingAuthRequired) {
        if (typeof setAuthCheckComplete === "function") {
          setAuthCheckComplete(true)
        }
        setShowResults(true)
      }
    }
  }, [contextState, setAuthCheckComplete])

  // Handle result saving notification
  useEffect(() => {
    if (contextState.isCompleted && contextState.isAuthenticated && !contextState.resultsSaved) {
      toast({
        title: "Quiz completed!",
        description: "Your results have been saved.",
      })
    }
  }, [contextState, toast])

  // Save quiz state to localStorage before redirecting to sign-in
  const saveQuizStateToLocalStorage = useCallback(() => {
    if (typeof window !== "undefined") {
      const stateToSave = {
        answers,
        currentQuestionIndex,
        quizId,
        slug,
        quizResults,
        completedAt: new Date().toISOString(),
      }
      localStorage.setItem(`code_quiz_state_${slug}`, JSON.stringify(stateToSave))
      console.log("Saved code quiz state to localStorage:", stateToSave)
    }
  }, [answers, currentQuestionIndex, quizId, slug, quizResults])

  // Restore quiz state from localStorage when returning from sign-in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth")

      if (fromAuth === "true") {
        try {
          const savedState = localStorage.getItem(`code_quiz_state_${slug}`)
          if (savedState) {
            console.log("Restoring code quiz state from localStorage")
            const parsedState = JSON.parse(savedState)

            // Restore answers and other state
            if (parsedState.answers) setAnswers(parsedState.answers)
            if (parsedState.quizResults) setQuizResults(parsedState.quizResults)
            if (parsedState.currentQuestionIndex) setCurrentQuestionIndex(parsedState.currentQuestionIndex)

            // If we had completed the quiz before auth, complete it again
            if (parsedState.quizResults && completeQuiz) {
              completeQuiz({
                answers: parsedState.answers,
                score: parsedState.quizResults.score,
                completedAt: parsedState.completedAt || new Date().toISOString(),
              })
              setShowResults(true)
            }

            // Clear the saved state after restoring
            localStorage.removeItem(`code_quiz_state_${slug}`)
          }
        } catch (err) {
          console.error("Error restoring code quiz state:", err)
        }
      }
    }
  }, [slug, completeQuiz])

  // Clear quiz state after results are saved to database
  useEffect(() => {
    if (contextState.resultsSaved && contextState.isAuthenticated) {
      // Wait a moment to ensure everything is processed
      const timer = setTimeout(() => {
        // Clear localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem(`code_quiz_state_${slug}`)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [contextState.resultsSaved, contextState.isAuthenticated, slug])

  // Get current question
  const currentQuestion = quizQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1

  // Handle answer selection
  const handleAnswer = useCallback(
    (selectedAnswer: string, timeSpent: number, isCorrect: boolean) => {
      try {
        if (isCompleting || !submitQuizAnswer) return

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
        submitQuizAnswer({
          answer: selectedAnswer,
          userAnswer: selectedAnswer,
          isCorrect,
          timeSpent,
          questionId: currentQuestion?.id || currentQuestionIndex,
          index: currentQuestionIndex,
        })

        // Move to the next question or complete the quiz
        if (isLastQuestion) {
          handleQuizCompletion(newAnswers)
        } else {
          setCurrentQuestionIndex((prev) => prev + 1)
        }
      } catch (err) {
        console.error("Error handling answer:", err)
        setError("Failed to process your answer. Please try again.")
      }
    },
    [isCompleting, submitQuizAnswer, currentQuestion, currentQuestionIndex, isLastQuestion, answers],
  )

  // Handle quiz completion
  const handleQuizCompletion = useCallback(
    async (finalAnswers: any[]) => {
      if (isCompleting || !completeQuiz) return

      setIsCompleting(true)

      try {
        const answersArray = Array.isArray(finalAnswers) ? finalAnswers : []

        // Calculate score
        const correctAnswers = answersArray.filter((a) => a && a.isCorrect).length
        const totalQuestions = quizQuestions?.length || 0
        const score = Math.round((correctAnswers / totalQuestions) * 100)

        // Calculate total time
        const totalTimeSpent = answersArray.reduce((total, answer) => total + (answer?.timeSpent || 0), 0)

        // Prepare result data
        const resultQuizId = quizId || contextState?.quizId || "test-quiz"
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
        await completeQuiz({
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
        })

        // If the user is authenticated, show results immediately
        if (contextState.isAuthenticated) {
          setShowResults(true)
        }
      } catch (err) {
        console.error("Error completing quiz:", err)
        setError("Failed to complete the quiz. Please try again.")
      } finally {
        setIsCompleting(false)
      }
    },
    [
      isCompleting,
      completeQuiz,
      quizQuestions,
      slug,
      startTime,
      contextState.isAuthenticated,
      quizId,
      contextState?.quizId,
    ],
  )

  // Handle continuing as guest
  const handleContinueAsGuest = useCallback(() => {
    setShowResults(true)
  }, [])

  // Handle sign in
  const handleSignIn = useCallback(() => {
    if (handleAuthenticationRequired) {
      // Save current quiz state before redirecting
      saveQuizStateToLocalStorage()

      // Redirect to sign-in
      handleAuthenticationRequired(`/dashboard/code/${slug}?fromAuth=true`)
    }
  }, [handleAuthenticationRequired, slug, saveQuizStateToLocalStorage])

  // If there's an error, show the error message
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  // If the quiz is completed and the user is not authenticated, show the guest sign-in prompt
  if (contextState.isCompleted && !contextState.isAuthenticated && !contextState.isProcessingAuth) {
    return (
      <GuestSignInPrompt
        onContinueAsGuest={handleContinueAsGuest}
        onSignIn={handleSignIn}
        quizType="code"
        showSaveMessage={true}
      />
    )
  }

  // If the quiz is completed and results are available, show the results
  if ((showResults && quizResults) || (contextState.isCompleted && contextState.isAuthenticated)) {
    return (
      <CodeQuizResult
        title={quizData?.title || "Code Quiz"}
        onRestart={() => window.location.reload()}
        quizId={quizId}
        questions={quizQuestions}
        answers={quizResults?.answers || contextState.answers || []}
        score={quizResults?.score || contextState.score || 0}
        isGuestMode={!contextState.isAuthenticated}
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
            {JSON.stringify(contextState, null, 2)}
          </pre>
        </div>
      )}

      <CodingQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={quizQuestions?.length || 0}
        isLastQuestion={isLastQuestion}
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

  // Validate quiz data and slug
  const validQuizId = quizId || ""
  const validSlug = slug && slug !== "unknown" ? slug : ""

  // Skip initialization delay in test environment
  useEffect(() => {
    // Prevent double initialization
    if (hasInitialized.current) return
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
  }, [])

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
