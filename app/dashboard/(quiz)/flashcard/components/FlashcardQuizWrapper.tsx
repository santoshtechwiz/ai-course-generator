'use client'

import { useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/store"
import {
  fetchFlashCardQuiz,
  clearQuizState,
  completeFlashCardQuiz,
  saveFlashCardResults,
  selectQuizQuestions,
  selectQuizAnswers,
  selectCurrentQuestionIndex,
  selectQuizStatus,
  selectQuizTitle,
  selectIsQuizComplete,
  selectShouldRedirectToResults,
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
  const initRef = useRef(false)
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const searchParams = useSearchParams()

  const isReviewMode = searchParams?.get("review") === "true"
  const isResetMode = searchParams?.get("reset") === "true"

  const questions = useSelector((state: RootState) => selectQuizQuestions(state))
  const answers = useSelector((state: RootState) => selectQuizAnswers(state))
  const currentQuestionIndex = useSelector((state: RootState) => selectCurrentQuestionIndex(state))
  const quizStatus = useSelector((state: RootState) => selectQuizStatus(state))
  const quizTitle = useSelector((state: RootState) => selectQuizTitle(state))
  const isCompleted = useSelector((state: RootState) => selectIsQuizComplete(state))
  const shouldRedirectToResults = useSelector((state: RootState) => selectShouldRedirectToResults(state))

  // Init logic
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    if (isResetMode || isReviewMode) {
      dispatch(clearQuizState())
    }

    if (!questions.length) {
      dispatch(fetchFlashCardQuiz(slug)).unwrap().catch(() => {
        toast.error("Failed to load flashcards. Please try again.")
      })
    }
  }, [dispatch, isResetMode, isReviewMode, questions.length, slug])

  // Redirect to results when quiz is complete
  useEffect(() => {
    if (shouldRedirectToResults) {
      router.replace(`/dashboard/flashcard/${slug}/results`)
    }
  }, [shouldRedirectToResults, router, slug])

  // Catch missed redirects
  useEffect(() => {
    if (isCompleted && !shouldRedirectToResults) {
      router.replace(`/dashboard/flashcard/${slug}/results`)
    }
  }, [isCompleted, shouldRedirectToResults, router, slug])

  const reviewQuestions = useMemo(() => {
    if (!isReviewMode || !questions.length || !answers.length) return questions

    const reviewIds = answers
      .filter(
        (a) => a.answer === "incorrect" || a.answer === "still_learning" || a.isCorrect === false
      )
      .map((a) => a.questionId)

    return questions.filter((q) => reviewIds.includes(q.id?.toString() || ""))
  }, [answers, questions, isReviewMode])

  const currentQuestions = isReviewMode ? reviewQuestions : questions

  const onComplete = () => {
    const correctCount = answers.filter((a) => a.answer === "correct").length
    const stillLearningCount = answers.filter((a) => a.answer === "still_learning").length
    const incorrectCount = answers.filter((a) => a.answer === "incorrect").length
    const totalTime = answers.reduce((acc, a) => acc + (a?.timeSpent || 0), 0)

    const totalQuestions = questions.length
    const percentage = totalQuestions ? (correctCount / totalQuestions) * 100 : 0

    const results = {
      score: correctCount,
      percentage,
      correctAnswers: correctCount,
      stillLearningAnswers: stillLearningCount,
      incorrectAnswers: incorrectCount,
      totalQuestions,
      totalTime,
      completedAt: new Date().toISOString(),
      reviewCards: answers
        .filter((a) => a.answer === "incorrect")
        .map((a) => parseInt(a.questionId) || a.questionId),
      stillLearningCards: answers
        .filter((a) => a.answer === "still_learning")
        .map((a) => parseInt(a.questionId) || a.questionId),
      questions,
      slug,
      title: quizTitle || title || "Flashcard Quiz",
      quizId: slug,
    }

    dispatch(completeFlashCardQuiz(results))
  }

  // Loading state
  if (quizStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-xl font-medium">Loading flashcards...</div>
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Please wait while we prepare your quiz</p>
        </div>
      </div>
    )
  }

  // Error state
  if (quizStatus === "failed") {
    return (
      <NoResults
        variant="error"
        title="No Flashcards Found"
        description="We couldn't find any flashcards for this topic."
        action={{
          label: "Try Again",
          onClick: () => {
            dispatch(clearQuizState())
            router.push(`/dashboard/flashcard/${slug}?reset=true&t=${Date.now()}`)
          },
        }}
        secondaryAction={{
          label: "Browse Topics",
          onClick: () => router.push("/dashboard/quizzes"),
          variant: "outline",
        }}
      />
    )
  }

  if (isReviewMode && reviewQuestions.length === 0) {
    return (
      <NoResults
        variant="empty"
        title="No Cards to Review"
        description="You marked all cards as known. Great job!"
        action={{
          label: "Retake Quiz",
          onClick: () => router.push(`/dashboard/flashcard/${slug}?reset=true`),
        }}
        secondaryAction={{
          label: "Back to Results",
          onClick: () => router.push(`/dashboard/flashcard/${slug}/results`),
        }}
      />
    )
  }

  if (!currentQuestions || currentQuestions.length === 0) {
    return (
      <NoResults
        variant="error"
        title="No Flashcards Found"
        description="We couldn't find any flashcards for this topic."
        action={{
          label: "Try Again",
          onClick: () => {
            dispatch(clearQuizState())
            router.push(`/dashboard/flashcard/${slug}?reset=true&t=${Date.now()}`)
          },
        }}
        secondaryAction={{
          label: "Browse Topics",
          onClick: () => router.push("/dashboard/quizzes"),
        }}
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
        onComplete={onComplete}
        onSaveCard={(saveData) => {
          dispatch(saveFlashCardResults({ slug, data: [saveData] }))
        }}
        title={
          isReviewMode ? `Review: ${quizTitle || title || "Flashcard Quiz"}` : quizTitle || title || "Flashcard Quiz"
        }
        isReviewMode={isReviewMode}
      />
    </motion.div>
  )
}
