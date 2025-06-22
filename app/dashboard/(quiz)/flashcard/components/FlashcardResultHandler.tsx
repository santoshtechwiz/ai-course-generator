'use client'

import { useEffect, useMemo, useCallback } from "react"
import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  resetFlashCards,
  clearQuizState,
  resetRedirectFlag,
  selectQuizResults,
  selectAnswers,
  selectIsQuizComplete,
  selectFlashcardState,
} from "@/store/slices/flashcard-slice"
import { AnimatePresence, motion } from "framer-motion"
import { QuizLoader } from "@/components/ui/quiz-loader"
import FlashCardResults from "./FlashCardQuizResults"
import SignInPrompt from "@/app/auth/signin/components/SignInPrompt"
import { Button } from "@/components/ui/button"

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
  const dispatch = useAppDispatch()
  const { data: session, status } = useSession()

  const {
    results,
    answers,
    isCompleted,
    shouldRedirectToResults,
    questions: storeQuestions,
  } = useAppSelector(selectFlashcardState)

  const processedResults = useMemo(() => {
    let correct = 0,
      stillLearning = 0,
      incorrect = 0
    const reviewCards: number[] = []
    const stillLearningCards: number[] = []

    answers?.forEach((a, i) => {
      switch (a.answer) {
        case "correct":
          correct++
          break
        case "still_learning":
          stillLearning++
          stillLearningCards.push(i)
          break
        case "incorrect":
          incorrect++
          reviewCards.push(i)
          break
      }
    })

    return {
      correct,
      stillLearning,
      incorrect,
      total: correct + stillLearning + incorrect,
      reviewCards,
      stillLearningCards,
    }
  }, [answers])

  const finalResults = useMemo(() => {
    if (results) return results

    // fallback to computed state if Redux hasn't generated `results` slice yet
    if (!isCompleted || !answers?.length) return null

    return {
      quizId: slug,
      slug,
      title: title || "Flashcard Quiz",
      quizType: "flashcard",
      score: processedResults.correct,
      maxScore: processedResults.total,
      percentage: processedResults.total
        ? Math.round((processedResults.correct / processedResults.total) * 100)
        : 0,
      correctAnswers: processedResults.correct,
      stillLearningAnswers: processedResults.stillLearning,
      incorrectAnswers: processedResults.incorrect,
      totalQuestions: storeQuestions.length || 0,
      totalTime: answers.reduce((acc, a) => acc + (a?.timeSpent || 0), 0),
      completedAt: new Date().toISOString(),
      answers,
      questions: storeQuestions,
      reviewCards: processedResults.reviewCards,
      stillLearningCards: processedResults.stillLearningCards,
    }
  }, [results, isCompleted, answers, storeQuestions, slug, title, processedResults])

  const handleSignIn = useCallback(() => {
    signIn(undefined, {
      callbackUrl: `/dashboard/flashcard/${slug}/results`,
    })
  }, [slug])

  const handleRetake = useCallback(() => {
    dispatch(resetFlashCards())
    dispatch(clearQuizState())
    onRestart?.()

    setTimeout(() => {
      window.location.href = `/dashboard/flashcard/${slug}?reset=true&t=${Date.now()}`
    }, 100)
  }, [dispatch, slug, onRestart])

  const handleReview = useCallback(() => {
    onReview?.(processedResults.reviewCards)
  }, [onReview, processedResults.reviewCards])

  const handleReviewStillLearning = useCallback(() => {
    onReviewStillLearning?.(processedResults.stillLearningCards)
  }, [onReviewStillLearning, processedResults.stillLearningCards])

  // Clear redirect flag after result landing
  useEffect(() => {
    if (shouldRedirectToResults) {
      dispatch(resetRedirectFlag())
    }
  }, [shouldRedirectToResults, dispatch])

  if (status === "loading") {
    return <QuizLoader message="Loading results..." subMessage="Please wait..." />
  }

  if (!finalResults) {
    return (
      <div className="container max-w-2xl py-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz Completed</h2>
        <p className="text-muted-foreground mb-6">We couldn’t load detailed results. Try again or start a new quiz.</p>
        <div className="space-y-4">
          <Button onClick={handleRetake} className="w-full">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.replace("/dashboard/flashcard")} className="w-full">
            Browse Topics
          </Button>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <AnimatePresence mode="wait">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <SignInPrompt
            onSignIn={handleSignIn}
            onRetake={handleRetake}
            previewData={{
              correctAnswers: processedResults.correct,
              totalQuestions: processedResults.total,
              stillLearningAnswers: processedResults.stillLearning,
              incorrectAnswers: processedResults.incorrect,
            }}
          />
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
        <FlashCardResults
          quizId={finalResults.quizId}
          slug={slug}
          title={finalResults.title}
          score={finalResults.score}
          totalQuestions={finalResults.totalQuestions}
          correctAnswers={finalResults.correctAnswers}
          stillLearningAnswers={finalResults.stillLearningAnswers}
          incorrectAnswers={finalResults.incorrectAnswers}
          totalTime={finalResults.totalTime}
          onRestart={handleRetake}
          onReview={handleReview}
          onReviewStillLearning={handleReviewStillLearning}
          reviewCards={finalResults.reviewCards}
          stillLearningCards={finalResults.stillLearningCards}
          answers={finalResults.answers}
          questions={finalResults.questions}
        />
      </motion.div>
    </AnimatePresence>
  )
}
