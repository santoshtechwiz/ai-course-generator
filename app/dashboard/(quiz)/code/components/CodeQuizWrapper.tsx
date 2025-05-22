"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppDispatch } from "@/store"
import { toast } from "sonner"

import { useQuiz } from "@/hooks/useQuizState"
import type { CodeQuizQuestion } from "@/app/types/quiz-types"
import CodingQuiz from "./CodingQuiz"

interface CodeQuizWrapperProps {
  quizData: {
    id: string | number
    title: string
    questions: CodeQuizQuestion[]
    slug: string
  }
  slug: string
  quizId?: string | number
  userId?: string
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}

interface AnswerData {
  questionId: string | number
  answer: string
  timeSpent: number
  isCorrect: boolean
}

export default function CodeQuizWrapper({ quizData, slug, quizId, userId }: CodeQuizWrapperProps) {
  // HOOKS SECTION - simplified with clear organization
  const router = useRouter()
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<AnswerData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Get quiz state from hook - using simplified, consistent API
  const quizHook = useQuiz()
  const { actions } = quizHook

  // Check if we should reset the quiz
  useEffect(() => {
    if (searchParams?.get("reset") === "true") {
      setCurrentQuestionIdx(0)
      setUserAnswers([])
      setErrorMessage(null)
      setIsSubmitting(false)
    }
  }, [searchParams])

  // Memoized question data
  const questions = useMemo(() => quizData?.questions || [], [quizData?.questions])
  const currentQuestionData = useMemo(() => questions[currentQuestionIdx], [questions, currentQuestionIdx])
  const isLastQuestion = useMemo(() => currentQuestionIdx >= questions.length - 1, [currentQuestionIdx, questions])

  // Get the numeric quiz ID if available
  const numericQuizId = useMemo(() => {
    // First try the explicitly provided quizId
    if (quizId !== undefined) {
      if (typeof quizId === "number") return quizId
      if (typeof quizId === "string" && /^\d+$/.test(quizId)) return parseInt(quizId, 10)
    }

    // Then try the quizData.id
    if (quizData?.id !== undefined) {
      if (typeof quizData.id === "number") return quizData.id
      if (typeof quizData.id === "string" && /^\d+$/.test(quizData.id)) return parseInt(quizData.id, 10)
    }

    // If no numeric ID is available, return null
    return null
  }, [quizId, quizData?.id])

  // Make sure we're explicitly handling code quizzes
  const quizType = "code";
  
  // Handle answer submission
  const handleAnswer = useCallback(
    async (answer: string, elapsedTime: number, isCorrect: boolean) => {
      // Don't process answers if we're already submitting
      if (isSubmitting || !currentQuestionData) return

      try {
        // Create user answer object with correct structure
        const userAnswer = {
          questionId: currentQuestionData.id,
          answer: answer,
          timeSpent: elapsedTime,
          isCorrect,
        }

        // Add to local state
        setUserAnswers(prev => [...prev, userAnswer])
        
        // Dispatch to Redux for persistence
        dispatch({
          type: "quiz/setUserAnswer",
          payload: {
            questionId: currentQuestionData.id,
            answer: answer,
            isCorrect,
            timeSpent: elapsedTime
          }
        })

        // Check if we're on the last question
        if (!isLastQuestion) {
          // Move to the next question
          setCurrentQuestionIdx(prev => prev + 1)
        } else {
          // This is the last question - handle quiz completion
          setIsSubmitting(true)

          // Calculate score - count only correct answers
          const allAnswers = [...userAnswers, userAnswer]
          const correctAnswers = allAnswers.filter((a) => a.isCorrect).length
          const totalQuestions = questions.length
          const totalTime = allAnswers.reduce((total, a) => total + (a.timeSpent || 0), 0)

          try {
            // Use submitQuiz with the proper data
            dispatch({
              type: "quiz/submitQuiz",
              payload: {
                slug,
                quizId: numericQuizId,
                // Fix: Ensure we explicitly specify code quiz type
                type: quizType,
                answers: allAnswers,
                totalQuestions,
                score: correctAnswers,
                timeTaken: totalTime,
              }
            })

            // Save temporary results
            if (actions?.saveTempResults) {
              actions.saveTempResults({
                quizId: quizId || numericQuizId,
                slug: slug,
                // Fix: Ensure we explicitly specify code quiz type
                type: quizType,
                title: quizData?.title || "Code Quiz",
                answers: allAnswers,
                score: correctAnswers,
                maxScore: totalQuestions,
                percentage: Math.round((correctAnswers / totalQuestions) * 100),
                questions: questions.map((q) => {
                  const userAns = allAnswers.find((a) => String(a.questionId) === String(q.id))
                  return {
                    id: q.id,
                    question: q.question,
                    userAnswer: userAns?.answer || "",
                    correctAnswer: q.answer || q.correctAnswer || "",
                    isCorrect: userAns?.isCorrect || false,
                    codeSnippet: q.codeSnippet,
                  }
                }),
                totalTime,
                completedAt: new Date().toISOString(),
              })
            }

            // Fix: Ensure we use the code-specific path for navigation
            setTimeout(() => {
              router.push(`/dashboard/code/${slug}/results`)
            }, 800)
          } catch (error) {
            console.error("Failed to submit quiz:", error)
            setIsSubmitting(false)

            // Save results locally anyway
            if (actions?.saveTempResults) {
              actions.saveTempResults({
                quizId: quizId || numericQuizId,
                slug: slug,
                // Fix: Ensure we explicitly specify code quiz type
                type: quizType,
                title: quizData?.title || "Code Quiz",
                answers: allAnswers,
                score: correctAnswers,
                totalQuestions,
                totalTime,
                completedAt: new Date().toISOString(),
                isOffline: true,
              })
            }

            // Fix: Ensure we use the code-specific path for navigation
            router.push(`/dashboard/code/${slug}/results`)
          }
        }
      } catch (error) {
        console.error("Error handling answer:", error)
        setIsSubmitting(false)
      }
    },
    [
      currentQuestionData,
      isSubmitting,
      isLastQuestion,
      userAnswers,
      questions,
      dispatch,
      actions,
      quizId,
      slug,
      router,
      numericQuizId,
      quizData?.title,
      quizType
    ],
  )

  // RENDER LOGIC - After all hooks are called

  // Handle the case where quiz data is invalid
  if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto p-8 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-lg mb-4">
          <p className="font-medium" data-testid="quiz-error">This quiz has no questions</p>
        </div>
        <button
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          onClick={() => router.push("/dashboard/quizzes")}
        >
          Return to Quizzes
        </button>
      </div>
    )
  }

  // Error submitting
  if (errorMessage) {
    return (
      <div className="container max-w-4xl mx-auto p-8 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-lg mb-4">
          <p className="font-medium">{errorMessage}</p>
        </div>
        <button
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          onClick={() => router.push("/dashboard/quizzes")}
        >
          Return to Quizzes
        </button>
      </div>
    )
  }

  // Show loading state if question is not available
  if (!currentQuestionData) {
    return (
      <div className="container max-w-4xl mx-auto p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <CodingQuiz
        question={currentQuestionData}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIdx + 1}
        totalQuestions={quizData.questions.length}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
