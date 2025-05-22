"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppDispatch } from "@/store"
import { toast } from "sonner"
// Fix: Ensure we're importing from the correct path in the same directory
import McqQuiz from "./McqQuiz"
import { useQuiz } from "@/hooks/useQuizState"
import type { MCQQuestion } from "@/app/types/quiz-types"

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

export default function McqQuizWrapper({ quizData, slug, quizId }: McqQuizWrapperProps) {
  // Core hooks for state management - simplified
  const router = useRouter()
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const { actions } = useQuiz()
  
  // Local state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<AnswerData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Reset quiz if requested via URL param
  useEffect(() => {
    if (searchParams?.get("reset") === "true") {
      setCurrentQuestionIdx(0)
      setUserAnswers([])
      setSubmitError(null)
      setIsSubmitting(false)
    }
  }, [searchParams])

  // Create memoized question data for optimization
  const currentQuestion = useMemo(() => {
    if (!quizData?.questions || !quizData.questions[currentQuestionIdx]) return null

    // Ensure question data is properly formatted and deduplicated
    const question = quizData.questions[currentQuestionIdx];
    
    // Check if the question text appears to be duplicated (same text repeated)
    const questionText = question.question;
    const isDuplicated = questionText.includes(questionText.split('?')[0] + '?') && 
                          questionText.split('?').length > 2;
    
    // If duplication is detected, fix it
    const fixedQuestion = isDuplicated 
      ? {
          ...question,
          question: questionText.split('?')[0] + '?'
        }
      : question;

    return {
      ...fixedQuestion,
      type: "mcq" as const,
    }
  }, [quizData?.questions, currentQuestionIdx])

  // Check if current question is the last one
  const isLastQuestion = useMemo(() => {
    return currentQuestionIdx >= (quizData?.questions?.length || 0) - 1
  }, [currentQuestionIdx, quizData?.questions?.length])

  // Get the numeric quiz ID if available - important for API compatibility
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

  // Handle user answer submission
  const handleAnswer = useCallback(
    async (answer: string, elapsedTime: number, isCorrect: boolean) => {
      // Don't process answers if we're already submitting
      if (isSubmitting || !currentQuestion) return

      // Set submitting state to prevent multiple submissions
      setIsSubmitting(true)

      try {
        // Create user answer object
        const userAnswer: AnswerData = {
          questionId: currentQuestion.id,
          answer: answer,
          timeSpent: elapsedTime,
          isCorrect,
        }

        // Update answers in local state
        setUserAnswers((prev) => {
          // Check if this answer already exists and update it
          const exists = prev.some((a) => String(a.questionId) === String(currentQuestion.id))
          if (exists) {
            return prev.map((a) => (String(a.questionId) === String(currentQuestion.id) ? userAnswer : a))
          }
          // Otherwise add as new answer
          return [...prev, userAnswer]
        })

        // Dispatch to Redux store
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
        if (!isLastQuestion) {
          // Move to the next question after a short delay
          setTimeout(() => {
            setIsSubmitting(false) // Reset submission state before changing question
            setCurrentQuestionIdx((prevIdx) => prevIdx + 1)
          }, 300)
        } else {
          // This is the last question - handle quiz completion
          setIsSubmitting(true) // Keep submitting state active

          // Get updated answers including the current one
          const allAnswers = [...userAnswers, userAnswer]

          // Calculate score - count only correct answers
          const correctAnswers = allAnswers.filter((a) => a.isCorrect).length
          const totalQuestions = quizData.questions.length
          const totalTime = allAnswers.reduce((total, a) => total + (a.timeSpent || 0), 0)

          // Format answers for submission
          const formattedAnswers = formatAnswersForSubmission(allAnswers)

          try {
            // Dispatch quiz submission action
            dispatch({
              type: "quiz/submitQuiz",
              payload: {
                slug,
                quizId: numericQuizId, 
                type: "mcq",
                answers: formattedAnswers,
                totalQuestions,
                score: correctAnswers,
              },
            })

            // Save temporary results for results page
            if (actions?.saveTempResults) {
              actions.saveTempResults({
                quizId: quizId || numericQuizId,
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
                    id: q.id,
                    question: q.question,
                    userAnswer: userAns?.answer || "",
                    correctAnswer: q.answer || q.correctAnswer || "",
                    isCorrect: userAns?.isCorrect || false,
                  }
                }),
                totalTime,
                completedAt: new Date().toISOString(),
              })
            }

            // Show success message
            toast.success("Quiz completed!")

            // Navigate to results page
            setTimeout(() => {
              router.push(`/dashboard/mcq/${slug}/results`)
            }, 800)
          } catch (error) {
            console.error("Failed to handle quiz completion:", error)
            toast.error("Could not save results to server. Viewing local results.")

            // Save results locally anyway
            if (actions?.saveTempResults) {
              actions.saveTempResults({
                quizId: quizId || numericQuizId,
                slug: slug,
                type: "mcq",
                title: quizData.title || "MCQ Quiz",
                answers: allAnswers,
                score: correctAnswers,
                totalQuestions: totalQuestions,
                totalTime,
                completedAt: new Date().toISOString(),
                isOffline: true,
              })
            }

            // Navigate to results page anyway
            router.push(`/dashboard/mcq/${slug}/results`)
          }
        }
      } catch (error) {
        console.error("Error in answer handling:", error)
        setIsSubmitting(false)
        toast.error("Failed to process your answer. Please try again.")
      }
    },
    [
      currentQuestion,
      isSubmitting,
      isLastQuestion,
      userAnswers,
      dispatch,
      quizData?.questions,
      quizData?.title,
      quizId,
      numericQuizId,
      router,
      slug,
      actions,
      formatAnswersForSubmission,
    ],
  )

  // RENDER LOGIC

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
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
