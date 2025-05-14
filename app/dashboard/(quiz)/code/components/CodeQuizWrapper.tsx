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
  const [restorationAttempted, setRestorationAttempted] = useState(false)

  // Destructure state and actions from useQuiz
  const {
    quizData,
    currentQuestion,
    isCompleted,
    error: quizError,
    nextQuestion,
    submitAnswer,
    submitQuiz,
    resetQuizState,
    loadQuiz,
    // ...other actions if needed
  } = useQuiz()

  // Use quizData from state if available, otherwise fallback to prop
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
        if (!validQuizData) {
          setInitError("This quiz has no valid questions.")
          return
        }

        await loadQuiz(slug, "code")
      } catch {
        setInitError("An error occurred while initializing the quiz.")
      } finally {
        setHasInitialized(true)
        setIsInitializing(false)
      }
    }

    run()
  }, [hasInitialized, validQuizData, quizId, slug, loadQuiz])

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
        // Calculate score
        // (Assume answers are in quizData.userAnswers or similar, adjust as needed)
        // If you have a selector for answers, use it here
        // For now, just call submitQuiz and redirect
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

  // Restoration logic can be added here if needed

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
  if (!validQuizData) return <EmptyQuestionsDisplay onReturn={() => router.push("/dashboard/quizzes")} />
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
