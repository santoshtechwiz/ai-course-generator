"use client"

import { useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/store"
import {
  selectFlashcardQuestions,
  selectFlashcardAnswers,
  selectFlashcardCurrentIndex,
  selectFlashcardStatus,
  selectQuizTitle,
  selectIsQuizComplete,
  clearQuizState,
  fetchFlashCardQuiz,
} from "@/store/slices/flashcard-slice"
import FlashcardQuiz from "./FlashcardQuiz"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"

interface FlashcardQuizWrapperProps {
  slug: string
  title?: string
}

export default function FlashcardQuizWrapper({ slug, title }: FlashcardQuizWrapperProps) {
  // References to prevent re-fetching
  const initRef = useRef(false)
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasFetchedRef = useRef(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch<AppDispatch>()

  // Get UI state from URL
  const isReviewMode = searchParams?.get("review") === "true"
  const isResetMode = searchParams?.get("reset") === "true"

  // Get data from Redux (memoized selectors already)
  const questions = useSelector((state: RootState) => selectFlashcardQuestions(state))
  const answers = useSelector((state: RootState) => selectFlashcardAnswers(state))
  const currentQuestionIndex = useSelector((state: RootState) => selectFlashcardCurrentIndex(state))
  const quizStatus = useSelector((state: RootState) => selectFlashcardStatus(state))
  const quizTitle = useSelector((state: RootState) => selectQuizTitle(state))
  const isCompleted = useSelector((state: RootState) => selectIsQuizComplete(state))

  // Initialize the quiz - only run once
  useEffect(() => {
    if (initRef.current) return

    const init = async () => {
      // Reset if requested or for review mode
      if (isResetMode || isReviewMode) {
        dispatch(clearQuizState())
      }

      // Only fetch if we don't have questions yet
      if (!hasFetchedRef.current && questions.length === 0) {
        try {
          hasFetchedRef.current = true
          await dispatch(fetchFlashCardQuiz(slug)).unwrap()
        } catch (err) {
          console.error("Failed to load flashcards:", err)
          toast.error("Failed to load flashcards. Please try again.")
        }
      }
    }

    init()
    initRef.current = true

    // Clean up any timeouts on unmount
    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current)
      }
    }
  }, [slug, dispatch, isResetMode, isReviewMode, questions.length])

  // Handle quiz completion and navigation - REMOVED DELAY
  useEffect(() => {
    if (!isCompleted) return

    // No automatic redirect - let the quiz component handle it
    // The FlashcardQuiz component will handle the redirect immediately
  }, [isCompleted, router, slug])

  // Get cards to review (based on incorrect and still_learning answers)
  const reviewQuestions = useMemo(() => {
    if (!isReviewMode || !questions.length || !answers.length) return questions

    // Find questions that were answered incorrectly or marked as still learning
    const reviewIds = answers
      .filter(
        (answer) => answer.answer === "incorrect" || answer.answer === "still_learning" || answer.isCorrect === false,
      )
      .map((answer) => answer.questionId)

    // Filter the questions to only include those with incorrect/still learning answers
    return questions.filter((question) => reviewIds.includes(question.id?.toString() || ""))
  }, [isReviewMode, questions, answers])

  // Use the correct set of questions based on mode
  const currentQuestions = isReviewMode ? reviewQuestions : questions

  // Loading state
  if (quizStatus === "loading") {
    return <div>Loading...</div>
  }

  // Error state
  if (quizStatus === "failed") {
    return (
      <NoResults
        variant="error"
        title="No Flashcards Found"
        description="We couldn't find any flashcards for this topic."
        action={{ label: "Try Again", onClick: () => window.location.reload() }}
        secondaryAction={{
          label: "Browse Topics",
          onClick: () => router.push("/dashboard/quizzes"),
          variant: "outline",
        }}
      />
    )
  }

  // No questions to review
  if (isReviewMode && reviewQuestions.length === 0) {
    return (
      <NoResults
        variant="empty"
        title="No Cards to Review"
        description="You marked all cards as known. Great job!"
        action={{ label: "Retake Quiz", onClick: () => router.push(`/dashboard/flashcard/${slug}?reset=true`) }}
        secondaryAction={{
          label: "Back to Results",
          onClick: () => router.push(`/dashboard/flashcard/${slug}/results`),
        }}
      />
    )
  }

  // No questions state
  if (!currentQuestions || currentQuestions.length === 0) {
    return (
      <NoResults
        variant="error"
        title="No Flashcards Found"
        description="We couldn't find any flashcards for this topic."
        action={{ label: "Try Again", onClick: () => window.location.reload() }}
        secondaryAction={{ label: "Browse Topics", onClick: () => router.push("/dashboard/quizzes") }}
      />
    )
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <FlashcardQuiz
        key={`${slug}-${isReviewMode ? "review" : "full"}`}
        cards={currentQuestions}
        quizId={slug}
        slug={slug}
        title={
          isReviewMode ? `Review: ${quizTitle || title || "Flashcard Quiz"}` : quizTitle || title || "Flashcard Quiz"
        }
        isReviewMode={isReviewMode}
      />
    </motion.div>
  )
}
