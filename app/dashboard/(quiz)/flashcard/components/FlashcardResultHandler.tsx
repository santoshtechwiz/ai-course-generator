'use client'

import { useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  clearQuizState,
  selectIsQuizComplete,
  selectFlashcardState,
  selectProcessedResults,
  checkAuthAndLoadResults,
} from "@/store/slices/flashcard-slice"
import { useAuth } from '@/hooks/use-auth'
import { AnimatePresence, motion } from "framer-motion"
import { QuizLoader } from "@/components/ui/quiz-loader"
import FlashCardResults from "./FlashCardQuizResults"
import { Button } from "@/components/ui/button"
import SignInPrompt from "@/app/auth/signin/components/SignInPrompt"

interface FlashcardResultHandlerProps {
  slug: string
  title?: string
  onRestart?: () => void
  onReview?: (cards: number[]) => void
  onReviewStillLearning?: (cards: number[]) => void
}

export default function FlashcardResultHandler({
  slug,
  title,
  onRestart,
  onReview,
  onReviewStillLearning,
}: FlashcardResultHandlerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { isAuthenticated, isInitialized, isLoading: isAuthLoading } = useAuth()

  const {
    shouldRedirectToResults,
    isLoading,
    error: stateError,
  } = useAppSelector(selectFlashcardState)

  const isCompleted = useAppSelector(selectIsQuizComplete)
  const processedResults = useAppSelector(selectProcessedResults)

  const isOnResultsPage = pathname?.endsWith('/results')

  // ✅ Only load results on results page
  useEffect(() => {
    if (!slug || !isInitialized || !isOnResultsPage) return
    dispatch(checkAuthAndLoadResults())
  }, [dispatch, slug, isInitialized, isOnResultsPage])

  const handleRestart = useCallback(() => {
    dispatch(clearQuizState())
    onRestart?.()
  }, [dispatch, onRestart])

  const handleReview = useCallback(() => {
    if (!processedResults?.reviewCards) return
    onReview?.(processedResults.reviewCards)
  }, [processedResults?.reviewCards, onReview])

  const handleReviewStillLearning = useCallback(() => {
    if (!processedResults?.stillLearningCards) return 
    onReviewStillLearning?.(processedResults.stillLearningCards)
  }, [processedResults?.stillLearningCards, onReviewStillLearning])

  // ✅ No localStorage – just redirect with state
  const signIn = useCallback(() => {
    router.push(`/auth/signin?redirect=${window.location.pathname}`)
  }, [router])

  // Loading state
  if (isAuthLoading || (isLoading && isOnResultsPage) || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <QuizLoader />
      </div>
    )
  }

  // Not signed in
  if (!isAuthenticated) {
    return (
      <SignInPrompt
        onSignIn={signIn}
        onRetake={handleRestart}
        quizType="flashcard"
        previewData={{
          correctAnswers: processedResults?.correctAnswers ?? 0,
          totalQuestions: processedResults?.totalQuestions ?? 0,
          stillLearningAnswers: processedResults?.stillLearningAnswers ?? 0,
          incorrectAnswers: processedResults?.incorrectAnswers ?? 0,
        }}
      />
    )
  }

  // Error state
  if (stateError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-xl text-red-500">{stateError}</div>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  // ✅ Only redirect to play if not completed, not on results
  const shouldAutoRedirect = !isCompleted && !isOnResultsPage && shouldRedirectToResults
  if (shouldAutoRedirect) {
    router.replace(`/dashboard/flashcard/${slug}`)
    return null
  }

  if (!processedResults && isOnResultsPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <p>No results found</p>
        <Button onClick={handleRestart}>Start Quiz</Button>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <FlashCardResults
          slug={slug}
          title={title}
          quizId={processedResults?.quizId}
          score={processedResults?.percentage}
          totalQuestions={processedResults?.totalQuestions}
          correctAnswers={processedResults?.correctAnswers}
          stillLearningAnswers={processedResults?.stillLearningAnswers}
          incorrectAnswers={processedResults?.incorrectAnswers}
          totalTime={processedResults?.totalTime}
       
        
          onRestart={handleRestart}
        
        
        />
      </motion.div>
    </AnimatePresence>
  )
}
