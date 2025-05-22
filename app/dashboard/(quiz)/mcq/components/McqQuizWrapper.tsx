"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppDispatch } from "@/store"
import { toast } from "sonner"
import McqQuiz from "./McqQuiz"
import { useQuiz } from "@/hooks/useQuizState"
import type { MCQQuestion } from "@/app/types/quiz-types"
import { submitCompletedQuiz } from "@/lib/utils/quiz-answer-utils"

interface McqQuizWrapperProps {
  quizData: {
    id: string | number
    title: string
    questions: MCQQuestion[]
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

export default function McqQuizWrapper({ quizData, slug, quizId, userId }: McqQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<AnswerData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Get actions from the quiz hook to access saveResults
  const { actions } = useQuiz()

  // Check if we should reset the quiz
  useEffect(() => {
    if (searchParams?.get("reset") === "true") {
      setCurrentQuestionIdx(0)
      setUserAnswers([])
      setQuizCompleted(false)
      setSubmitError(null)
    }
  }, [searchParams])

  // Create memoized question data to avoid unnecessary re-renders
  const currentQuestion = useMemo(() => {
    if (!quizData?.questions || !quizData.questions[currentQuestionIdx]) return null

    return {
      ...quizData.questions[currentQuestionIdx],
      type: "mcq" as const,
    }
  }, [quizData?.questions, currentQuestionIdx])

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

  // Debug quiz state
  useEffect(() => {
    console.log("McqQuizWrapper state:", {
      currentQuestionIdx,
      totalQuestions: quizData?.questions?.length,
      answersCollected: userAnswers.length,
      isSubmitting,
      quizCompleted,
      numericQuizId,
      slug,
      quizId,
      quizDataId: quizData?.id,
    })
  }, [
    currentQuestionIdx,
    quizData?.questions?.length,
    userAnswers.length,
    isSubmitting,
    quizCompleted,
    numericQuizId,
    slug,
    quizId,
    quizData?.id,
  ])

  // Format answers for API submission
  const formatAnswersForSubmission = useCallback((answers: AnswerData[]) => {
    return answers.map((answer) => ({
      questionId:
        typeof answer.questionId === "string"
          ? /^\d+$/.test(answer.questionId)
            ? Number(answer.questionId)
            : answer.questionId
          : answer.questionId,
      answer: answer.answer,
      timeSpent: answer.timeSpent,
      isCorrect: answer.isCorrect,
    }))
  }, [])

  const handleAnswer = useCallback(
    async (answer: string, elapsedTime: number, isCorrect: boolean) => {
      // Don't process answers if we're already submitting
      if (isSubmitting || !currentQuestion) return

      // Set submitting state to prevent multiple submissions
      setIsSubmitting(true)

      try {
        // Create user answer object with correct structure
        const userAnswer: AnswerData = {
          questionId: currentQuestion.id,
          answer: answer,
          timeSpent: elapsedTime,
          isCorrect,
        }

        // Update answers atomically to ensure state consistency
        setUserAnswers((prev) => {
          // Check if this answer already exists and update it
          const exists = prev.some((a) => String(a.questionId) === String(currentQuestion.id))
          if (exists) {
            return prev.map((a) => (String(a.questionId) === String(currentQuestion.id) ? userAnswer : a))
          }
          // Otherwise add as new answer
          return [...prev, userAnswer]
        })

        // Dispatch action to Redux store with proper payload structure
        dispatch({
          type: "quiz/setUserAnswer",
          payload: {
            questionId: currentQuestion.id,
            answer: answer,
            isCorrect: isCorrect,
            timeSpent: elapsedTime,
          },
        })

        // Check if we're on the last question
        const isLastQuestion = currentQuestionIdx >= quizData?.questions?.length - 1

        if (!isLastQuestion) {
          // Move to the next question after a short delay to allow state to update
          setTimeout(() => {
            setIsSubmitting(false) // Reset submission state before changing question
            setCurrentQuestionIdx((prevIdx) => prevIdx + 1)
          }, 300)
        } else {
          // This is the last question - handle quiz completion
          setQuizCompleted(true)

          // Get updated answers including the current one
          const allAnswers = [...userAnswers, userAnswer]

          // Calculate score - count only correct answers
          const correctAnswers = allAnswers.filter((a) => a.isCorrect).length
          const totalQuestions = quizData.questions.length
          const totalTime = allAnswers.reduce((total, a) => total + (a.timeSpent || 0), 0)

          // Format answers for submission
          const formattedAnswers = formatAnswersForSubmission(allAnswers)

          try {
            // First dispatch a submitQuiz action for test compatibility
            dispatch({
              type: "quiz/submitQuiz",
              payload: {
                slug,
                quizId: numericQuizId, // IMPORTANT: Send the numeric ID, not string
                type: "mcq",
                answers: formattedAnswers,
                totalQuestions,
                score: correctAnswers,
              },
            })

            // CRITICAL FIX: We need to use the slug for the URL path, not the quizId
            // The submitCompletedQuiz function is using the first parameter for the URL path
            // Make sure we include all required fields for the results page
            const submissionData = {
              quizId: numericQuizId, // Use the numeric ID here
              type: "mcq",
              answers: formattedAnswers,
              score: correctAnswers,
              totalQuestions,
              totalTime,
            }

            // Log the submission data for debugging
            console.log("Quiz submission data:", submissionData)

            // Use the shared utility to handle submission with proper error handling
            // CRITICAL FIX: Pass the slug as the first parameter for URL construction
            if (numericQuizId) {
              // Only submit to API if we have a numeric ID
              await submitCompletedQuiz({
                slug, // This is used for the URL path
                ...submissionData, // This includes the quizId for the request body
              }).catch((error) => {
                console.error("Error submitting quiz:", error)
                throw error // Re-throw to be caught by the outer catch
              })
            } else {
              console.warn("No numeric quiz ID available, skipping API submission")
            }

            // Then use saveTempResults if available
            if (actions?.saveTempResults) {
              console.log("Saving temp results locally")
              actions.saveTempResults({
                quizId: numericQuizId || quizId || quizData.id || slug,
                slug: slug,
                type: "mcq",
                title: quizData.title || "MCQ Quiz",
                answers: allAnswers,
                score: correctAnswers,
                correctAnswers: correctAnswers,
                maxScore: totalQuestions,
                totalQuestions: totalQuestions,
                percentage: Math.round((correctAnswers / totalQuestions) * 100),
                questions: quizData.questions.map((q) => {
                  const userAns = allAnswers.find((a) => String(a.questionId) === String(q.id))
                  return {
                    id: q.id || String(Math.random()).slice(2),
                    question: q.question || "Unknown question",
                    userAnswer: userAns?.answer || "",
                    correctAnswer: q.answer || q.correctAnswer || "",
                    isCorrect: userAns?.isCorrect || false,
                  }
                }),
                totalTime,
                questionsAnswered: totalQuestions,
                completedAt: new Date().toISOString(),
              })
            }

            // Show a single success toast - reduced from multiple notifications
            toast.success("Quiz completed!")

            // Navigate to results page (with slight delay to allow toasts to show)
            setTimeout(() => {
              router.push(`/dashboard/mcq/${slug}/results`)
            }, 800)
          } catch (error) {
            console.error("Failed to handle quiz completion:", error)

            // Show a single error toast - reduced from multiple notifications
            toast.error("Could not save results to server. Viewing local results.")

            // Save results locally anyway so user doesn't lose their work
            if (actions?.saveTempResults) {
              actions.saveTempResults({
                quizId: numericQuizId || quizId || quizData.id || slug,
                slug: slug,
                type: "mcq",
                title: quizData.title || "MCQ Quiz",
                answers: allAnswers,
                score: correctAnswers,
                totalQuestions: totalQuestions,
                totalTime,
                completedAt: new Date().toISOString(),
                isOffline: true, // Mark as offline result
              })
            }

            // Navigate to results page anyway since we have local results
            setTimeout(() => {
              router.push(`/dashboard/mcq/${slug}/results`)
            }, 1000)
          } finally {
            // Reset submitting state in case we stay on this page
            setIsSubmitting(false)
          }
        }
      } catch (error) {
        console.error("Error in answer handling:", error)
        setIsSubmitting(false)
        toast.error("Failed to process your answer. Please try again.")
      }
    },
    [
      currentQuestionIdx,
      currentQuestion,
      dispatch,
      isSubmitting,
      quizData?.questions,
      quizData?.title,
      quizId,
      numericQuizId,
      router,
      slug,
      userAnswers,
      actions,
      formatAnswersForSubmission,
      quizData?.id,
    ],
  )

  // Handle the case where quiz data is invalid
  if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto p-8 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-lg mb-4">
          <p className="font-medium">This quiz has no questions</p>
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
  if (submitError) {
    return (
      <div className="container max-w-4xl mx-auto p-8 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-lg mb-4">
          <p className="font-medium">{submitError}</p>
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
  if (!currentQuestion) {
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
      <McqQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIdx + 1}
        totalQuestions={quizData.questions.length}
        isLastQuestion={currentQuestionIdx === quizData.questions.length - 1}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
