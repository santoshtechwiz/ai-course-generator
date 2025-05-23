"use client"

import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useQuiz } from "@/hooks/useQuizState"
import { toast } from "sonner"
import { signIn } from "next-auth/react"
import { InitializingDisplay, EmptyQuestionsDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import { QuizSubmissionLoading } from "../../components/QuizSubmissionLoading"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"
import CodingQuiz from "./CodingQuiz"
import QuizResultPreview from "./QuizResultPreview"
import { createResultsPreview } from "./QuizHelpers"
import type { CodeQuizWrapperProps } from "@/app/types/code-quiz-types"
import { saveAuthRedirectState } from "@/store/slices/quizSlice"

export default function CodeQuizWrapper({ slug, quizId, userId, quizData }: CodeQuizWrapperProps) {
  const router = useRouter()
  const { status, fromAuth } = useAuth()
  const quiz = useQuiz()
  const currentQuestion = quiz.quiz.currentQuestionData

  // Handle initial quiz loading with auth state
  useEffect(() => {
    if (!quiz.quiz.data && !quiz.status.isLoading) {
      quiz.actions.loadQuiz(slug, "code", quizData).catch((error) => {
        if (error.status === 401) {
          // Save state before redirecting to auth
          quiz.dispatch(saveAuthRedirectState({
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
  }, [slug, quizData, quiz.quiz.data, quiz.status.isLoading])

  // Restore state after auth
  useEffect(() => {
    if (fromAuth && userId && quiz.quiz.data === null) {
      quiz.actions.loadQuiz(slug, "code", quizData)
    }
  }, [fromAuth, userId, slug, quizData])

  const handleRetry = useCallback(() => {
    if (!userId || status !== "authenticated") {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/code/${slug}`)}`)
    } else {
      quiz.actions.reset()
      router.refresh()
    }
  }, [userId, status, slug, router, quiz.actions])

  const handleAnswer = useCallback(
    (answer: string, timeSpent: number, isCorrect: boolean) => {
      if (!currentQuestion) return

      quiz.actions.saveAnswer(currentQuestion.id, {
        answer,
        timeSpent,
        isCorrect,
        questionId: currentQuestion.id,
      })

      const last = quiz.quiz.isLastQuestion

      if (last) {
        const preview = createResultsPreview({
          questions: quiz.quiz.data?.questions || [],
          answers: [...quiz.quiz.userAnswers, { questionId: currentQuestion.id, answer, isCorrect }],
          quizTitle: quiz.quiz.data?.title || "",
          slug,
        })

        // Use the actions API to set temp results
        quiz.actions.setTempResults({
          ...preview,
          slug,
          quizId,
          type: "code",
          answers: quiz.quiz.userAnswers,
        })
      } else {
        quiz.navigation.next()
      }
    },
    [quiz, currentQuestion, quizId, slug],
  )

  const handleSubmitQuiz = useCallback(
    async () => {
      const totalTime = quiz.quiz.userAnswers.reduce((sum, a) => sum + (a.timeSpent || 0), 0)

      await quiz.actions.submitQuiz({
        slug,
        quizId,
        type: "code",
        answers: quiz.quiz.userAnswers,
        timeTaken: totalTime,
      })

      router.replace(`/dashboard/code/${slug}/results`)
    },
    [quiz, slug, quizId, router],
  )

  const handleShowSignIn = useCallback(() => {
    // Save quiz state to Redux before redirect
    quiz.dispatch(saveAuthRedirectState({
      slug,
      quizId: quizId.toString(),
      type: "code",
      userAnswers: quiz.quiz.userAnswers,
      currentQuestion: quiz.quiz.currentQuestion,
      tempResults: quiz.tempResults
    }))

    signIn(undefined, {
      callbackUrl: `/dashboard/code/${slug}?fromAuth=true`,
    })
  }, [slug, quizId, quiz])

  // Add effect to restore state after auth
  useEffect(() => {
    if (fromAuth && userId) {
      // State will be automatically restored by middleware
      console.log('Restored quiz state after authentication')
    }
  }, [fromAuth, userId])

  if (quiz.status.hasError) {
    return <ErrorDisplay error={quiz.status.errorMessage} onRetry={handleRetry} onReturn={() => router.push("/dashboard")} />
  }

  if (quiz.status.isLoading || status === "loading") {
    return <InitializingDisplay />
  }

  if (quiz.quiz.data?.questions.length === 0) {
    return <EmptyQuestionsDisplay onReturn={() => router.push("/dashboard")} />
  }

  if (!userId && quiz.tempResults) {
    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="code"
        onSignIn={handleShowSignIn}
        showSaveMessage
        message="Please sign in to submit your quiz"
        previewData={quiz.tempResults}
      />
    )
  }

  if (quiz.status.isSubmitting) {
    return <QuizSubmissionLoading quizType="code" />
  }

  if (quiz.tempResults) {
    return (
      <QuizResultPreview
        result={quiz.tempResults}
        onSubmit={handleSubmitQuiz}
        onCancel={() => quiz.actions.clearTempResults()}
        userAnswers={quiz.quiz.userAnswers}
      />
    )
  }

  if (currentQuestion) {
    const userAnswer = quiz.quiz.userAnswers.find((a) => a.questionId === currentQuestion.id)?.answer
    return (
      <CodingQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={quiz.quiz.currentQuestion + 1}
        totalQuestions={quiz.quiz.data?.questions.length || 0}
        isLastQuestion={quiz.quiz.isLastQuestion}
        isSubmitting={quiz.status.isSubmitting}
        existingAnswer={typeof userAnswer === "string" ? userAnswer : undefined}
      />
    )
  }

  return <InitializingDisplay />
}
