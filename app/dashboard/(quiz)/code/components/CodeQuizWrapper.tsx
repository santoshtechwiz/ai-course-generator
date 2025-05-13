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
  LoadingDisplay,
  EmptyQuestionsDisplay,
} from "../../components/QuizStateDisplay"

import type { CodeQuizWrapperProps, CodeQuizQuestion } from "@/app/types/code-quiz-types"
import { calculateTotalTime } from "@/lib/utils/quiz-index"
import { formatQuizTime } from "@/lib/utils/quiz-performance"
import type { Answer } from "@/store/slices/quizSlice"

export default function CodeQuizWrapper({ quizData, slug, userId, quizId }: CodeQuizWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isInitializing, setIsInitializing] = useState<boolean>(true)

  const { quizState, isAuthenticated, initialize, requireAuthentication, submitAnswer, nextQuestion, completeQuiz } =
    useQuiz()

  const isReset = searchParams.get("reset") === "true"
  const fromAuth = searchParams.get("fromAuth") === "true"

  // Initialize quiz
  useEffect(() => {
    if (quizData && !isReset) {
      try {
        initialize({
          id: quizData.id || quizId,
          slug,
          title: quizData.title || "Code Quiz",
          quizType: "code",
          questions: quizData.questions || [],
          requiresAuth: true,
        })
      } catch (error) {
        console.error("Failed to initialize quiz:", error)
      }
    }

    // Skip initialization delay in test environment
    if (process.env.NODE_ENV === "test") {
      setIsInitializing(false)
      return
    }

    const timer = setTimeout(() => setIsInitializing(false), 500)
    return () => clearTimeout(timer)
  }, [initialize, quizData, quizId, slug, isReset])

  // Handle sign in
  const handleSignIn = () => {
    const redirectUrl = `/dashboard/code/${slug}?fromAuth=true`
    requireAuthentication(redirectUrl)
  }

  // Handle answer submission
  const handleAnswer = (answer: string, timeSpent: number, isCorrect: boolean) => {
    const currentQuestion = quizState.questions?.[quizState.currentQuestionIndex] as unknown as CodeQuizQuestion | undefined

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

    if (quizState.currentQuestionIndex === (quizState.questions?.length || 0) - 1) {
      // Last question, complete the quiz
      const answersArray = [
        ...((quizState.answers as Answer[]) || []),
        {
          questionId: currentQuestion.id || String(quizState.currentQuestionIndex),
          question: currentQuestion.question || "",
          answer,
          isCorrect,
          timeSpent,
          index: quizState.currentQuestionIndex,
          codeSnippet: answer,
          language: currentQuestion.language || "javascript",
        },
      ]

      const correctAnswers = answersArray.filter((a) => a?.isCorrect).length
      const score = Math.round((correctAnswers / (quizState.questions?.length || 1)) * 100)

      completeQuiz({
        answers: answersArray,
        score,
        completedAt: new Date().toISOString(),
      })
    } else {
      // Move to next question
      nextQuestion()
    }
  }

  // Create result object for CodeQuizResult component
  const resultObject = useMemo(() => {
    if (!quizState.isCompleted) return null

    const answersArray = (quizState.answers as Answer[]) || []
    const correctAnswers = answersArray.filter((a) => a?.isCorrect).length
    const totalTimeSpent = calculateTotalTime(answersArray.filter(Boolean))

    return {
      quizId: quizId || quizState.quizId || "",
      slug: slug || "",
      score: quizState.score || 0,
      totalQuestions: quizState.questions?.length || 0,
      correctAnswers,
      totalTimeSpent,
      formattedTimeSpent: formatQuizTime(totalTimeSpent),
      completedAt: quizState.completedAt || new Date().toISOString(),
      answers: answersArray.filter(Boolean).map((answer) => ({
        questionId: answer?.questionId || "",
        question: answer?.question || "",
        answer: answer?.answer || "",
        isCorrect: answer?.isCorrect || false,
        timeSpent: answer?.timeSpent || 0,
        codeSnippet: answer?.codeSnippet || "",
        language: answer?.language || "javascript",
      })),
    }
  }, [quizState, quizId, slug])

  // Get current question
  const currentQuestion = useMemo(() => {
    if (!quizState.questions || quizState.questions.length === 0) return null
    return quizState.questions[quizState.currentQuestionIndex] as unknown as CodeQuizQuestion | null
  }, [quizState.questions, quizState.currentQuestionIndex])

  // Determine if this is the last question
  const isLastQuestion = useMemo(() => {
    return quizState.currentQuestionIndex === (quizState.questions?.length || 0) - 1
  }, [quizState.currentQuestionIndex, quizState.questions])

  // Render based on state
  if (isInitializing) {
    return <InitializingDisplay data-testid="initializing-display" />
  }

  if (!slug) {
    return <QuizNotFoundDisplay data-testid="not-found-display" onReturn={() => router.push("/dashboard/quizzes")} />
  }

  if (!quizData?.questions || quizData.questions.length === 0) {
    return (
      <EmptyQuestionsDisplay data-testid="empty-questions-display" onReturn={() => router.push("/dashboard/quizzes")} />
    )
  }

  if (quizState.error) {
    return (
      <ErrorDisplay
        data-testid="error-display"
        error={quizState.error}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  if (quizState.isCompleted && !isAuthenticated && !fromAuth) {
    return (
      <NonAuthenticatedUserSignInPrompt
        data-testid="guest-sign-in-prompt"
        onSignIn={handleSignIn}
        quizType="code quiz"
        showSaveMessage
      />
    )
  }

  if (quizState.isCompleted && resultObject) {
    return <CodeQuizResult data-testid="quiz-results" result={resultObject} />
  }

  if (!currentQuestion) {
    return (
      <ErrorDisplay
        data-testid="question-error-display"
        error="Failed to load quiz questions. Please try again."
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  return (
    <CodingQuiz
      data-testid="coding-quiz"
      question={{
        ...quizData.questions[quizState.currentQuestionIndex],
        id: quizData.questions[quizState.currentQuestionIndex]?.id || "unknown-id",
      }}
      onAnswer={handleAnswer}
      questionNumber={quizState.currentQuestionIndex + 1}
      totalQuestions={quizState.questions?.length || 0}
      isLastQuestion={isLastQuestion}
    />
  )
}
