"use client"

import { useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useAuth } from "@/modules/auth"
import type { AppDispatch } from "@/store"
import {
  selectQuizQuestions,
  selectQuizAnswers,
  selectCurrentQuestionIndex,
  selectQuizStatus,
  selectQuizTitle,
  selectIsQuizComplete,
  setCurrentQuestionIndex,
  saveAnswer,
  resetQuiz,
  submitQuiz,
  fetchQuiz,
} from "@/store/slices/quiz/quiz-slice"

import { toast } from "sonner"
import { NoResults } from "@/components/ui/no-results"
import McqQuiz from "./McqQuiz"

import { GlobalLoader } from "@/components/loaders"
import { useGlobalLoader } from "@/store/loaders/global-loader"


interface McqQuizWrapperProps {
  slug: string
  title?: string
}

export default function McqQuizWrapper({ slug, title }: McqQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useAuth()
  const { startLoading, stopLoading } = useGlobalLoader()
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownLoaderRef = useRef(false)
  const questions = useSelector(selectQuizQuestions)
  const answers = useSelector(selectQuizAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)
  
  // Load the quiz
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        dispatch(resetQuiz())

        await dispatch(fetchQuiz({ slug, quizType: "mcq" })).unwrap()
      } catch (err) {
        console.error("Failed to load quiz:", err)
        toast.error("Failed to load quiz. Please try again.")
      }
    }

    loadQuiz()

    return () => {
      if (submissionTimeoutRef.current) clearTimeout(submissionTimeoutRef.current)
    }
  }, [slug, dispatch])  // Navigate to result
  useEffect(() => {    // To prevent infinite loop, we track if we've already shown the loader for this completion    
    if (isCompleted && quizStatus === "succeeded" && !hasShownLoaderRef.current) {
      hasShownLoaderRef.current = true;
      startLoading({
        message: "🎉 Quiz completed! Calculating your results...",
        isBlocking: true
      })

      submissionTimeoutRef.current = setTimeout(() => {
        router.push(`/dashboard/mcq/${slug}/results`)
      }, 500)
    }

    return () => {
      if (submissionTimeoutRef.current) clearTimeout(submissionTimeoutRef.current)
    }
  }, [isCompleted, quizStatus, router, slug, startLoading])

  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex] || null
  }, [questions, currentQuestionIndex])

  const handleAnswer = useCallback((selectedOptionId: string) => {
    if (!currentQuestion) return false

    dispatch(saveAnswer({
      questionId: String(currentQuestion.id),
      answer: selectedOptionId,
      selectedOptionId
    }))

    return true
  }, [currentQuestion, dispatch])

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }, [currentQuestionIndex, questions.length, dispatch])
  const handleSubmitQuiz = useCallback(async () => {
    try {
      toast.success("Quiz submitted successfully!")
      startLoading({
        message: "🎉 Quiz completed! Calculating your results...",
        isBlocking: true
      })

      await dispatch(submitQuiz()).unwrap()

      setTimeout(() => {
        router.push(`/dashboard/mcq/${slug}/results`)
      }, 500)
    } catch (err) {
      console.error("Error submitting quiz:", err)
      toast.error("Failed to submit quiz. Please try again.")
    }
  }, [dispatch, router, slug, startLoading])


  const isLoading = quizStatus === "loading" || quizStatus === "idle"
  const hasError = quizStatus === "failed"
  const isSubmitting = quizStatus === "submitting"

  const formattedQuestion = useMemo(() => {
    if (!currentQuestion) return null

    const questionText = currentQuestion.question || ''
    const options = Array.isArray(currentQuestion.options)
      ? currentQuestion.options.map((opt: any) => typeof opt === "string" ? opt : opt.text || '')
      : []

    return {
      id: String(currentQuestion.id),
      text: questionText,
      question: questionText,
      options,
    }
  }, [currentQuestion])

  const existingAnswer = useMemo(() => {
    if (!currentQuestion) return undefined
    return answers[String(currentQuestion.id)]?.selectedOptionId || undefined
  }, [currentQuestion, answers])
  const canGoNext = currentQuestionIndex < questions.length - 1
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  if (isLoading) {
    return <GlobalLoader />
  }

  if (hasError) {
    return (
      <NoResults
        variant="error"
        title="Error Loading Quiz"
        description="We couldn't load this quiz. Please try again later or contact support if the problem persists."
        action={{
          label: "Return to Dashboard",
          onClick: () => router.push("/dashboard"),
        }}
      />
    )
  }
  
  if (!formattedQuestion) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-gray-600">Loading question...</p>
        </div>
      </div>
    )
  }
  return (
    <>
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-2 sm:px-4">

        <McqQuiz
          question={formattedQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          existingAnswer={existingAnswer}
          onAnswer={handleAnswer}
          onNext={handleNextQuestion}
          onSubmit={handleSubmitQuiz}
          isSubmitting={isSubmitting}
          canGoNext={canGoNext} isLastQuestion={isLastQuestion}
          quizTitle={quizTitle || title || "Multiple Choice Quiz"}
        />
      </div>
    </>
  )
}
