"use client"

import { useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "sonner"
import { NonAuthenticatedUserSignInPrompt } from "../../components/NonAuthenticatedUserSignInPrompt"
import CodingQuiz from "./CodingQuiz"

import { selectQuestions, selectAnswers, selectQuizStatus, selectQuizError, selectIsQuizComplete, selectQuizResults, setCurrentQuestionIndex, fetchQuiz, saveAnswer, submitQuiz } from "@/store/slices/quizSlice"
import { selectIsAuthenticated } from "@/store/slices/authSlice"
import { signIn } from "next-auth/react"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"

interface CodeQuizWrapperProps {
  slug: string
  quizId?: string | number
  userId?: string | null
  quizData?: any
}

export default function CodeQuizWrapper({ slug, quizId, quizData }: CodeQuizWrapperProps) {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()

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

  // Fetch quiz data from API via slice
  useEffect(() => {
    if (slug && !quizId) {
      dispatch(fetchQuiz({ id: slug, data: quizData, type: "code" }))
    }
  }, [dispatch, slug, quizId, quizData])

  // Handle reset parameter
  useEffect(() => {
    if (searchParams?.get("reset") === "true") {
      dispatch(setCurrentQuestionIndex(0))
    }
  }, [searchParams, dispatch])

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
  const handleSubmitQuiz = useCallback(async () => {
    try {
      await dispatch(submitQuiz()).unwrap()
      router.push(`/dashboard/code/${slug}/results`)
    } catch {
      toast.error("Failed to submit quiz. Please try again.")
    }
  }, [dispatch, router, slug])

  // Handle sign-in action for non-authenticated users
  const handleShowSignIn = useCallback(() => {
    signIn(undefined, {
      callbackUrl: `/dashboard/code/${slug}?fromAuth=true`,
    })
  }, [slug])

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

  // Non-authenticated user with completed quiz
  if (!isAuthenticated && results) {
    return (
      <NonAuthenticatedUserSignInPrompt
        onSignIn={handleShowSignIn}
        
        message="Please sign in to submit your quiz and save your results"
      />
    )
  }

  // Authenticated user with completed quiz (preview before submission)

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
