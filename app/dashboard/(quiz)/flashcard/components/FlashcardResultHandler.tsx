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

  const { shouldRedirectToResults, error: stateError } = useAppSelector(selectFlashcardState)
  const isCompleted = useAppSelector(selectIsQuizComplete)
  const processedResults = useAppSelector(selectProcessedResults)

  useEffect(() => {
    if (!slug || !isInitialized) return
    
    if (!processedResults) {
      dispatch(checkAuthAndLoadResults())
        .unwrap()
        .then((result) => {
          // If there are still no results after loading, redirect to quiz
          if (!result || !result.totalQuestions) {
            router.replace(`/dashboard/flashcard/${slug}`)
          }
        })
        .catch(() => {
          // On error, redirect to the quiz
          router.replace(`/dashboard/flashcard/${slug}`)
        })
    }
  }, [slug, isInitialized, processedResults, dispatch, router])

  const handleRestart = useCallback(() => {
    dispatch(clearQuizState())
    onRestart?.()
  }, [dispatch, onRestart])
  const handleReview = useCallback(() => {
    if (processedResults?.reviewCards) {
      // Ensure we're using the most up-to-date review cards
      const currentReviewCards = [...processedResults.reviewCards];
      onReview?.(currentReviewCards)
    }
  }, [processedResults, onReview])

  const handleReviewStillLearning = useCallback(() => {
    if (processedResults?.stillLearningCards) {
      // Ensure we're using the most up-to-date still learning cards
      const currentStillLearningCards = [...processedResults.stillLearningCards];
      onReviewStillLearning?.(currentStillLearningCards)
    }
  }, [processedResults, onReviewStillLearning])

  const signIn = useCallback(() => {
    router.push(`/auth/signin?redirect=${encodeURIComponent(pathname || "/")}`)
  }, [router, pathname])

  if (
    isInitialized &&
    !isCompleted &&
    shouldRedirectToResults
  ) {
    router.replace(`/dashboard/flashcard/${slug}`)
    return null
  }

  if (isAuthLoading || !isInitialized) {
    return (      <div className="flex items-center justify-center min-h-[400px]">
        <QuizLoader />
      </div>
    )
  }

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

  if (stateError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-xl text-red-500">{stateError}</div>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
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
      >        {processedResults ? (
          <FlashCardResults
            slug={slug}
            title={title}
            onRestart={handleRestart}
            onReview={handleReview}
            onReviewStillLearning={handleReviewStillLearning}
            result={{
              correctAnswers: processedResults.correctAnswers || 0,
              incorrectAnswers: processedResults.incorrectAnswers || 0,
              stillLearningAnswers: processedResults.stillLearningAnswers || 0,
              totalQuestions: processedResults.totalQuestions || 0,
              percentage: processedResults.percentage || 0,
              totalTime: processedResults.totalTime || 0,              questions: (processedResults.questions || []).map(q => ({
                id: typeof q.id === 'string' ? parseInt(q.id) || 0 : (q.id || 0),
                question: q.question || '',
                answer: q.answer || ''
              })),
              answers: (processedResults.answers || [])
                .filter(a => 'answer' in a && a.questionId) 
                .map(a => ({
                  questionId: typeof a.questionId === 'string' ? parseInt(a.questionId) || 0 : (a.questionId || 0),
                  answer: 'answer' in a ? a.answer : ''
                })),
              reviewCards: processedResults.reviewCards || [],
              stillLearningCards: processedResults.stillLearningCards || []
            }}
          />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <QuizLoader />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
