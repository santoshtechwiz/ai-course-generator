"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuiz } from "@/hooks/useQuizState"
import CodingQuiz from "./CodingQuiz"
import {
  InitializingDisplay,
  QuizNotFoundDisplay,
  ErrorDisplay,
  EmptyQuestionsDisplay,
} from "../../components/QuizStateDisplay"
import type { CodeQuizWrapperProps, CodeQuizQuestion } from "@/app/types/code-quiz-types"

export default function CodeQuizWrapper({ quizData: initialQuizData, slug, userId, quizId }: CodeQuizWrapperProps) {
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  const {
    quizData,
    currentQuestion,
    isCompleted,
    error: quizError,
    nextQuestion,
    submitAnswer,
    submitQuiz,
    loadQuiz,
  } = useQuiz()

  // Prefer quizData from state, fallback to initialQuizData
  const validQuizData = useMemo(() => {
    const data = quizData || initialQuizData
    if (!data || !Array.isArray(data.questions) || data.questions.length === 0) return null
    return data
  }, [quizData, initialQuizData])

  useEffect(() => {
    if (hasInitialized) return

    const run = async () => {
      try {
        setInitError(null)
        // Only load if quizData is not present
        if (!quizData) {
          if (!initialQuizData || !Array.isArray(initialQuizData.questions) || initialQuizData.questions.length === 0) {
            setInitError("This quiz has no valid questions.")
            return
          }
          await loadQuiz(slug, "code")
        }
      } catch {
        setInitError("An error occurred while initializing the quiz.")
      } finally {
        setHasInitialized(true)
        setIsInitializing(false)
      }
    }

    run()
    // Only run when quizData, initialQuizData, slug, or loadQuiz changes
  }, [hasInitialized, quizData, initialQuizData, slug, loadQuiz])

  const handleAnswer = async (answer: string, timeSpent: number, isCorrect: boolean) => {
    try {
      const currentQ = validQuizData.questions[currentQuestion] as CodeQuizQuestion

      await submitAnswer({
        questionId: currentQ.id || String(currentQuestion),
        answer,
        isCorrect,
        timeSpent,
        index: currentQuestion,
        codeSnippet: answer,
        language: currentQ.language || "javascript",
        slug,
      })

      const isLast = currentQuestion + 1 >= validQuizData.questions.length

      if (isLast) {
        await submitQuiz()
        router.replace(`/dashboard/code/${slug}/results`)
      } else {
        nextQuestion()
      }
    } catch {
      setInitError("Failed to submit your answer. Please try again.")
    }
  }

  const currentQuestionObj = useMemo(() => {
    if (!validQuizData) return null
    return validQuizData.questions?.[currentQuestion] || null
  }, [validQuizData, currentQuestion])

  if (initError) {
    return (
      <ErrorDisplay
        error={initError}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  if (isInitializing || !hasInitialized) return <InitializingDisplay />
  if (!slug) return <QuizNotFoundDisplay onReturn={() => router.push("/dashboard/quizzes")} />
  if (!validQuizData) {
    return (
      <EmptyQuestionsDisplay
        message="No Questions Available"
        description="We couldn't find any questions for this quiz. This could be because the quiz is still being generated or there was an error."
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }
  if (quizError) {
    return (
      <ErrorDisplay
        error={quizError}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  if (!currentQuestionObj) return <InitializingDisplay message="Loading question..." />

  return (
    <CodingQuiz
      question={{
        ...currentQuestionObj,
        id: currentQuestionObj.id || `question-${currentQuestion}`,
      }}
      onAnswer={handleAnswer}
      questionNumber={currentQuestion + 1}
      totalQuestions={validQuizData.questions.length}
      isLastQuestion={currentQuestion === validQuizData.questions.length - 1}
    />
  )
}
