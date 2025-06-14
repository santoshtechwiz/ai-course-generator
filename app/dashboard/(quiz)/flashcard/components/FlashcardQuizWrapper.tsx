"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import {
  selectQuestions,
  selectAnswers,
  selectCurrentQuestionIndex,
  selectQuizStatus,
  selectQuizTitle,
  selectIsQuizComplete,
  hydrateQuiz,
  setCurrentQuestionIndex,
  saveAnswer,
  resetQuiz,
  setQuizResults,
  setQuizCompleted,
  fetchQuiz,
  resetSubmissionState,
  submitQuiz,
  selectQuizId,
  selectQuizType,
  clearQuizState,
} from "@/store/slices/quiz-slice"
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
  const [savedCards, setSavedCards] = useState<Record<string, boolean>>({})

  // Redux state
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)
  const quizId = useSelector(selectQuizId)
  const quizType = useSelector(selectQuizType)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      dispatch(resetQuiz())

      try {
        const result = await dispatch(fetchQuiz({ slug, quizType: "flashcard" })).unwrap()
        if (!result) throw new Error("No data received")
        
        // Initialize saved cards state from loaded questions
        const savedCardsMap: Record<string, boolean> = {}
        if (result.questions) {
          result.questions.forEach((q: any) => {
            if (q.id && q.saved) {
              savedCardsMap[q.id] = true
            }
          })
        }
        setSavedCards(savedCardsMap)
        
        dispatch(
          hydrateQuiz({
            slug,
            quizType: "flashcard",
            quizData: result,
            currentState: {
              currentQuestionIndex: 0,
              answers: {},
              isCompleted: false,
              showResults: false,
            },
          }),
        )
        setError(null)
      } catch (err) {
        setError("Failed to load flashcards. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    init()
    dispatch(resetSubmissionState())

    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current)
      }
    }
  }, [slug, dispatch])

  useEffect(() => {
    if (!isCompleted || isSubmitting) return

    toast.success("🎉 Flashcard study session completed!", { duration: 2000 })

    submissionTimeoutRef.current = setTimeout(() => {
      router.push(`/dashboard/flashcard/${slug}/results`)
    }, 1000) // Reduced timeout for faster transition
  }, [isCompleted, isSubmitting, router, slug])

  const currentQuestion = useMemo(() => {
    if (!questions.length || currentQuestionIndex >= questions.length) return null
    return questions[currentQuestionIndex]
  }, [questions, currentQuestionIndex])

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }, [currentQuestionIndex, questions.length, dispatch])

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1))
    }
  }, [currentQuestionIndex, dispatch])

  const handleSubmitQuiz = useCallback(async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Process answers and calculate stats
      const processedAnswers = Object.values(answers)
      
      // Create results with summary data
      const results = {
        quizId,
        slug,
        title: quizTitle || title,
        quizType: "flashcard",
        questions,
        answers: processedAnswers,
        completedAt: new Date().toISOString(),
        userScore: processedAnswers.filter(a => a.isCorrect).length,
        maxScore: questions.length,
        percentage: Math.round((processedAnswers.filter(a => a.isCorrect).length / questions.length) * 100),
        savedCards: Object.keys(savedCards).filter(id => savedCards[id])
      }

      dispatch(setQuizResults(results))
      dispatch(setQuizCompleted())

      await dispatch(submitQuiz()).unwrap()
      toast.success("Study session recorded!")
    } catch (err) {
      console.error("Error completing flashcard session:", err)
      toast.error("Failed to save your progress. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, quizId, slug, quizTitle, title, questions, answers, dispatch, savedCards])

  const handleRetakeQuiz = useCallback(() => {
    dispatch(clearQuizState())
    router.replace(`/dashboard/flashcard/${slug}`)
  }, [dispatch, router, slug])
  
  const handleToggleSave = useCallback((id: string | number, saved: boolean) => {
    setSavedCards(prev => ({
      ...prev,
      [id]: saved
    }))
    
    // Save this information to an answer to track with the quiz
    dispatch(
      saveAnswer({
        questionId: String(id),
        answer: {
          questionId: String(id),
          saved,
          timestamp: Date.now(),
        },
      })
    )
    
    toast.success(saved ? "Card saved for later review" : "Card removed from saved list", {
      duration: 1500,
    })
  }, [dispatch])

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
        title="Error Loading Flashcards"
        description={error || "Unable to load flashcards."}
        action={{
          label: "Back to Dashboard",
          onClick: () => router.push("/dashboard"),
        }}
      />
    )
  }

  if (!currentQuestion) {
    return (
      <NoResults
        variant="error"
        title="No Flashcards Found"
        description="We couldn't find any flashcards for this topic."
        action={{
          label: "Try Again",
          onClick: () => window.location.reload(),
        }}
        secondaryAction={{
          label: "Browse Topics",
          onClick: () => router.push("/dashboard/quizzes"),
          variant: "outline",
        }}
      />
    )
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FlashcardQuiz
        key={currentQuestion.id}
        question={{
          ...currentQuestion,
          saved: savedCards[currentQuestion.id]
        }}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSubmit={handleSubmitQuiz}
        onRetake={handleRetakeQuiz}
        onToggleSave={handleToggleSave}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting || quizStatus === "submitting"}
      />
    </motion.div>
  )
}
