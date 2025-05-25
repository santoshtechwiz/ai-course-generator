"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { QuizResultFactory } from "@/app/types/quiz-results"
import { useQuiz } from "@/hooks/useQuiz"
import { useAppDispatch } from "@/store"
import { saveAuthRedirectState } from "@/store/middleware/persistQuizMiddleware"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { QuizSubmissionLoading } from "../../components"
import { NonAuthenticatedUserSignInPrompt } from "../../components/NonAuthenticatedUserSignInPrompt"
import { InitializingDisplay, ErrorDisplay, EmptyQuestionsDisplay } from "../../components/QuizStateDisplay"
import CodingQuiz from "./CodingQuiz"
import { createResultsPreview } from "./QuizHelpers"
import QuizResultPreview from "./QuizResultPreview"



/**
 * CodeQuizWrapper - Manages the quiz flow for both authenticated and non-authenticated users
 * 
 * Flow:
 * 1. For signed-in users: Show quiz -> Show results immediately after completion
 * 2. For non-signed-in users: Show quiz -> Prompt to sign in -> After sign-in, show results
 * 
 * State management:
 * - Persists quiz state during navigation
 * - Restores state after authentication
 * - Cleans up state after quiz completion
 */
export default function CodeQuizWrapper({ slug, quizId, userId, quizData }: CodeQuizWrapperProps) {
  const router = useRouter()
  const { status, fromAuth } = useAuth()
  const quiz = useQuiz()
  const dispatch = useAppDispatch() // Get dispatch directly
  const currentQuestion = quiz.quiz.currentQuestionData
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle initial quiz loading with auth state
  useEffect(() => {
    if (!quiz.quiz.data && !quiz.status.isLoading) {
      quiz.actions.loadQuiz(slug, "code", quizData).catch((error) => {
        if (error.status === 401 || error === "Unauthorized") {
          // Save state before redirecting to auth
          dispatch(saveAuthRedirectState({
            slug,
            quizId: quizId.toString(),
            type: "code",
            userAnswers: quiz.quiz.userAnswers,
            currentQuestion: quiz.quiz.currentQuestion,
            tempResults: quiz.tempResults
          }))
          signIn(undefined, { callbackUrl: `/dashboard/code/${slug}?fromAuth=true` })
        }
      })
    }
  }, [slug, quizData, quiz.quiz.data, quiz.status.isLoading, quizId, quiz, dispatch])

  // Restore state after authentication
  useEffect(() => {
    if (fromAuth && userId && quiz.quiz.data === null) {
      quiz.actions.loadQuiz(slug, "code", quizData)
    }
  }, [fromAuth, userId, slug, quizData, quiz.quiz.data, quiz.actions])

  // Handle retry action
  const handleRetry = useCallback(() => {
    if (!userId || status !== "authenticated") {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/code/${slug}`)}`)
    } else {
      quiz.actions.reset()
      router.refresh()
    }
  }, [userId, status, slug, router, quiz.actions])

  // Handle answer submission
  const handleAnswer = useCallback(
    (answer: string, timeSpent: number, isCorrect: boolean) => {
      if (!currentQuestion) return

      // Save the answer to Redux state
      quiz.actions.saveAnswer(currentQuestion.id, {
        answer,
        timeSpent,
        isCorrect,
        questionId: currentQuestion.id,
      })

      const isLastQuestion = quiz.quiz.isLastQuestion

      if (isLastQuestion) {
        // Create a preview of results for the last question
        const allAnswers = [
          ...quiz.quiz.userAnswers, 
          { questionId: currentQuestion.id, answer, isCorrect }
        ]
        
        const preview = createResultsPreview({
          questions: quiz.quiz.data?.questions || [],
          answers: allAnswers,
          quizTitle: quiz.quiz.data?.title || "",
          slug,
          type: "code"
        })

        // Store temporary results
        quiz.actions.setTempResults(preview)
        
        // For signed-in users, automatically submit
        if (userId && status === "authenticated") {
          handleSubmitQuiz()
        }
      } else {
        // Navigate to next question
        quiz.navigation.next()
      }
    },
    [quiz, currentQuestion, slug, userId, status]
  )

  // Handle quiz submission
  const handleSubmitQuiz = useCallback(
    async () => {
      try {
        setIsSubmitting(true)
        
        // Calculate total time spent
        const totalTime = quiz.quiz.userAnswers.reduce(
          (sum, a) => sum + (a.timeSpent || 0), 
          0
        )

        // Submit quiz to backend
        await quiz.actions.submitQuiz({
          slug,
          quizId,
          type: "code",
          answers: quiz.quiz.userAnswers,
          timeTaken: totalTime,
        })

        // Navigate to results page
        router.replace(`/dashboard/code/${slug}/results`)
        
        // Clean up quiz state
        setTimeout(() => {
          quiz.actions.reset()
        }, 500)
      } catch (error) {
        toast.error("Failed to submit quiz. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    },
    [quiz, slug, quizId, router]
  )

  // Handle sign-in action for non-authenticated users
  const handleShowSignIn = useCallback(() => {
    // Save quiz state to Redux before redirect
    dispatch(saveAuthRedirectState({
      slug,
      quizId: quizId.toString(),
      type: "code",
      userAnswers: quiz.quiz.userAnswers,
      currentQuestion: quiz.quiz.currentQuestion,
      tempResults: quiz.tempResults
    }))

    // Redirect to sign-in page
    signIn(undefined, {
      callbackUrl: `/dashboard/code/${slug}?fromAuth=true`,
    })
  }, [slug, quizId, quiz, dispatch])

  // Loading state
  if (quiz.status.isLoading || status === "loading" || isSubmitting) {
    return isSubmitting ? 
      <QuizSubmissionLoading quizType="code" /> : 
      <InitializingDisplay />
  }

  // Error state
  if (quiz.status.hasError) {
    return (
      <ErrorDisplay 
        error={quiz.status.errorMessage || "Failed to load quiz"} 
        onRetry={handleRetry} 
        onReturn={() => router.push("/dashboard")} 
      />
    )
  }

  // Empty questions state
  if (quiz.quiz.data?.questions.length === 0) {
    return <EmptyQuestionsDisplay onReturn={() => router.push("/dashboard")} />
  }

  // Non-authenticated user with completed quiz
  if (!userId && quiz.tempResults) {
    const resultPreview = QuizResultFactory.createResult('code', quiz.tempResults)
    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="code"
        onSignIn={handleShowSignIn}
        showSaveMessage
        message="Please sign in to submit your quiz and save your results"
        previewData={resultPreview.toPreview()}
      />
    )
  }

  // Authenticated user with completed quiz (preview before submission)
  if (userId && quiz.tempResults) {
    const resultData = QuizResultFactory.createResult('code', quiz.tempResults)
    return (
      <QuizResultPreview
        result={resultData.toFullResult()}
        onSubmit={handleSubmitQuiz}
        onCancel={() => quiz.actions.clearTempResults()}
        userAnswers={quiz.quiz.userAnswers}
        isSubmitting={isSubmitting}
      />
    )
  }

  // Quiz in progress
  if (currentQuestion) {
    const userAnswer = quiz.quiz.userAnswers.find(
      (a) => a.questionId === currentQuestion.id
    )?.answer
    
    return (
      <CodingQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={quiz.quiz.currentQuestion + 1}
        totalQuestions={quiz.quiz.data?.questions.length || 0}
        isLastQuestion={quiz.quiz.isLastQuestion}
        isSubmitting={quiz.status.isSubmitting || isSubmitting}
        existingAnswer={typeof userAnswer === "string" ? userAnswer : undefined}
      />
    )
  }

  // Default loading state
  return <InitializingDisplay />
}
