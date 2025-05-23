"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useQuiz } from "@/hooks/useQuizState"
import { useAppDispatch } from "@/store"
import { toast } from "sonner"
import { signIn } from "next-auth/react"
import { InitializingDisplay, EmptyQuestionsDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import { QuizSubmissionLoading } from "../../components/QuizSubmissionLoading"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"
import CodingQuiz from "./CodingQuiz"
import QuizResultPreview from "./QuizResultPreview"
import type { CodeQuizQuestion } from "@/app/types/code-quiz-types"
import type { UserAnswer } from "@/app/types/quiz-types"
import { createResultsPreview } from "./QuizHelpers"
import { submitCompletedQuiz } from "@/lib/utils/quiz-answer-utils"

// Simple type for preview results
interface PreviewResults {
  score: number
  maxScore: number
  percentage: number
  title: string
  slug: string
  questions: Array<{
    id: string
    question: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }>
}

// Simplified props interface
interface CodeQuizWrapperProps {
  slug: string
  quizId: string | number
  userId: string | null
  quizData?: {
    id: string | number
    title: string
    slug: string
    questions: CodeQuizQuestion[]
    timeLimit?: number | null
    isPublic?: boolean
    isFavorite?: boolean
    ownerId?: string
    type: "code"
  }
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}

export default function CodeQuizWrapper({
  slug,
  quizId,
  userId,
  quizData,
  isPublic,
  isFavorite,
  ownerId,
}: CodeQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { status, fromAuth } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResultsLoader, setShowResultsLoader] = useState(false)
  const [showResultsPreview, setShowResultsPreview] = useState(false)
  const [previewResults, setPreviewResults] = useState<PreviewResults | null>(null)
  const [isReturningFromAuth, setIsReturningFromAuth] = useState(false)
  const authRedirectChecked = useRef(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)

  // Get quiz state from hook
  const quizHook = useQuiz()
  const { actions } = quizHook

  // Get the numeric quiz ID if available
  const numericQuizId = useMemo(() => {
    // First try the explicitly provided quizId
    if (quizId !== undefined) {
      if (typeof quizId === "number") return quizId
      if (typeof quizId === "string" && /^\d+$/.test(quizId)) return Number(quizId)
    }

    // Then try the quizData.id
    if (quizData?.id !== undefined) {
      if (typeof quizData.id === "number") return quizData.id
      if (typeof quizData.id === "string" && /^\d+$/.test(quizData.id)) return Number(quizData.id)
    }

    // If no numeric ID is available, return null
    return null
  }, [quizId, quizData?.id])

  // Create memoized question data to avoid unnecessary re-renders
  const currentQuestion = useMemo(() => {
    if (!quizData?.questions || !quizData.questions[currentQuestionIdx]) return null

    return {
      ...quizData.questions[currentQuestionIdx],
      type: "code" as const,
    }
  }, [quizData?.questions, currentQuestionIdx])

  // Debug quiz state
  useEffect(() => {
    console.log("CodeQuizWrapper state:", {
      currentQuestionIdx,
      totalQuestions: quizData?.questions?.length,
      answersCollected: userAnswers.length,
      isSubmitting,
      quizCompleted,
      numericQuizId,
      slug,
    })
  }, [
    currentQuestionIdx,
    quizData?.questions?.length,
    userAnswers.length,
    isSubmitting,
    quizCompleted,
    numericQuizId,
    slug,
  ])

  // Format answers for API submission
  const formatAnswersForSubmission = useCallback((answers: UserAnswer[]) => {
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

  // Navigation functions
  const handleReturn = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  const handleRetry = useCallback(() => {
    if (!userId || status !== "authenticated") {
      const returnUrl = `/dashboard/code/${slug}`
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(returnUrl)}`)
    } else {
      window.location.reload()
    }
  }, [userId, slug, router, status])

  // Handle sign in for non-authenticated users
  const handleShowSignIn = useCallback(() => {
    if (quizData && previewResults) {
      // Save state for after authentication
      localStorage.setItem(
        `code_quiz_${slug}`,
        JSON.stringify({
          slug,
          quizId,
          type: "code",
          userAnswers,
          currentQuestion: currentQuestionIdx,
          fromSubmission: true,
          previewResults,
        }),
      )
    }

    signIn(undefined, {
      callbackUrl: `/dashboard/code/${slug}?fromAuth=true`,
    })
  }, [slug, quizId, quizData, userAnswers, currentQuestionIdx, previewResults])

  // Clean handleSubmitQuiz function
  const handleSubmitQuiz = useCallback(
    async (answers: UserAnswer[], elapsedTime: number) => {
      if (!Array.isArray(answers) || answers.length === 0) {
        toast.error("No answers to submit")
        return
      }

      setShowResultsPreview(false)
      setShowResultsLoader(true)
      setIsSubmitting(true)

      try {
        // Calculate correct answers and score
        const correctAnswers = answers.filter((a) => a.isCorrect === true).length
        const totalQuestionsCount = quizData?.questions?.length || 0

        // Format answers for submission
        const formattedAnswers = formatAnswersForSubmission(answers)

        // Dispatch action to Redux store with proper payload structure
        dispatch({
          type: "quiz/submitQuiz",
          payload: {
            slug,
            quizId: numericQuizId || quizId || quizData?.id,
            type: "code",
            answers: formattedAnswers,
            totalQuestions: totalQuestionsCount,
            score: correctAnswers,
          },
        })

        // Prepare submission data for the API
        const apiSubmissionData = {
          slug, // This is used for the URL path
          quizId: numericQuizId || quizData?.id || quizId || slug, // Use numeric ID if available
          type: "code",
          answers: formattedAnswers,
          score: correctAnswers,
          totalQuestions: totalQuestionsCount,
          totalTime: elapsedTime || 600, // Ensure totalTime is never undefined
        }

        // Log the submission data for debugging
        console.log("Quiz submission data:", apiSubmissionData)

        // Use the shared utility to handle submission with proper error handling
        if (numericQuizId) {
          // Only submit to API if we have a numeric ID
          await submitCompletedQuiz(apiSubmissionData).catch((error) => {
            console.error("Error submitting quiz:", error)
            throw error // Re-throw to be caught by the outer catch
          })
        } else {
          console.warn("No numeric quiz ID available, skipping API submission")
        }

        // Make sure we include all required fields for the results page
        const submissionData = {
          quizId: numericQuizId || quizId || quizData?.id || slug,
          slug: slug,
          type: "code",
          title: quizData?.title || "Code Quiz",
          answers: answers,
          score: correctAnswers,
          correctAnswers: correctAnswers,
          maxScore: totalQuestionsCount,
          totalQuestions: totalQuestionsCount,
          percentage: Math.round((correctAnswers / totalQuestionsCount) * 100),
          questions:
            quizData?.questions?.map((q) => {
              const userAns = answers.find((a) => String(a.questionId) === String(q.id))
              return {
                id: q.id || String(Math.random()).slice(2),
                question: q.question || "Unknown question",
                userAnswer: userAns?.answer || "",
                correctAnswer: q.answer || q.correctAnswer || "",
                isCorrect: userAns?.isCorrect || false,
                codeSnippet: q.codeSnippet || "",
              }
            }) || [],
          totalTime: elapsedTime,
          questionsAnswered: totalQuestionsCount,
          completedAt: new Date().toISOString(),
        }

        // Then use saveTempResults if available
        if (actions?.saveTempResults) {
          console.log("Saving temp results locally")
          actions.saveTempResults(submissionData)
        }

        // Show success toast
        toast.success("Quiz completed!")

        // Navigate to results page (with slight delay to allow toasts to show)
        setTimeout(() => {
          router.replace(`/dashboard/code/${slug}/results`)
        }, 800)

        return true
      } catch (error: any) {
        console.error("Failed to handle quiz completion:", error)

        // Show a single error toast - reduced from multiple notifications
        toast.error("Could not save results to server. Viewing local results.")

        // When there's an error, create results preview from local data
        const resultsData = createResultsPreview({
          questions: quizData?.questions || [],
          answers,
          quizTitle: quizData?.title || "Code Quiz",
          slug,
        })

        if (
          error?.status === 401 ||
          (typeof error?.message === "string" && error.message.toLowerCase().includes("unauthorized"))
        ) {
          // Handle unauthorized error - prompt for sign in
          setPreviewResults(resultsData)
          setShowResultsPreview(true)
          setShowResultsLoader(false)
          setIsSubmitting(false)
          return false
        }

        // Save results locally anyway so user doesn't lose their work
        if (actions?.saveTempResults) {
          actions.saveTempResults({
            quizId: numericQuizId || quizId || quizData?.id || slug,
            slug: slug,
            type: "code",
            title: quizData?.title || "Code Quiz",
            answers: answers,
            score: resultsData.score,
            totalQuestions: resultsData.maxScore,
            totalTime: elapsedTime,
            completedAt: new Date().toISOString(),
            isOffline: true, // Mark as offline result
          })
        }

        // Navigate to results page anyway since we have local results
        setTimeout(() => {
          router.replace(`/dashboard/code/${slug}/results`)
        }, 1000)

        // Always reset loading states
        setShowResultsLoader(false)
        setIsSubmitting(false)
        return false
      }
    },
    [slug, quizId, router, quizData, actions, numericQuizId, formatAnswersForSubmission, dispatch],
  )

  // Handle answer functionality
  const handleAnswer = useCallback(
    async (answer: string, elapsedTime: number, isCorrect: boolean) => {
      // Don't process answers if we're already submitting
      if (isSubmitting || !currentQuestion) return

      // Set submitting state to prevent multiple submissions
      setIsSubmitting(true)

      try {
        // Create user answer object with correct structure
        const userAnswer: UserAnswer = {
          questionId: currentQuestion.id,
          answer: answer,
          timeSpent: elapsedTime,
          isCorrect,
        }

        // Log the answer for debugging
        console.log("Adding answer:", userAnswer)

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
        const isLastQuestion = currentQuestionIdx >= (quizData?.questions?.length || 0) - 1

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
          const totalQuestions = quizData?.questions?.length || 0
          const totalTime = allAnswers.reduce((total, a) => total + (a.timeSpent || 0), 0)

          // Create results preview
          const resultsData = createResultsPreview({
            questions: quizData?.questions || [],
            answers: allAnswers,
            quizTitle: quizData?.title || "Code Quiz",
            slug,
          })

          // Show results preview
          setPreviewResults(resultsData)
          setShowResultsPreview(true)
          setIsSubmitting(false)
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
      router,
      slug,
      userAnswers,
    ],
  )

  // Cancel preview
  const handleCancelSubmit = useCallback(() => {
    setShowResultsPreview(false)
    setPreviewResults(null)
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (!window.location.pathname.includes(`/dashboard/code/${slug}`)) {
        // Clear any saved state
        localStorage.removeItem(`code_quiz_${slug}`)
      }
    }
  }, [slug])

  // Check for auth redirect state - handle return from login
  useEffect(() => {
    // Only check once and only if authenticated
    if (!authRedirectChecked.current && status === "authenticated" && fromAuth) {
      authRedirectChecked.current = true

      // Try to load saved state
      const savedState = localStorage.getItem(`code_quiz_${slug}`)

      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState)

          if (parsedState.slug === slug) {
            setIsReturningFromAuth(true)

            if (parsedState.previewResults) {
              setPreviewResults(parsedState.previewResults)
              setShowResultsPreview(true)
            }

            if (parsedState.userAnswers) {
              setUserAnswers(parsedState.userAnswers)
            }

            if (typeof parsedState.currentQuestion === "number") {
              setCurrentQuestionIdx(parsedState.currentQuestion)
            }

            if (parsedState.fromSubmission && parsedState.userAnswers) {
              // If returning from auth after trying to submit, show the submission preview
              const answersToSubmit = parsedState.userAnswers

              setTimeout(() => {
                setShowResultsPreview(true)
              }, 500)
            }
          }

          // Clear saved state
          localStorage.removeItem(`code_quiz_${slug}`)
        } catch (error) {
          console.error("Error parsing saved state:", error)
        }
      }
    }
  }, [slug, status, fromAuth])

  // Render logic
  if (errorMessage) {
    return (
      <ErrorDisplay data-testid="error-display" error={errorMessage} onRetry={handleRetry} onReturn={handleReturn} />
    )
  }

  // Auth check for quiz submission
  if (!userId && showResultsPreview && previewResults) {
    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="code"
        onSignIn={handleShowSignIn}
        showSaveMessage={true}
        message="Please sign in to submit your quiz"
        previewData={previewResults}
      />
    )
  }

  // Results preview render
  if (showResultsPreview && previewResults) {
    return (
      <QuizResultPreview
        result={previewResults}
        onSubmit={handleSubmitQuiz}
        onCancel={handleCancelSubmit}
        userAnswers={userAnswers}
      />
    )
  }

  // Loading state render
  if (showResultsLoader) {
    return <QuizSubmissionLoading quizType="code" />
  }

  // Loading state render
  if (status === "loading") {
    return <InitializingDisplay />
  }

  // Empty questions state render
  if (quizData && Array.isArray(quizData.questions) && quizData.questions.length === 0) {
    return <EmptyQuestionsDisplay onReturn={handleReturn} />
  }

  // Active quiz state render
  if (currentQuestion) {
    const existingAnswer = userAnswers.find((a) => a.questionId === currentQuestion.id)?.answer

    return (
      <CodingQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIdx + 1}
        totalQuestions={quizData?.questions?.length || 0}
        isLastQuestion={currentQuestionIdx === (quizData?.questions?.length || 0) - 1}
        isSubmitting={isSubmitting}
        existingAnswer={typeof existingAnswer === "string" ? existingAnswer : undefined}
      />
    )
  }

  // Default loading state
  return <InitializingDisplay />
}
