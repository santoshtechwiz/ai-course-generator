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

export default function CodeQuizWrapper({ quizData, slug, userId, quizId }: CodeQuizWrapperProps) {
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [restorationAttempted, setRestorationAttempted] = useState(false)

  const { quizState, initialize, submitAnswer, nextQuestion, completeQuiz, restoreState } = useQuiz()

  const validQuizData = useMemo(() => {
    if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) return null
    return quizData
  }, [quizData])

  useEffect(() => {
    if (hasInitialized) return

    const run = async () => {
      try {
        setInitError(null)
        if (!validQuizData) {
          setInitError("This quiz has no valid questions.")
          return
        }

        await initialize({
          id: validQuizData.id || quizId,
          quizId: validQuizData.quizId || quizId,
          slug,
          title: validQuizData.title || "Code Quiz",
          quizType: "code",
          questions: validQuizData.questions,
          requiresAuth: true,
        })
      } catch {
        setInitError("An error occurred while initializing the quiz.")
      } finally {
        setHasInitialized(true)
        setIsInitializing(false)
      }
    }

    run()
  }, [hasInitialized, validQuizData, quizId, slug, initialize])

  const handleAnswer = async (answer: string, timeSpent: number, isCorrect: boolean) => {
    try {
      const currentQuestion = quizState.questions[quizState.currentQuestionIndex] as CodeQuizQuestion

      submitAnswer({
        questionId: currentQuestion.id || String(quizState.currentQuestionIndex),
        answer,
        isCorrect,
        timeSpent,
        index: quizState.currentQuestionIndex,
        codeSnippet: answer,
        language: currentQuestion.language || "javascript",
      })

      const isLast = quizState.currentQuestionIndex + 1 >= quizState.questions.length

      if (isLast) {
        const answersArray = [
          ...(quizState.answers || []),
          {
            questionId: currentQuestion.id,
            question: currentQuestion.question || "",
            userAnswer: answer,
            isCorrect,
            timeSpent,
            index: quizState.currentQuestionIndex,
            codeSnippet: answer,
            language: currentQuestion.language || "javascript",
          },
        ]

        const correctAnswers = answersArray.filter((a) => a.isCorrect).length
        const score = Math.round((correctAnswers / answersArray.length) * 100)

        await completeQuiz({
          score,
          completedAt: new Date().toISOString(),
        })

        router.replace(`/dashboard/code/${slug}/results`)
      } else {
        nextQuestion()
      }
    } catch {
      setInitError("Failed to submit your answer. Please try again.")
    }
  }

  const currentQuestion = useMemo(() => {
    const idx = quizState.currentQuestionIndex
    return quizState.questions?.[idx] || null
  }, [quizState.questions, quizState.currentQuestionIndex])

  useEffect(() => {
    if (
      hasInitialized &&
      !restorationAttempted &&
      (!currentQuestion ||
        quizState.currentQuestionIndex < 0 ||
        quizState.currentQuestionIndex >= quizState.questions.length) &&
      !quizState.isCompleted
    ) {
      restoreState()
        .then((success) => {
          if (!success) {
            setInitError("Failed to restore your quiz progress.")
          }
        })
        .catch(() => {
          setInitError("Failed to restore quiz state.")
        })
        .finally(() => {
          setRestorationAttempted(true)
        })
    }
  }, [hasInitialized, restorationAttempted, currentQuestion, quizState, restoreState])

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
  if (quizState.error) {
    return (
      <ErrorDisplay
        error={quizState.error}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  if (!currentQuestion) return <InitializingDisplay message="Loading question..." />

  const questionToDisplay = validQuizData.questions[quizState.currentQuestionIndex]

  return (
    <CodingQuiz
      question={{
        ...questionToDisplay,
        id: questionToDisplay.id || `question-${quizState.currentQuestionIndex}`,
      }}
      onAnswer={handleAnswer}
      questionNumber={quizState.currentQuestionIndex + 1}
      totalQuestions={quizState.questions.length}
      isLastQuestion={quizState.currentQuestionIndex === quizState.questions.length - 1}
    />
  )
}
