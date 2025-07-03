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
  selectQuizError,
  selectRequiresAuth,
  setPendingFlashCardAuth,
} from "@/store/slices/flashcard-slice"

import {
  ANSWER_TYPES,
  type RatingAnswer,
  type QuizResultsState,
} from "@/store/slices/flashcard-slice"

import FlashcardQuiz from "./FlashcardQuiz"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"
import { useAuth } from "@/hooks/use-auth"
import SignInPrompt from "@/app/auth/signin/components/SignInPrompt"
import { GlobalLoader } from "@/components/ui/loader"

interface FlashcardQuizWrapperProps {
  slug: string
  title?: string
}

export default function FlashcardQuizWrapper({ slug, title }: FlashcardQuizWrapperProps) {
  const initRef = useRef(false)
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isInitialized, login } = useAuth()

  const isReviewMode = searchParams?.get("review") === "true"
  const isResetMode = searchParams?.get("reset") === "true"

  const questions = useSelector(selectQuizQuestions)
  const answers = useSelector(selectQuizAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)
  const shouldRedirectToResults = useSelector(selectShouldRedirectToResults)
  const error = useSelector(selectQuizError)
  const requiresAuth = useSelector(selectRequiresAuth)

  // Initial load: clear state if needed and fetch quiz
  useEffect(() => {
    if (!slug || !isInitialized) return

    if (isResetMode || isReviewMode) {
      dispatch(clearQuizState())
    }

    if (!questions.length) {
      dispatch(fetchFlashCardQuiz(slug))
        .unwrap()
        .catch((err) => {
          const message = err instanceof Error ? err.message : "Failed to load flashcards"
          toast.error(message)
        })
    }
  }, [dispatch, isResetMode, isReviewMode, questions.length, slug, isInitialized])

  // Redirect if auth required
  useEffect(() => {
    if (requiresAuth && !isAuthenticated && isInitialized) {
      dispatch(setPendingFlashCardAuth(true))
      router.push(`/auth/signin?callbackUrl=/dashboard/flashcard/${slug}`)
    }
  }, [requiresAuth, isAuthenticated, isInitialized, dispatch, router, slug])

  // Redirect to results
  useEffect(() => {
    if (shouldRedirectToResults || (isCompleted && !shouldRedirectToResults)) {
      router.replace(`/dashboard/flashcard/${slug}/results`)
    }
  }, [shouldRedirectToResults, isCompleted, router, slug])

  const reviewQuestions = useMemo(() => {
    if (!isReviewMode || !questions.length || !answers.length) return questions

    const reviewIds = answers
      .filter((a): a is RatingAnswer =>
        'answer' in a && (
          a.answer === ANSWER_TYPES.INCORRECT ||
          a.answer === ANSWER_TYPES.STILL_LEARNING ||
          a.isCorrect === false
        )
      )
      .map((a) => a.questionId)

    return questions.filter((q) => reviewIds.includes(q.id?.toString() || ""))
  }, [answers, questions, isReviewMode])

  const currentQuestions = isReviewMode ? reviewQuestions : questions

  const onComplete = () => {
    const ratingAnswers = answers.filter((a): a is RatingAnswer => 'answer' in a)

    const correctCount = ratingAnswers.filter((a) => a.answer === ANSWER_TYPES.CORRECT).length
    const stillLearningCount = ratingAnswers.filter((a) => a.answer === ANSWER_TYPES.STILL_LEARNING).length
    const incorrectCount = ratingAnswers.filter((a) => a.answer === ANSWER_TYPES.INCORRECT).length
    const totalTime = ratingAnswers.reduce((acc, a) => acc + (a.timeSpent || 0), 0)

    const totalQuestions = questions.length
    const percentage = totalQuestions ? (correctCount / totalQuestions) * 100 : 0
    const timestamp = new Date().toISOString()

    const results: QuizResultsState = {
      score: correctCount,
      percentage,
      correctCount,
      incorrectCount,
      stillLearningCount,
      correctAnswers: correctCount,
      stillLearningAnswers: stillLearningCount,
      incorrectAnswers: incorrectCount,
      totalQuestions,
      totalTime,
      completedAt: timestamp,
      submittedAt: timestamp,
      reviewCards: ratingAnswers
        .filter((a) => a.answer === ANSWER_TYPES.INCORRECT)
        .map((a) => parseInt(a.questionId) || a.questionId),
      stillLearningCards: ratingAnswers
        .filter((a) => a.answer === ANSWER_TYPES.STILL_LEARNING)
        .map((a) => parseInt(a.questionId) || a.questionId),
      questions,
      answers,
      slug,
      title: quizTitle || title || "Flashcard Quiz",
      quizId: slug,
      maxScore: totalQuestions,
    }

    dispatch(completeFlashCardQuiz(results))
  }

  // Loading Skeletons
  if (quizStatus === "loading" || !isInitialized) {
    return (
        <GlobalLoader size="sm" />
    )
  }

  // Error State with Retry
  if (quizStatus === "failed" || error) {
    return (
      <NoResults
        variant="error"
        title="Oops! Something went wrong."
        description={error || "Unable to load flashcards at this moment."}
        action={{
          label: "Retry",
          onClick: () => {
            dispatch(clearQuizState())
            dispatch(fetchFlashCardQuiz(slug))
          },
        }}
        secondaryAction={{
          label: "Browse Topics",
          onClick: () => router.push("/dashboard/quizzes"),
        }}
      />
    )
  }

  // Sign-in prompt for auth-required quizzes
  if (requiresAuth && !isAuthenticated && isInitialized) {
    return (
      <SignInPrompt
        onSignIn={() => login("credentials", { callbackUrl: `/dashboard/flashcard/${slug}` })}
        onRetake={() => {
          dispatch(clearQuizState())
          router.push(`/dashboard/flashcard/${slug}?reset=true`)
        }}
        quizType="flashcard"
      />
    )
  }

  // Empty Review State
  if (isReviewMode && reviewQuestions.length === 0) {
    return (
      <NoResults
        variant="empty"
        title="All Clear!"
        description="You've reviewed all cards. Great job!"
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

  // No questions found
  if (!currentQuestions || currentQuestions.length === 0) {
    return (
      <NoResults
        variant="error"
        title="No Flashcards Available"
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

  // Main Quiz Component
  return (
    <motion.div
      className="space-y-6 px-4"
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