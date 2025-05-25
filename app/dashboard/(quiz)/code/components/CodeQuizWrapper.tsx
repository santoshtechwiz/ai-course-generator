"use client"

import { useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "sonner"
import CodingQuiz from "./CodingQuiz"

import { 
  selectQuestions, 
  selectAnswers, 
  selectQuizStatus, 
  selectQuizError, 
  selectIsQuizComplete, 
  selectQuizResults, 
  setCurrentQuestionIndex, 
  fetchQuiz, 
  saveAnswer, 
  submitQuiz 
} from "@/store/slices/quizSlice"
import { selectIsAuthenticated } from "@/store/slices/authSlice"
import { signIn } from "next-auth/react"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"
import React from 'react'


interface CodeQuizWrapperProps {
  slug: string
  quizId?: string | number
  userId?: string | null
  quizData?: any
}

export default function CodeQuizWrapper({ slug, quizId, quizData }: CodeQuizWrapperProps) {
  const dispatch = useDispatch()
  const router = useRouter()

  // Redux state
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const status = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isQuizComplete = useSelector(selectIsQuizComplete)
  const results = useSelector(selectQuizResults)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const currentQuestionIndex = useSelector((state: any) => state.quiz.currentQuestionIndex)
  const currentQuestion = questions[currentQuestionIndex]

  // Only reset quiz state on initial mount for this slug/quizId
  const didInitRef = useRef(false)
  useEffect(() => {
    if (!didInitRef.current) {
      dispatch({ type: "quiz/resetQuiz" })
      didInitRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, slug, quizId])

  // Fetch quiz data from API via slice (only if not already loaded)
  useEffect(() => {
    if (slug && !quizId && questions.length === 0 && status === "idle") {
      dispatch(fetchQuiz({ id: slug, data: quizData, type: "code" }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, slug, quizId, quizData])

  // Handle answer submission
  const handleAnswer = useCallback(
    async (answerText: string, timeSpent: number, isCorrect: boolean) => {
      if (!currentQuestion) return

      const answer = {
        questionId: currentQuestion.id,
        answer: answerText,
        isCorrect,
        timeSpent,
        timestamp: Date.now(),
        type: "code"
      }

      try {
        await dispatch(saveAnswer({ questionId: currentQuestion.id, answer })).unwrap()
        if (currentQuestionIndex < questions.length - 1) {
          dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
        }
      } catch {
        toast.error("Failed to save answer. Please try again.")
      }
    },
    [currentQuestion, currentQuestionIndex, questions.length, dispatch]
  )

  // Handle quiz submission
  const submittingRef = useRef(false)
  const handleSubmitQuiz = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      await dispatch(submitQuiz()).unwrap()
      router.push(`/dashboard/code/${slug}/results`)
    } catch {
      toast.error("Failed to submit quiz. Please try again.")
    } finally {
      submittingRef.current = false
    }
  }, [dispatch, router, slug])

  // Handle sign-in action for non-authenticated users
  const handleShowSignIn = useCallback(() => {
    signIn(undefined, {
      callbackUrl: `/dashboard/code/${slug}?fromAuth=true`,
    })
  }, [slug])

  // Auto-submit for authenticated users when quiz is complete and not already submitting/results
  useEffect(() => {
    if (isAuthenticated && isQuizComplete && status === "idle" && !results) {
      handleSubmitQuiz()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isQuizComplete, status, results])

  // Loading state
  if (status === "loading") {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Fetching quiz data", status: "loading" },
          { label: "Preparing questions", status: "pending" },
        ]}
      />
    )
  }

  // Error state
  if (error) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Fetching quiz data", status: "error", errorMsg: error }
        ]}
      />
    )
  }

  // Empty questions state
  if (questions.length === 0) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "No questions available for this quiz", status: "error", errorMsg: "This quiz doesn't contain any questions. Please try another quiz." }
        ]}
      />
    )
  }

  // Show sign-in prompt for completed quiz (unauthenticated users)
  if (!isAuthenticated && isQuizComplete) {
    // Create a preview of the results
    const questionResults = questions.map(q => {
      const answer = answers[q.id]
      return {
        id: q.id,
        question: q.text || q.question || "",
        userAnswer: answer?.answer || "",
        correctAnswer: q.correctAnswer || q.answer || "",
        isCorrect: answer?.isCorrect ?? false
      }
    })
    const score = questionResults.filter(q => q.isCorrect).length
    const preview = {
      title: quizData?.title || "",
      score,
      maxScore: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      questions: questionResults,
      slug
    }
    return (
      <div className="py-8">
        <div className="mb-4">
          <strong>Please sign in to submit your quiz and save your results.</strong>
        </div>
        <button
          className="bg-primary text-white px-4 py-2 rounded"
          onClick={handleShowSignIn}
        >
          Sign In to Save Results
        </button>
        {/* Optionally show preview */}
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Quiz Preview</h3>
          <ul className="text-sm">
            {questionResults.map((q, i) => (
              <li key={q.id}>
                Q{i + 1}: {q.question} <br />
                Your answer: {q.userAnswer} <br />
                Correct: {q.isCorrect ? "Yes" : "No"}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  // Quiz in progress
  if (currentQuestion) {
    const userAnswer = answers[currentQuestion.id]?.answer

    return (
      <CodingQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        isLastQuestion={currentQuestionIndex === questions.length - 1}
        isSubmitting={status === "submitting"}
        existingAnswer={typeof userAnswer === "string" ? userAnswer : undefined}
      />
    )
  }

  // Fallback
  return (
    <QuizLoadingSteps
      steps={[
        { label: "Initializing quiz", status: "loading" }
      ]}
    />
  )
}