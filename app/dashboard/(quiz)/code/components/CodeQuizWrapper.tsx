"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuiz } from "@/hooks/useQuizState"
import CodingQuiz from "./CodingQuiz"
import CodeQuizResult from "./CodeQuizResult"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"
import {
  InitializingDisplay,
  QuizNotFoundDisplay,
  ErrorDisplay,
  EmptyQuestionsDisplay,
} from "../../components/QuizStateDisplay"

import type { CodeQuizWrapperProps, CodeQuizQuestion } from "@/app/types/code-quiz-types"
import { calculateTotalTime } from "@/lib/utils/quiz-index"
import { formatQuizTime } from "@/lib/utils/quiz-performance"
import type { Answer } from "@/store/slices/quizSlice"

export default function CodeQuizWrapper({ quizData, slug, userId, quizId }: CodeQuizWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isInitializing, setIsInitializing] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)

  const isReset = searchParams.get("reset") === "true"
  const fromAuth = searchParams.get("fromAuth") === "true"

  const {
    quizState,
    isAuthenticated,
    initialize,
    requireAuthentication,
    submitAnswer,
    nextQuestion,
    completeQuiz,
    restoreState,
  } = useQuiz()

  // Handle quiz init or restore
  useEffect(() => {
    if (hasInitialized) return

    const run = async () => {
      if (fromAuth && isAuthenticated) {
        await restoreState()
      } else if (!fromAuth && quizData && !isReset) {
        initialize({
          id: quizData.id || quizId,
          slug,
          title: quizData.title || "Code Quiz",
          quizType: "code",
          questions: quizData.questions || [],
          requiresAuth: true,
        })
      }

      setHasInitialized(true)
      setIsInitializing(false)
    }

    run()
  }, [
    hasInitialized,
    fromAuth,
    isAuthenticated,
    quizData,
    isReset,
    quizId,
    slug,
    initialize,
    restoreState,
  ])

  // Handle submission of answer
  const handleAnswer = (answer: string, timeSpent: number, isCorrect: boolean) => {
    const currentQuestion = quizState.questions?.[quizState.currentQuestionIndex] as CodeQuizQuestion

    if (!currentQuestion) {
      console.error("Current question is undefined")
      return
    }

    submitAnswer({
      questionId: currentQuestion.id || String(quizState.currentQuestionIndex),
      answer,
      isCorrect,
      timeSpent,
      index: quizState.currentQuestionIndex,
      codeSnippet: answer,
      language: currentQuestion.language || "javascript",
    })

    const isLast = quizState.currentQuestionIndex + 1 >= (quizState.questions?.length || 0)

    if (isLast) {
      const answersArray = [
        ...(quizState.answers || []),
        {
          questionId: currentQuestion.id || String(quizState.currentQuestionIndex),
          question: currentQuestion.question || "",
          userAnswer: answer,
          isCorrect,
          timeSpent,
          index: quizState.currentQuestionIndex,
          codeSnippet: answer,
          language: currentQuestion.language || "javascript",
        },
      ]

      const correctAnswers = answersArray.filter((a) => a?.isCorrect).length
      const score = Math.round((correctAnswers / answersArray.length) * 100)

      completeQuiz({
        score,
        completedAt: new Date().toISOString(),
      })
    } else {
      nextQuestion()
    }
  }

  // Prepare result object
  const resultObject = useMemo(() => {
    if (!quizState.isCompleted) return null

    const answersArray = (quizState.answers || []) as Answer[]
    const correctAnswers = answersArray.filter((a) => a?.isCorrect).length
    const totalTimeSpent = calculateTotalTime(answersArray)

    return {
      quizId: quizId || quizState.quizId || "",
      slug: slug || "",
      score: quizState.score || 0,
      totalQuestions: quizState.questions?.length || 0,
      correctAnswers,
      totalTimeSpent,
      formattedTimeSpent: formatQuizTime(totalTimeSpent),
      completedAt: quizState.completedAt || new Date().toISOString(),
      answers: answersArray
        .filter(Boolean) // Filter out null/undefined answers
        .map((a) => ({
          questionId: a.questionId || "",
          question: a.question || "",
          answer: a.answer || "",
          isCorrect: a.isCorrect || false,
          timeSpent: a.timeSpent || 0,
          codeSnippet: a.codeSnippet || "",
          language: a.language || "javascript",
        })),
    }
  }, [quizState, quizId, slug])

  // Get current question
  const currentQuestion = useMemo(() => {
    const idx = quizState.currentQuestionIndex
    return quizState.questions?.[idx] as CodeQuizQuestion
  }, [quizState.questions, quizState.currentQuestionIndex])

  // === Attempt to restore state if currentQuestion is invalid ===
  useEffect(() => {
    if (
      hasInitialized &&
      (!currentQuestion ||
        quizState.currentQuestionIndex < 0 ||
        (quizData &&
          Array.isArray(quizData.questions) &&
          quizState.currentQuestionIndex >= quizData.questions.length)) &&
      !quizState.isCompleted &&
      typeof restoreState === "function"
    ) {
      restoreState()
    }
  }, [
    hasInitialized,
    currentQuestion,
    quizState.currentQuestionIndex,
    quizData,
    quizState.isCompleted,
    restoreState,
  ])

  // === Redirect to results page after completion (if authenticated or fromAuth) ===
  useEffect(() => {
    if (quizState.isCompleted && (isAuthenticated || fromAuth)) {
      router.replace(`/dashboard/code/${slug}/results`)
    }
  }, [quizState.isCompleted, isAuthenticated, fromAuth, router, slug])

  // === UI RENDER HANDLING ===

  if (isInitializing || !hasInitialized) {
    return <InitializingDisplay data-testid="initializing-display" />
  }

  if (!slug) {
    return <QuizNotFoundDisplay onReturn={() => router.push("/dashboard/quizzes")} />
  }

  // Defensive: quizData must exist and have questions as a non-empty array
  if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    return (
      <EmptyQuestionsDisplay
        onReturn={() => router.push("/dashboard/quizzes")}
        message="No quiz questions found. Please check the quiz configuration."
      />
    )
  }

  if (quizState.error) {
    return (
      <ErrorDisplay
        error={quizState.error}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  if (quizState.isCompleted && !isAuthenticated && !fromAuth) {
    return (
      <NonAuthenticatedUserSignInPrompt
        onSignIn={() =>
          requireAuthentication(`/dashboard/code/${slug}?fromAuth=true`)
        }
        quizType="code quiz"
        showSaveMessage
      />
    )
  }

  // Defensive: check currentQuestion and quizData.questions index
  if (
    !currentQuestion ||
    quizState.currentQuestionIndex < 0 ||
    quizState.currentQuestionIndex >= quizData.questions.length
  ) {
    return (
      <ErrorDisplay
        error="Failed to load quiz questions. Please try again or contact support if the problem persists."
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  return (
    <CodingQuiz
      question={{
        ...quizData.questions[quizState.currentQuestionIndex],
        id: quizData.questions[quizState.currentQuestionIndex]?.id || "unknown-id",
      }}
      onAnswer={handleAnswer}
      questionNumber={quizState.currentQuestionIndex + 1}
      totalQuestions={quizState.questions?.length || 0}
      isLastQuestion={quizState.currentQuestionIndex === (quizState.questions?.length || 1) - 1}
    />
  )
}
