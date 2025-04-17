"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { FillInTheBlanksQuiz } from "./FillInTheBlanksQuiz"
import BlankQuizResults from "./BlankQuizResults"
import { QuizFeedback } from "../../components/QuizFeedback"

interface Question {
  id: number
  question: string
  answer: string
  openEndedQuestion: {
    hints: string[]
    difficulty: string
    tags: string[]
    inputType: string
  }
}

interface BlankQuizWrapperProps {
  questions: Question[]
  quizId: string
  slug: string
  title: string
  onSubmitAnswer?: (answer: { userAnswer: string; timeSpent: number; hintsUsed: boolean }) => void
  onComplete?: (score: number) => void
}

export function BlankQuizWrapper({
  questions,
  quizId,
  slug,
  title,
  onSubmitAnswer,
  onComplete,
}: BlankQuizWrapperProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ userAnswer: string; timeSpent: number; hintsUsed: boolean }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const router = useRouter()
  const [startTime, setStartTime] = useState(Date.now())
  const [isCompleted, setIsCompleted] = useState(false)
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated"

  const currentQuestion = questions[currentQuestionIndex] || null
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handleAnswer = (answer: string, timeSpent: number, hintsUsed: boolean) => {
    const newAnswer = { userAnswer: answer, timeSpent, hintsUsed }
    setAnswers((prev) => [...prev, newAnswer])
    onSubmitAnswer?.(newAnswer)

    if (isLastQuestion) {
      setShowFeedback(true)
      handleSubmitQuiz([...answers, newAnswer])
    } else {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handleSubmitQuiz = async (finalAnswers: { userAnswer: string; timeSpent: number; hintsUsed: boolean }[]) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const correctAnswers = finalAnswers.filter(
        (answer, index) => answer.userAnswer.toLowerCase().trim() === questions[index]?.answer?.toLowerCase().trim(),
      ).length

      const totalTime = (Date.now() - startTime) / 1000
      const score = (correctAnswers / questions.length) * 100

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `quiz_result_${quizId}`,
          JSON.stringify({
            answers: finalAnswers,
            score,
            totalTime,
            timestamp: Date.now(),
            isCompleted: true,
          }),
        )
      }

      setIsSuccess(true)
      setIsCompleted(true)
      onComplete?.(score)
    } catch (err) {
      console.error("Error submitting quiz:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinue = () => {
    if (!isLoggedIn) {
      // If not logged in, prompt for login
      router.push(`/auth/signin?callbackUrl=/dashboard/blanks/${slug}`)
      // Clear the cached results for guest users
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`quiz_result_${quizId}`)
      }
    } else {
      // For logged in users, show results
      setShowFeedback(false)
      setShowResults(true)
    }
  }

  const handleRestart = () => {
    // Clear all cached data when restarting
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`quiz_result_${quizId}`)
    }
    router.refresh()
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedResult = sessionStorage.getItem(`quiz_result_${quizId}`)
      if (storedResult) {
        try {
          const parsedResult = JSON.parse(storedResult)
          if (Date.now() - parsedResult.timestamp < 30 * 60 * 1000) {
            if (parsedResult.answers) {
              setAnswers(parsedResult.answers)
            }
            if (parsedResult.isCompleted) {
              setIsCompleted(true)
              setShowResults(true)
            }
          } else {
            sessionStorage.removeItem(`quiz_result_${quizId}`)
          }
        } catch (e) {
          console.error("Error parsing stored quiz result:", e)
        }
      }
    }
  }, [quizId])

  const clearGuestData = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`quiz_result_${quizId}`)
    }
  }

  if (showFeedback) {
    return (
      <QuizFeedback
        isSubmitting={isSubmitting}
        isSuccess={isSuccess}
        isError={!!error}
        onContinue={handleContinue}
        score={0}
        totalQuestions={questions.length}
        quizType="fill-blanks"
      />
    )
  }

  if (showResults) {
    return (
      <BlankQuizResults
        answers={answers.map(({ userAnswer, ...rest }) => ({ answer: userAnswer, ...rest }))}
        questions={questions}
        onRestart={handleRestart}
        onComplete={onComplete || (() => {})}
        quizId={quizId}
        title={title}
        slug={slug}
        clearGuestData={!isLoggedIn ? clearGuestData : undefined}
      />
    )
  }

  return currentQuestion ? (
    <FillInTheBlanksQuiz
      question={currentQuestion}
      onAnswer={handleAnswer}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={questions.length}
    />
  ) : null
}
