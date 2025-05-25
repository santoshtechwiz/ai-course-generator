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
  const title = useSelector(selectQuizTitle)
  const currentQuestionIndex = useSelector((state: any) => state.quiz.currentQuestionIndex)
  const currentQuestion = questions[currentQuestionIndex]

  // Only reset quiz state on initial mount
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
    if (slug && questions.length === 0 && status === "idle") {
      dispatch(fetchQuiz({ id: slug, data: quizData, type: "code" }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, slug, quizData, questions.length, status])

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

      // First save the answer
      dispatch(saveAnswer({ questionId: currentQuestion.id, answer }))
      
      console.log(`Answer saved for question ${currentQuestion.id}, navigating to next question...`)
      
      // Then set a short timeout to move to the next question
      // This ensures the Redux state has time to update
      if (currentQuestionIndex < questions.length - 1) {
        // Move to next question
        const nextIndex = currentQuestionIndex + 1
        console.log(`Moving to question index: ${nextIndex}`)
        dispatch(setCurrentQuestionIndex(nextIndex))
      } else {
        console.log("Last question reached")
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

  const progressPercentage = Math.round((Object.keys(answers).length / questions.length) * 100) || 0

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
          {Object.keys(answers).length}/{questions.length} questions answered
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
          existingAnswer={typeof answers[currentQuestion.id]?.answer === "string" 
            ? answers[currentQuestion.id].answer 
            : undefined
          }
        />
      )}

      <div className="mt-8 text-center">
        <Button
          onClick={handleSubmitQuiz}
          disabled={!isQuizComplete || status === "submitting"}
          className="px-6 py-3 transition-all duration-300"
          variant={isQuizComplete ? "default" : "outline"}
        >
          {status === "submitting" ? (
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