"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FillInTheBlanksQuiz } from "./FillInTheBlanksQuiz"

import { QuizSubmissionFeedback } from "../../components/QuizSubmissionFeedback"
import type { QuizAnswer } from "../../components/QuizBase"
import BlankQuizResults from "./BlankQuizResults"

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
  onSubmitAnswer?: (answer: QuizAnswer) => void
  onComplete?: () => void
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
  const router = useRouter()
  const [startTime, setStartTime] = useState(Date.now())

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handleAnswer = (answer: string, timeSpent: number, hintsUsed: boolean) => {
    const newAnswer = { userAnswer: answer, timeSpent, hintsUsed }
    setAnswers((prev) => [...prev, newAnswer])

    // If this is the last question, prepare to show results
    if (isLastQuestion) {
      // If we're using the QuizBase component, call onComplete
      if (onSubmitAnswer && onComplete) {
        const isCorrect = answer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim()
        onSubmitAnswer({
          answer: answer,
          isCorrect,
          timeSpent,
        })
        onComplete()
        return
      }

      // Otherwise handle submission ourselves
      handleSubmitQuiz([...answers, newAnswer])
    } else {
      // Move to the next question
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1)
      }, 1000)
    }
  }

  const handleSubmitQuiz = async (finalAnswers: { userAnswer: string; timeSpent: number; hintsUsed: boolean }[]) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Calculate score based on correct answers
      const correctAnswers = finalAnswers.filter(
        (answer, index) => answer.userAnswer.toLowerCase().trim() === questions[index].answer.toLowerCase().trim(),
      ).length

      const totalTime = (Date.now() - startTime) / 1000

      // Submit to the correct API endpoint
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId,
          answers: finalAnswers,
          totalTime,
          score: correctAnswers,
          type: "fill-blanks",
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to submit quiz results"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          errorMessage = `${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      setIsSuccess(true)
    } catch (err) {
      console.error("Error submitting quiz:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
      setShowResults(true) // Always show results after submission attempt
    }
  }

  const handleRetry = () => {
    // Retry submission with the current answers
    handleSubmitQuiz(answers)
  }

  const handleContinue = () => {
    setShowResults(true)
  }

  // If we're showing results, render the results component
  if (showResults) {
    return (
      <BlankQuizResults
        questions={questions}
        answers={answers}
        quizId={quizId}
        slug={slug}
        title={title}
        onRestart={() => {
          setCurrentQuestionIndex(0)
          setAnswers([])
          setShowResults(false)
          setStartTime(Date.now())
        }}
      />
    )
  }

  // If we're using the QuizBase component, just render the quiz
  if (onSubmitAnswer && onComplete) {
    return (
      <FillInTheBlanksQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
      />
    )
  }

  // Otherwise render the quiz with our own submission handling
  return (
    <>
      <FillInTheBlanksQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
      />

      <QuizSubmissionFeedback
        isSubmitting={isSubmitting}
        isSuccess={isSuccess}
        error={error}
        onRetry={handleRetry}
        onContinue={handleContinue}
      />
    </>
  )
}
