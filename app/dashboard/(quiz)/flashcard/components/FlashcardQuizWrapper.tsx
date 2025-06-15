"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import {
  selectFlashcardQuestions,
  selectFlashcardAnswers,
  selectFlashcardCurrentIndex,
  selectFlashcardStatus,
  selectQuizTitle,
  selectIsQuizComplete,
  clearQuizState,
  fetchFlashCardQuiz,
  submitFlashCardAnswer,
  setCurrentFlashCard,
  completeFlashCardQuiz,
} from "@/store/slices/flashcard-slice"
import { QuizLoader } from "@/components/ui/quiz-loader"
import FlashcardQuiz from "./FlashcardQuiz"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"

interface FlashcardQuizWrapperProps {
  slug: string
  title?: string
}

export default function FlashcardQuizWrapper({ slug, title }: FlashcardQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const questions = useSelector(selectFlashcardQuestions)
  const answers = useSelector(selectFlashcardAnswers)
  const currentQuestionIndex = useSelector(selectFlashcardCurrentIndex)
  const quizStatus = useSelector(selectFlashcardStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)

  // Initialize quiz
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setError(null)
      dispatch(clearQuizState())
      try {
        const result = await dispatch(fetchFlashCardQuiz(slug)).unwrap()
        if (!result || !result.questions || result.questions.length === 0) {
          setError("No flashcards found for this topic.")
        }
      } catch (err) {
        setError("Failed to load flashcards. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    init()
    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current)
      }
    }
  }, [slug, dispatch])

  // Handle quiz completion and navigation (align with MCQ flow)
  useEffect(() => {
    if (!isCompleted || isSubmitting) return
    toast.success("🎉 Flashcard study session completed! Calculating your results...", { duration: 2000 })
    submissionTimeoutRef.current = setTimeout(() => {
      router.push(`/dashboard/flashcard/${slug}/results`)
    }, 1500)
  }, [isCompleted, isSubmitting, router, slug])

  const currentQuestion = useMemo(() => {
    if (!questions || !questions.length || currentQuestionIndex >= questions.length) return null
    return questions[currentQuestionIndex]
  }, [questions, currentQuestionIndex])

  const handleAnswer = useCallback(
    (cardId: string | number, answer: "correct" | "incorrect") => {
      if (!currentQuestion) return
      dispatch(
        submitFlashCardAnswer({
          questionId: String(cardId),
          answer: answer,
          userAnswer: answer,
          isCorrect: answer === "correct",
          timeSpent: 0,
        }),
      )
    },
    [currentQuestion, dispatch],
  )

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentFlashCard(currentQuestionIndex + 1))
    }
  }, [currentQuestionIndex, questions.length, dispatch])

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentFlashCard(currentQuestionIndex - 1))
    }
  }, [currentQuestionIndex, dispatch])

  const handleSubmitQuiz = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const correctAnswers = answers.filter((answer) => answer.isCorrect).length
      const results = {
        quizId: slug,
        slug,
        title: quizTitle || title || "Flashcard Session",
        questions,
        answers,
        completedAt: new Date().toISOString(),
        userScore: correctAnswers,
        maxScore: questions.length,
        percentage: Math.round((correctAnswers / questions.length) * 100),
        correctAnswers: correctAnswers,
        totalQuestions: questions.length,
        isCompleted: true,
      }
      await dispatch(completeFlashCardQuiz(results))
      // After completion, isCompleted will be true and useEffect will handle redirect
    } catch (err) {
      toast.error("Failed to save your progress. Please try again.")
      setIsSubmitting(false)
    }
  }, [isSubmitting, slug, quizTitle, title, questions, answers, dispatch])

  const handleRetakeQuiz = useCallback(() => {
    dispatch(clearQuizState())
    router.replace(`/dashboard/flashcard/${slug}`)
  }, [dispatch, router, slug])

  // Save/unsave logic (optional, can be expanded as needed)
  const [savedCards, setSavedCards] = useState<Record<string | number, boolean>>({})
  const handleToggleSave = useCallback(
    (id: string | number, saved: boolean) => {
      setSavedCards((prev) => ({ ...prev, [id]: saved }))
      // Optionally, dispatch a save action here if needed
    },
    [],
  )
  const handleSaveCard = useCallback(
    (card: any) => {
      if (!card || !card.id) return
      const isSaved = savedCards[card.id]
      setSavedCards((prev) => ({ ...prev, [card.id]: !isSaved }))
    },
    [savedCards],
  )
  const savedCardIds = useMemo(
    () =>
      Object.entries(savedCards)
        .filter(([_, isSaved]) => isSaved)
        .map(([cardId]) => cardId),
    [savedCards],
  )

  const canGoNext = currentQuestionIndex < questions.length - 1
  const canGoPrevious = currentQuestionIndex > 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  if (loading || quizStatus === "loading") {
    return <QuizLoader message="Loading flashcards..." subMessage="Preparing your study session" />
  }
  if (error || quizStatus === "failed") {
    return (
      <NoResults
        variant="error"
        title="No Flashcards Found"
        description={error || "We couldn't find any flashcards for this topic."}
        action={{ label: "Try Again", onClick: () => window.location.reload() }}
        secondaryAction={{ label: "Browse Topics", onClick: () => router.push("/dashboard/quizzes"), variant: "outline" }}
      />
    )
  }
  if (!currentQuestion) {
    return (
      <NoResults
        variant="error"
        title="No Flashcards Found"
        description="We couldn't find any flashcards for this topic."
        action={{ label: "Try Again", onClick: () => window.location.reload() }}
        secondaryAction={{ label: "Browse Topics", onClick: () => router.push("/dashboard/quizzes"), variant: "outline" }}
      />
    )
  }
  // Remove custom result UI, let result page handle it after redirect
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FlashcardQuiz
        key={currentQuestion?.id || currentQuestionIndex}
        cards={questions}
        quizId={slug}
        slug={slug}
        title={quizTitle || title || "Flashcard Quiz"}
        onSaveCard={handleSaveCard}
        savedCardIds={savedCardIds}
      />
    </motion.div>
  )
}
