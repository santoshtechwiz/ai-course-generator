"use client"

import type React from "react"
import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import {
  resetQuiz,
  setQuizResults,
  selectQuizResults,
  selectQuizStatus,
  selectOrGenerateQuizResults,
  selectQuizId,
  hydrateStateFromStorage,
  setQuiz,
  selectQuestions,
  selectIsQuizComplete,
  saveQuizResultsToDatabase,
  selectIsProcessingResults,
  selectAnswers,
  selectQuizTitle,
  clearQuizState,
} from "@/store/slices/quiz-slice"
import { Button } from "@/components/ui/button"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { useSessionService } from "@/hooks/useSessionService"
import type { QuizType } from "@/types/quiz"
import { AnimatePresence, motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { NoResults } from "@/components/ui/no-results"
import { RefreshCw } from "lucide-react"

interface SignInPromptProps {
  onSignIn: () => void
  onRetake: () => void
  quizType: QuizType
  previewData?: { percentage: number; score: number; maxScore: number }
}

const GenericSignInPrompt: React.FC<SignInPromptProps> = ({ onSignIn, onRetake, quizType, previewData }) => (
  <div className="flex flex-col items-center justify-center gap-6 p-8 text-center max-w-md mx-auto">
    <h2 className="text-2xl font-bold">Quiz Complete!</h2>
    <p className="text-gray-600">Sign in to save your progress and view detailed results.</p>
    {previewData && (
      <div className="bg-gray-50 p-4 rounded text-center">
        <div className="text-3xl font-bold text-blue-600">{previewData.percentage}%</div>
        <p>
          {previewData.score} out of {previewData.maxScore} correct
        </p>
      </div>
    )}
    <Button onClick={onSignIn} className="w-full">
      Sign In
    </Button>
    <Button onClick={onRetake} variant="outline" className="w-full">
      Retake Quiz
    </Button>
  </div>
)

interface Props {
  slug: string
  quizType: QuizType
  children: (props: { result: any }) => React.ReactNode
}

type ViewState = "loading" | "show_results" | "show_signin" | "no_results" | "error"

export default function GenericQuizResultHandler({ slug, quizType, children }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  const { isAuthenticated, isLoading: isSessionLoading, signIn } = useSessionService()

  // Redux selectors
  const quizResults = useSelector(selectQuizResults)
  const generatedResults = useSelector(selectOrGenerateQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const currentSlug = useSelector(selectQuizId)
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)
  const isProcessingResults = useSelector(selectIsProcessingResults)

  // Normalize the slug value once
  const normalizedSlug = useMemo(() => slug, [slug, currentSlug])

  // Single view state to prevent flickering
  const [viewState, setViewState] = useState<ViewState>("loading")
  const [isInitialized, setIsInitialized] = useState(false)

  // Memoize the current result to prevent unnecessary re-renders
  const currentResult = useMemo(() => quizResults || generatedResults, [quizResults, generatedResults])

  // Handle retake action
  const handleRetake = useCallback(() => {
    dispatch(clearQuizState()); // Use clearQuizState to reset the state completely
    setViewState("loading"); // Reset view state to prevent flickering
    router.push(`/dashboard/${quizType}/${normalizedSlug}`); // Redirect to the quiz page
  }, [dispatch, router, quizType, normalizedSlug])

  // Handle sign in action
  const handleSignIn = useCallback(async () => {
    if (currentResult) {
      try {
        const storeData = {
          slug: normalizedSlug,
          quizType,
          results: currentResult,
          timestamp: Date.now(),
          questions: questions,
          title: currentResult.title || `${quizType.toUpperCase()} Quiz`,
        }

        localStorage.setItem("pendingQuizResults", JSON.stringify(storeData))
        sessionStorage.setItem("pendingQuizResults", JSON.stringify(storeData))
      } catch (error) {
        console.error("Failed to store quiz results before auth:", error)
      }
    }

    await signIn({
      returnPath: `/dashboard/${quizType}/${normalizedSlug}/results`,
      quizState: { slug: normalizedSlug, results: currentResult },
    })
  }, [currentResult, normalizedSlug, quizType, questions, signIn])

  // Generate results from state if needed
  const generateResultsFromState = useCallback(() => {
    if (!questions.length || !Object.keys(answers).length) {
      return null
    }

    let score = 0
    const questionResults = questions.map((question) => {
      const qid = String(question.id)
      const answer = answers[qid]

      if (!answer) {
        return {
          questionId: qid,
          question: question.question || question.text,
          correctAnswer: question.answer || question.correctAnswer || "",
          userAnswer: "",
          isCorrect: false,
          type: question.type || quizType,
        }
      }

      let isCorrect = false
      let userAnswer = ""

      switch (question.type || quizType) {
        case "mcq":
        case "code":
          userAnswer = answer.selectedOptionId || answer.userAnswer || ""
          isCorrect = answer.isCorrect === true
          break
        case "blanks":
          userAnswer = answer.userAnswer || answer.text || ""
          isCorrect = answer.isCorrect === true
          break
        case "openended":
          userAnswer = answer.text || answer.userAnswer || ""
          isCorrect = answer.isCorrect === true
          break
        default:
          userAnswer = answer.userAnswer || answer.text || ""
          isCorrect = answer.isCorrect === true
      }

      if (isCorrect) score++

      return {
        questionId: qid,
        question: question.question || question.text,
        correctAnswer: question.answer || question.correctAnswer || "",
        userAnswer,
        isCorrect,
        type: question.type || quizType,
      }
    })

    const percentage = Math.round((score / questions.length) * 100)

    const results = {
      quizId: normalizedSlug,
      slug: normalizedSlug,
      title: quizTitle || `${quizType.toUpperCase()} Quiz`,
      quizType,
      score,
      maxScore: questions.length,
      percentage,
      completedAt: new Date().toISOString(),
      questionResults,
      questions: questionResults,
    }

    // Store the generated results
    dispatch(setQuizResults(results))
    return results
  }, [questions, answers, quizType, normalizedSlug, quizTitle, dispatch])

  // Initialize and restore state
  useEffect(() => {
    if (isInitialized || isSessionLoading) return

    dispatch(hydrateStateFromStorage())

    setIsInitialized(true)
  }, [isSessionLoading, dispatch, isInitialized])

  // Determine view state based on current conditions
  useEffect(() => {
    if (!isInitialized || isSessionLoading) {
      setViewState("loading")
      return
    }

    if (currentResult) {
      setViewState(isAuthenticated ? "show_results" : "show_signin")
      return
    }

    if (isProcessingResults) {
      setViewState("loading")
      return
    }

    if (isCompleted && questions.length > 0 && Object.keys(answers).length > 0) {
      const generated = generateResultsFromState()
      if (generated) {
        setViewState(isAuthenticated ? "show_results" : "show_signin")
        return
      }
    }

    setViewState("no_results")
  }, [isInitialized, isSessionLoading, currentResult, isAuthenticated, isProcessingResults, isCompleted, questions.length, answers, generateResultsFromState])

  // Show loading state
  if (viewState === "loading") {
    return <QuizLoader message="Loading quiz results..." subMessage="Please wait" showTiming={true} />
  }

  // Render based on view state
  return (
    <AnimatePresence mode="wait">
      {viewState === "show_signin" && (
        <motion.div
          key="signin"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GenericSignInPrompt
            onSignIn={handleSignIn}
            onRetake={handleRetake}
            quizType={quizType}
            previewData={
              currentResult
                ? {
                    percentage: currentResult.percentage || 0,
                    score: currentResult.score || currentResult.userScore || 0,
                    maxScore: currentResult.maxScore || 0,
                  }
                : undefined
            }
          />
        </motion.div>
      )}

      {viewState === "show_results" && currentResult && (
        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          {children({ result: currentResult })}
        </motion.div>
      )}

      {viewState === "no_results" && (
        <motion.div
          key="no-results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <NoResults
            variant="quiz"
            title="No Results Found"
            description="Try retaking the quiz to view results."
            action={{
              label: "Retake Quiz",
              onClick: handleRetake,
              icon: <RefreshCw className="h-4 w-4" />,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Simplified QuizResultHandler for handling quiz completion and saving
export function QuizResultHandler({
  slug,
  quizType,
  onComplete,
}: {
  slug: string
  quizType: string
  onComplete?: (results: any) => void
}) {
  const { data: session, status: authStatus } = useSession()
  const isAuthenticated = authStatus === "authenticated"
  const router = useRouter()
  const dispatch = useDispatch()
  const results = useSelector(selectQuizResults)
  const isCompleted = useSelector(selectIsQuizComplete)

  // Track if we've already redirected to prevent loops
  const [hasRedirected, setHasRedirected] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)

  // Handle quiz completion and result saving - with flags to prevent loops
  useEffect(() => {
    if (isCompleted && results && isAuthenticated && !hasSaved) {
      setHasSaved(true)

      dispatch(saveQuizResultsToDatabase({ slug, quizType }) as any)
        .unwrap()
        .then(() => {
          const pathname = window.location.pathname
          if (!pathname.includes("/results")) {
          }

          if (onComplete) {
            onComplete(results)
          }
        })
        .catch((error: any) => {
          console.error("Failed to save quiz results:", error)
        })
    }
  }, [isCompleted, results, isAuthenticated, slug, quizType, dispatch, onComplete, hasSaved])

  // Redirect to results page if quiz is completed - with flag to prevent loops
  useEffect(() => {
    if (isCompleted && results && !hasRedirected) {
      const pathname = window.location.pathname
      if (!pathname.includes("/results")) {
        setHasRedirected(true)
        router.push(`/dashboard/${quizType}/${slug}/results`)
      }
    }
  }, [isCompleted, results, router, quizType, slug, hasRedirected])

  return null
}
