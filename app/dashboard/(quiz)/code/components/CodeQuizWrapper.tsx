"use client"

import { useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "sonner"
import CodingQuiz from "./CodingQuiz"
import { AppDispatch } from "@/store"
import { CodeQuizQuestion } from "@/app/types/quiz-types"

import { 
  selectQuestions, 
  selectAnswers, 
  selectQuizStatus, 
  selectQuizError, 
  selectIsQuizComplete, 
  selectQuizResults,
  selectQuizTitle,
  setCurrentQuestionIndex, 
  fetchQuiz, 
  saveAnswer, 
  submitQuiz 
} from "@/store/slices/quizSlice"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"
import { Button } from "@/components/ui/button"

interface CodeQuizWrapperProps {
  slug: string;
  quizId?: string | number;
  quizData?: any;
}

interface CodeQuizAnswer {
  questionId: string | number;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  timestamp: number;
  type: string;
}

export default function CodeQuizWrapper({ slug, quizId, quizData }: CodeQuizWrapperProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  // Redux state with proper types
  const questions = useSelector(selectQuestions) as CodeQuizQuestion[]
  const answers = useSelector(selectAnswers) as Record<string | number, CodeQuizAnswer>
  const status = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isQuizComplete = useSelector(selectIsQuizComplete)
  const results = useSelector(selectQuizResults)
  const title = useSelector(selectQuizTitle)
  const currentQuestionIndex = useSelector((state: any) => state.quiz.currentQuestionIndex)
  const currentQuestion = questions[currentQuestionIndex] as CodeQuizQuestion | undefined

  // Only reset quiz state on initial mount
  const didInitRef = useRef(false)
  const submittingRef = useRef(false)

  // Fix bug: Reset state only on first mount
  useEffect(() => {
    if (!didInitRef.current) {
      // Only reset on first load, not on slug/quizId changes
      dispatch({ type: "quiz/resetQuiz" })
      didInitRef.current = true
    }
  }, [dispatch])

  // Fetch quiz data if needed
  useEffect(() => {
    if (slug && questions.length === 0 && status === "idle") {
      dispatch(fetchQuiz({ id: slug, data: quizData, type: "code" }))
    }
  }, [dispatch, slug, quizData, questions.length, status])

  // Handle answer submission with improved typing
  const handleAnswer = useCallback(
    async (answerText: string, timeSpent: number, isCorrect: boolean) => {
      if (!currentQuestion) return

      const answer: CodeQuizAnswer = {
        questionId: currentQuestion.id,
        answer: answerText,
        isCorrect,
        timeSpent,
        timestamp: Date.now(),
        type: "code"
      }

      try {
        // Save answer to Redux
        dispatch(saveAnswer({ questionId: currentQuestion.id, answer }))
        
        console.log(`Answer saved for question ${currentQuestion.id}`)
        
        // Move to next question with a slight delay to ensure state updates
        if (currentQuestionIndex < questions.length - 1) {
          const nextIndex = currentQuestionIndex + 1
          // Use requestAnimationFrame instead of setTimeout for smoother transitions
          requestAnimationFrame(() => {
            dispatch(setCurrentQuestionIndex(nextIndex))
          })
        } else {
          console.log("Last question completed")
        }
      } catch (error) {
        console.error("Failed to save answer:", error)
        toast.error("Failed to save answer. Please try again.")
      }
    },
    [currentQuestion, currentQuestionIndex, questions.length, dispatch]
  )

  // Handle quiz submission with error handling and state tracking
  const handleSubmitQuiz = useCallback(async () => {
    if (submittingRef.current) return
    
    submittingRef.current = true
    try {
      const result = await dispatch(submitQuiz()).unwrap()
      console.log("Quiz submitted successfully:", result)
      router.push(`/dashboard/code/${slug}/results`)
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

  // Calculate progress based on answered questions
  const answeredCount = Object.keys(answers).length
  const progressPercentage = Math.round((answeredCount / questions.length) * 100) || 0

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>

      <div className="mb-6">
        <div className="bg-gray-100 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-600 text-right">
          {answeredCount}/{questions.length} questions answered
        </div>
      </div>

      {currentQuestion && (
        <CodingQuiz
          question={currentQuestion}
          onAnswer={handleAnswer}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          isLastQuestion={currentQuestionIndex === questions.length - 1}
          isSubmitting={status === "submitting"}
          existingAnswer={answers[currentQuestion.id]?.answer}
        />
      )}

      <div className="mt-8 text-center">
        <Button
          onClick={handleSubmitQuiz}
          disabled={!isQuizComplete || status === "submitting" || submittingRef.current}
          className="px-6 py-3 transition-all duration-300"
          variant={isQuizComplete ? "default" : "outline"}
        >
          {status === "submitting" || submittingRef.current ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
              <span>Submitting...</span>
            </>
          ) : (
            "Submit Quiz"
          )}
        </Button>
      </div>
    </div>
  )
}