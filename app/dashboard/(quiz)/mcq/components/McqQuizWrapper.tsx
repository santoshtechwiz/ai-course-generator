"use client"

import { useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "sonner"

import McqQuiz from "./McqQuiz"
import { McqQuestion, QuizResultsPreview } from "./types"
import { AppDispatch, RootState } from "@/store"

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
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"


interface McqQuizWrapperProps {
  slug: string
  userId?: string | null
  quizData?: any
}

interface MCQAnswer {
  questionId: string | number
  selectedOptionId: string
  timestamp: number
  type: "mcq"
  isCorrect?: boolean
}

export default function McqQuizWrapper({ slug, quizData }: McqQuizWrapperProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Memoized Redux selectors for performance
  const questions = useSelector(selectQuestions) as McqQuestion[]
  const answers = useSelector(selectAnswers) as Record<string | number, MCQAnswer>
  const status = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isQuizComplete = useSelector(selectIsQuizComplete)
  const results = useSelector(selectQuizResults)
  const currentQuestionIndex = useSelector((state: RootState) => state.quiz.currentQuestionIndex)
  const quizId = useSelector((state: RootState) => state.quiz.quizId)
  const currentQuestion: McqQuestion | undefined = questions[currentQuestionIndex]

  // Submission tracking
  const submittingRef = useRef(false)

  // Memoized computed states
  const isLoading = status === "loading"
  const isSubmitting = status === "submitting" || submittingRef.current
  const hasError = status === "error"
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const hasValidQuestions = Array.isArray(questions) && questions.length > 0

  // Only reset quiz state on initial mount for this slug
  const didInitRef = useRef(false)
  useEffect(() => {
    if (!didInitRef.current) {
      dispatch({ type: "quiz/resetQuiz" })
      didInitRef.current = true
    }
  }, [dispatch])

  // Initialize quiz
  useEffect(() => {
    if (slug && !quizId && questions.length === 0 && status === "idle") {
      dispatch(fetchQuiz({ id: slug, data: quizData, type: "mcq" }))
    }
  }, [dispatch, slug, quizId, questions.length, status, quizData])

  // Handle reset parameter
  useEffect(() => {
    if (searchParams && typeof searchParams.get === "function" && searchParams.get("reset") === "true") {
      dispatch(setCurrentQuestionIndex(0))
    }
  }, [searchParams, dispatch])

  // Handle answer submission
  const handleAnswer = useCallback(
    (selectedOption: string) => {
      if (!currentQuestion) return

      // Determine if the answer is correct
      const isCorrect = selectedOption === currentQuestion.correctOptionId || 
                        selectedOption === currentQuestion.correctAnswer

      const answer: MCQAnswer = {
        questionId: currentQuestion.id,
        selectedOptionId: selectedOption,
        timestamp: Date.now(),
        type: "mcq",
        isCorrect
      }

      // Save answer to Redux
      dispatch(saveAnswer({ questionId: currentQuestion.id, answer }))
      
      // Navigate to next question with a slight delay for state update
      if (currentQuestionIndex < questions.length - 1) {
        requestAnimationFrame(() => {
          dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
        })
      }
    },
    [currentQuestion, currentQuestionIndex, questions.length, dispatch],
  )

  // Handle quiz submission with debounce
  const handleSubmitQuiz = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    
    try {
      const result = await dispatch(submitQuiz()).unwrap()
      console.log("Quiz submitted successfully:", result)
      router.push(`/dashboard/mcq/${slug}/results`)
    } catch (error) {
      console.error("Failed to submit quiz:", error)
      toast.error("Failed to submit quiz. Please try again.")
    } finally {
      submittingRef.current = false
    }
  }, [dispatch, router, slug])

  // Auto-submit when quiz is complete
  useEffect(() => {
    if (isQuizComplete && status === "idle" && !results && !submittingRef.current) {
      handleSubmitQuiz()
    }
  }, [isQuizComplete, status, results, handleSubmitQuiz])

  // Loading state
  if (isLoading) {
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
  if (hasError) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Fetching quiz data", status: "error", errorMsg: error || "Failed to load quiz" }
        ]}
      />
    )
  }

  // Empty questions state
  if (!hasValidQuestions) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "No questions available for this quiz", status: "error", errorMsg: "This quiz doesn't contain any questions. Please try another quiz." }
        ]}
      />
    )
  }

  // Show current question
  if (currentQuestion) {
    // Calculate the existing answer for this question
    const currentAnswerId = answers[currentQuestion.id]?.selectedOptionId

    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{currentQuestion.title || "Multiple Choice Quiz"}</h1>
        
        {/* Progress bar */}
        <div className="mb-6">
          <div className="bg-gray-100 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 text-right">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
        
        <McqQuiz
          question={currentQuestion}
          onAnswer={handleAnswer}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          isLastQuestion={isLastQuestion}
          isSubmitting={isSubmitting}
          existingAnswer={currentAnswerId}
        />
        
        {isQuizComplete && (
          <div className="mt-8 text-center">
            <Button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="px-6 py-3 transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  <span>Submitting...</span>
                </>
              ) : (
                "Submit Quiz"
              )}
            </Button>
          </div>
        )}
      </div>
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
