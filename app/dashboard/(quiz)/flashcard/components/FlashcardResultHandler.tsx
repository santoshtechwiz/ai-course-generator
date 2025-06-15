"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { useAppSelector, useAppDispatch } from "@/store"
import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import FlashCardResults from "./FlashCardQuizResults"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { setQuizResults } from "@/store/slices/flashcard-slice"
import SignInPrompt from "@/app/auth/signin/components/SignInPrompt"

interface FlashcardResultHandlerProps {
  slug: string
  title?: string
  onRestart?: () => void
  onReview?: (cards: number[]) => void
  onReviewStillLearning?: (cards: number[]) => void
  questions?: Array<{
    id: string | number
    question: string
    answer: string
  }>
}



export default function FlashcardResultHandler({
  slug,
  title,
  onRestart,
  onReview,
  onReviewStillLearning,
  questions = [],
}: FlashcardResultHandlerProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const dispatch = useAppDispatch()

  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  const [restoredResults, setRestoredResults] = useState<any>(null)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const hasRestoredRef = useRef(false)
  const hasSavedPendingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  // Get flashcard state from Redux
  const {
    isCompleted,
    answers,
    score,
    totalQuestions,
    correctAnswers,
    totalTime,
    quizId,
    results: storedResults,
    questions: storeQuestions,
  } = useAppSelector((state) => state.flashcard)

  // Process answers to get detailed counts including still_learning
  const processedResults = useMemo(() => {
    if (!answers || !Array.isArray(answers)) {
      return {
        correctCount: 0,
        stillLearningCount: 0,
        incorrectCount: 0,
        totalCount: 0,
        reviewCards: [],
        stillLearningCards: [],
      }
    }

    let correctCount = 0
    let stillLearningCount = 0
    let incorrectCount = 0
    const reviewCards: number[] = []
    const stillLearningCards: number[] = []

    answers.forEach((answer, index) => {
      if (answer && typeof answer.answer === "string") {
        switch (answer.answer) {
          case "correct":
            correctCount++
            break
          case "still_learning":
            stillLearningCount++
            stillLearningCards.push(index)
            break
          case "incorrect":
            incorrectCount++
            reviewCards.push(index)
            break
        }
      }
    })

    return {
      correctCount,
      stillLearningCount,
      incorrectCount,
      totalCount: correctCount + stillLearningCount + incorrectCount,
      reviewCards,
      stillLearningCards,
    }
  }, [answers])

  // Generate complete results object
  const completeResults = useMemo(() => {
    if (restoredResults) {
      return restoredResults
    }

    // Check if we have valid quiz completion data
    if (isCompleted && answers?.length > 0) {
      return {
        quizId,
        slug,
        title: title || "Flashcard Quiz",
        quizType: "flashcard",
        score: processedResults.correctCount,
        maxScore: processedResults.totalCount,
        percentage:
          processedResults.totalCount > 0
            ? Math.round((processedResults.correctCount / processedResults.totalCount) * 100)
            : 0,
        correctAnswers: processedResults.correctCount,
        stillLearningAnswers: processedResults.stillLearningCount,
        incorrectAnswers: processedResults.incorrectCount,
        totalQuestions: processedResults.totalCount,
        totalTime: totalTime || 0,
        completedAt: new Date().toISOString(),
        answers,
        questions: questions.length > 0 ? questions : storeQuestions,
        reviewCards: processedResults.reviewCards,
        stillLearningCards: processedResults.stillLearningCards,
      }
    }

    // Check if we have stored results
    if (storedResults) {
      return storedResults
    }

    return null
  }, [
    restoredResults,
    isCompleted,
    answers,
    quizId,
    slug,
    title,
    processedResults,
    totalTime,
    questions,
    storeQuestions,
    storedResults,
  ])

  // Handle sign-in process
  const handleSignIn = useCallback(async () => {
    if (completeResults && !hasSavedPendingRef.current) {
      try {
        // Save current results to both storages for reliability
        const pendingData = {
          slug,
          quizType: "flashcard",
          results: completeResults,
          timestamp: Date.now(),
          questions: questions.length > 0 ? questions : storeQuestions,
          title: completeResults.title,
        }

        localStorage.setItem("pendingQuizResults", JSON.stringify(pendingData))
        sessionStorage.setItem("pendingQuizResults", JSON.stringify(pendingData))
        hasSavedPendingRef.current = true
      } catch (error) {
        console.error("Failed to store pending results:", error)
      }
    }

    // Trigger sign-in with callback to current page
    await signIn(undefined, {
      callbackUrl: `/dashboard/flashcard/${slug}/results`,
    })
  }, [completeResults, slug, questions, storeQuestions])

  // Handle retake process
  const handleRetake = useCallback(() => {
    if (onRestart) {
      onRestart()
    } else {
      console.warn("No retake handler provided")
    }
  }, [onRestart])

  // Check for results and determine if we should redirect - only on initial load
  useEffect(() => {
    if (hasInitializedRef.current || status === "loading") return

    hasInitializedRef.current = true

    // Give a short delay to allow Redux state to hydrate
    const checkTimer = setTimeout(() => {
      // Check if we have any valid results
      const hasValidResults =
        (isCompleted && answers?.length > 0) || // Fresh completion
        storedResults || // Stored results in Redux
        restoredResults // Restored from storage

      // Check storage for pending results
      let hasStoredResults = false
      try {
        const sessionData = sessionStorage.getItem("pendingQuizResults")
        const localData = localStorage.getItem("pendingQuizResults")

        if (sessionData || localData) {
          const storedData = JSON.parse(sessionData || localData || "{}")
          if (storedData.slug === slug && storedData.quizType === "flashcard") {
            hasStoredResults = true
          }
        }
      } catch (error) {
        console.warn("Failed to check stored results:", error)
      }

      if (!hasValidResults && !hasStoredResults) {
        console.log("No valid results found, redirecting to quiz page")
        setShouldRedirect(true)
        router.replace(`/dashboard/flashcard/${slug}`)
      } else {
        setIsLoading(false)
      }
    }, 100)

    return () => clearTimeout(checkTimer)
  }, [status, isCompleted, answers, storedResults, restoredResults, slug, router])

  // Restore results after authentication
  useEffect(() => {
    if (status === "authenticated" && !hasRestoredRef.current) {
      try {
        // Try to restore from sessionStorage first, then localStorage
        let storedData = null

        try {
          const sessionData = sessionStorage.getItem("pendingQuizResults")
          if (sessionData) {
            storedData = JSON.parse(sessionData)
          }
        } catch (e) {
          console.warn("Failed to parse sessionStorage data:", e)
        }

        if (!storedData) {
          try {
            const localData = localStorage.getItem("pendingQuizResults")
            if (localData) {
              storedData = JSON.parse(localData)
            }
          } catch (e) {
            console.warn("Failed to parse localStorage data:", e)
          }
        }

        if (storedData && storedData.slug === slug && storedData.quizType === "flashcard") {
          // Restore the results
          setRestoredResults(storedData.results)

          // Store back into Redux for consistency
          dispatch(setQuizResults(storedData.results))

          // Clean up stored data
          try {
            localStorage.removeItem("pendingQuizResults")
            sessionStorage.removeItem("pendingQuizResults")
          } catch (error) {
            console.warn("Failed to clear stored data:", error)
          }

          hasRestoredRef.current = true
          setShowSignInPrompt(false)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error restoring results after auth:", error)
      }
    }
  }, [status, slug, dispatch])

  // Handle loading and authentication flow - STRICT AUTHENTICATION REQUIRED
  useEffect(() => {
    if (shouldRedirect) return

    if (status === "loading") {
      setIsLoading(true)
      return
    }

    // ONLY show results to authenticated users
    if (completeResults) {
      if (status === "unauthenticated") {
        // Always show sign-in prompt for unauthenticated users
        setIsLoading(false)
        setShowSignInPrompt(true)
      } else if (status === "authenticated") {
        // Only authenticated users see full results
        setIsLoading(false)
        setShowSignInPrompt(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [status, completeResults, shouldRedirect])

  // Enhanced review mode handlers with proper card mapping
  const handleReviewIncorrect = useCallback(() => {
    console.log("Review incorrect called", {
      reviewCards: processedResults.reviewCards,
      questions: questions.length > 0 ? questions : storeQuestions,
    })

    if (onReview && processedResults.reviewCards.length > 0) {
      // Pass the actual card indices that were marked as incorrect
      onReview(processedResults.reviewCards)
    } else {
      console.warn("No review handler or no incorrect cards to review")
    }
  }, [onReview, processedResults.reviewCards, questions, storeQuestions])

  const handleReviewStillLearningCards = useCallback(() => {
    console.log("Review still learning called", {
      stillLearningCards: processedResults.stillLearningCards,
      questions: questions.length > 0 ? questions : storeQuestions,
    })

    if (onReviewStillLearning && processedResults.stillLearningCards.length > 0) {
      // Pass the actual card indices that were marked as still learning
      onReviewStillLearning(processedResults.stillLearningCards)
    } else {
      console.warn("No review handler or no still learning cards to review")
    }
  }, [onReviewStillLearning, processedResults.stillLearningCards, questions, storeQuestions])

  // Show loading while session is loading or processing
  if (isLoading || status === "loading" || shouldRedirect) {
    return <QuizLoader message="Loading results..." subMessage="Please wait while we process your session" />
  }

  // ALWAYS show sign-in prompt for unauthenticated users with results
  if (status === "unauthenticated" && completeResults) {
    return (
      <AnimatePresence mode="wait">
        <SignInPrompt
          onSignIn={handleSignIn}
          onRetake={handleRetake}
          previewData={{
            correctAnswers: processedResults.correctCount,
            totalQuestions: processedResults.totalCount,
            stillLearningAnswers: processedResults.stillLearningCount,
            incorrectAnswers: processedResults.incorrectCount,
          }}
        />
      </AnimatePresence>
    )
  }

  // ONLY show full results for authenticated users
  if (status === "authenticated" && completeResults) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <FlashCardResults
            quizId={completeResults.quizId}
            slug={slug}
            title={completeResults.title}
            score={completeResults.score}
            totalQuestions={completeResults.totalQuestions}
            correctAnswers={completeResults.correctAnswers}
            stillLearningAnswers={completeResults.stillLearningAnswers}
            incorrectAnswers={completeResults.incorrectAnswers}
            totalTime={completeResults.totalTime}
            onRestart={handleRetake}
            onReview={handleReviewIncorrect}
            onReviewStillLearning={handleReviewStillLearningCards}
            reviewCards={completeResults.reviewCards}
            stillLearningCards={completeResults.stillLearningCards}
            answers={completeResults.answers}
            questions={completeResults.questions || questions}
          />
        </motion.div>
      </AnimatePresence>
    )
  }

  // For unauthenticated users without results, redirect to quiz
  if (status === "unauthenticated" && !completeResults) {
    router.replace(`/dashboard/flashcard/${slug}`)
    return <QuizLoader message="Redirecting to quiz..." subMessage="Authentication required" />
  }

  // Fallback: Still loading or no results
  return <QuizLoader message="Loading results..." subMessage="Preparing your flashcard results" />
}
