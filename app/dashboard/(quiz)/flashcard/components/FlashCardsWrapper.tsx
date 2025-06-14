"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import {
  selectFlashCards,
  selectSavedCardIds,
  selectFlashCardsLoading,
  selectFlashCardsError,
  selectQuizId,
  selectQuizTitle,
  selectIsQuizComplete,
  fetchFlashCards,
  resetFlashCards,
  toggleSaveCard,
  setQuizCompleted,
  setQuizResults,
  submitQuiz,
  clearQuizState,
} from "@/store/slices/flashcard-slice"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCcw, Flag } from "lucide-react"
import { FlashCardComponent } from "./FlashCardComponent" // Corrected import to named export
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"

interface FlashCardsWrapperProps {
  slug: string
  title: string
}

export default function FlashCardsWrapper({ slug, title }: FlashCardsWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const cards = useSelector(selectFlashCards)
  const savedCardIds = useSelector(selectSavedCardIds)
  const isLoading = useSelector(selectFlashCardsLoading)
  const error = useSelector(selectFlashCardsError)
  const quizId = useSelector(selectQuizId)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)

  const [loading, setLoading] = useState(true)
  const [fetchAttempted, setFetchAttempted] = useState(false)
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      dispatch(resetFlashCards())

      try {
        const result = await dispatch(fetchFlashCards({ slug })).unwrap()
        if (!result) throw new Error("No data received")
        setFetchAttempted(true)
      } catch (err) {
        console.error("Failed to load flashcards:", err)
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

  useEffect(() => {
    if (!isCompleted) return

    toast.success("🎉 Quiz completed! Calculating your results...", { duration: 2000 })

    submissionTimeoutRef.current = setTimeout(() => {
      router.push(`/dashboard/flashcard/${slug}/results`)
    }, 1500)
  }, [isCompleted, router, slug])

  const handleSaveCard = async (card: any) => {
    const cardId = card.id.toString()
    const isSaved = savedCardIds.includes(cardId)

    try {
      await dispatch(toggleSaveCard({ cardId, isSaved })).unwrap()
    } catch (error) {
      console.error("Failed to toggle card save status", error)
    }
  }

  const handleSubmitQuiz = async () => {
    const questionResults = cards.map((card) => {
      const cardId = card.id.toString()
      const answer = savedCardIds.includes(cardId)
      const isCorrect = answer

      return {
        questionId: cardId,
        question: card.question,
        correctAnswer: card.answer,
        userAnswer: answer ? "Saved" : "Not Saved",
        isCorrect,
      }
    })

    const correctCount = questionResults.filter((q) => q.isCorrect).length
    const percentage = Math.round((correctCount / cards.length) * 100)

    const results = {
      quizId,
      slug,
      title: quizTitle || title,
      quizType: "flashcard",
      maxScore: cards.length,
      userScore: correctCount,
      score: correctCount,
      percentage,
      completedAt: new Date().toISOString(),
      questionResults,
      questions: questionResults,
    }

    dispatch(setQuizResults(results))
    dispatch(setQuizCompleted())

    await dispatch(submitQuiz()).unwrap()
    router.push(`/dashboard/flashcard/${slug}/results`)
  }

  const handleRetry = () => {
    setFetchAttempted(false)
    dispatch(fetchFlashCards({ slug }))
  }

  const handleRetakeQuiz = () => {
    dispatch(clearQuizState())
    router.replace(`/dashboard/flashcard/${slug}`)
  }

  if (loading || isLoading) {
    return <QuizLoader message="Loading flashcards..." subMessage="Preparing your study materials" />
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-6">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error loading flashcards</AlertTitle>
          <AlertDescription>{error}. Please try again.</AlertDescription>
        </Alert>
        <Button onClick={handleRetry} className="mx-auto flex gap-2">
          <RefreshCcw className="h-4 w-4" />
          <span>Try Again</span>
        </Button>
      </div>
    )
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="container max-w-4xl py-6">
        <Card>
          <CardContent className="text-center">
            <h2 className="text-xl font-bold mb-4">No Flashcards Available</h2>
            <p className="text-muted-foreground mb-6">This quiz has no flashcards, or they could not be loaded.</p>
            <Button onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const answeredQuestions = savedCardIds.length
  const allQuestionsAnswered = answeredQuestions === cards.length

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FlashCardComponent
        cards={cards}
        quizId={quizId || slug}
        slug={slug}
        title={quizTitle || title}
        onSaveCard={handleSaveCard}
        savedCardIds={savedCardIds}
      />

      <AnimatePresence>
        {answeredQuestions > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-2 border-green-500/30 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg rounded-2xl">
              <CardContent className="p-6 text-center">
                <motion.p
                  className="mb-4 font-medium text-green-800 dark:text-green-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {allQuestionsAnswered
                    ? "All flashcards reviewed. Ready to submit?"
                    : `${answeredQuestions} flashcards reviewed. Submit quiz?`}
                </motion.p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Button
                    onClick={handleSubmitQuiz}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-2xl px-8 gap-2 shadow-lg"
                  >
                    <Flag className="w-4 h-4" />
                    Submit Quiz and View Results
                  </Button>
                  <Button
                    onClick={handleRetakeQuiz}
                    size="lg"
                    variant="outline"
                    className="mt-4 text-green-700 border-green-500 hover:bg-green-100 rounded-2xl px-8 gap-2 shadow-lg"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Retake Quiz
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
