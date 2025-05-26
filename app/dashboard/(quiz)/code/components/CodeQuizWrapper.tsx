"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "sonner"
import CodingQuiz from "./CodingQuiz"
import { AppDispatch } from "@/store"
import { CodeQuizQuestion } from "@/app/types/quiz-types"
import { stateTracker } from "@/utils/stateTracker"

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
  const searchParams = useSearchParams()
  
  // Debug state to track current index changes
  const [debugState, setDebugState] = useState({
    lastAction: "",
    timestamp: Date.now()
  })

  // Redux state with proper types
  const questions = useSelector(selectQuestions) as CodeQuizQuestion[]
  const answers = useSelector(selectAnswers) as Record<string | number, CodeQuizAnswer>
  const status = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isQuizComplete = useSelector(selectIsQuizComplete)
  const results = useSelector(selectQuizResults)
  const title = useSelector(selectQuizTitle)
  const currentQuestionIndex = useSelector((state: any) => state.quiz.currentQuestionIndex) 
  const currentQuestion: CodeQuizQuestion | undefined = questions[currentQuestionIndex]

  // Submission tracking
  const submittingRef = useRef(false)

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
    if (slug && questions.length === 0 && status === "idle") {
      dispatch(fetchQuiz({ id: slug, data: quizData, type: "code" }))
    }
  }, [dispatch, slug, questions.length, status, quizData])

  // Handle reset parameter
  useEffect(() => {
    if (searchParams && typeof searchParams.get === "function" && searchParams.get("reset") === "true") {
      dispatch({ type: "quiz/resetQuiz" })
      router.replace(`/dashboard/code/${slug}`)
    }
  }, [searchParams, dispatch, router, slug])

  // Debug current question index changes
  useEffect(() => {
    console.log("Current question index changed:", currentQuestionIndex);
  }, [currentQuestionIndex])

  // Handle quiz submission with debounce
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

  // Handle navigation to next/previous question
  const handleNavigation = useCallback((direction: 'next' | 'prev') => {
    // Log for debugging
    console.log(`Navigation ${direction} requested. Current index: ${currentQuestionIndex}, Questions length: ${questions.length}`);

    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      // Use requestAnimationFrame instead of setTimeout for more reliable execution
      requestAnimationFrame(() => {
        const nextIndex = currentQuestionIndex + 1;
        console.log(`Actually setting index to ${nextIndex}`);
        dispatch(setCurrentQuestionIndex(nextIndex));
        
        // Track for debugging
        setDebugState({
          lastAction: `Navigation next: ${currentQuestionIndex} → ${nextIndex}`,
          timestamp: Date.now()
        });
      });
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      // Use requestAnimationFrame instead of setTimeout for more reliable execution
      requestAnimationFrame(() => {
        const prevIndex = currentQuestionIndex - 1;
        console.log(`Actually setting index to ${prevIndex}`);
        dispatch(setCurrentQuestionIndex(prevIndex));
        
        // Track for debugging
        setDebugState({
          lastAction: `Navigation prev: ${currentQuestionIndex} → ${prevIndex}`,
          timestamp: Date.now()
        });
      });
    }
  }, [currentQuestionIndex, questions.length, dispatch])

  // Handle answer submission
  const handleAnswer = useCallback(
    (answer: string, timeSpent: number, isCorrect: boolean) => {
      if (!currentQuestion) return

      // Log for debugging
      console.log("Answer selected:", answer, "for question", currentQuestion.id);

      const codeAnswer: CodeQuizAnswer = {
        questionId: currentQuestion.id,
        answer,
        isCorrect,
        timeSpent,
        timestamp: Date.now(),
        type: "code"
      }

      // Save answer to Redux
      dispatch(saveAnswer({ 
        questionId: currentQuestion.id, 
        answer: codeAnswer 
      }))
      
      // Track for debugging
      setDebugState({
        lastAction: "Answer saved",
        timestamp: Date.now()
      })

      // Don't auto-advance to next question, let user control navigation through UI
    },
    [currentQuestion, dispatch]
  )

  // Auto-submit when quiz is complete
  useEffect(() => {
    if (isQuizComplete && status === "idle" && !results && !submittingRef.current) {
      handleSubmitQuiz()
    }
  }, [isQuizComplete, status, results, handleSubmitQuiz])

  // Track state changes
  useEffect(() => {
    if (currentQuestion) {
      stateTracker.takeSnapshot("Question Changed", {
        currentQuestionIndex,
        questionId: currentQuestion.id,
        hasAnswers: Object.keys(answers).length
      });
    }
  }, [currentQuestionIndex, currentQuestion, answers])

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
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isSubmitting = status === "submitting" || submittingRef.current;

  // Show current question
  if (currentQuestion) {
    // Calculate the existing answer for this question
    const currentAnswer = answers[currentQuestion.id]?.answer;

    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{title || "Code Quiz"}</h1>
        
        {/* Debug info - remove in production */}
        <div className="mb-4 p-2 bg-yellow-50 text-xs text-gray-800 rounded border border-yellow-200">
          <p>Current Index: {currentQuestionIndex}</p>
          <p>Question ID: {currentQuestion.id}</p>
          <p>Last Action: {debugState.lastAction}</p>
        </div>
        
        {/* Progress bar */}
        <div className="mb-6">
          <div className="bg-gray-100 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 text-right">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
        
        <CodingQuiz
          key={`question-${currentQuestion.id}`}
          question={currentQuestion}
          onAnswer={handleAnswer}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          isLastQuestion={isLastQuestion}
          isSubmitting={isSubmitting}
          existingAnswer={currentAnswer}
        />
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => handleNavigation('prev')}
            disabled={currentQuestionIndex === 0 || isSubmitting}
            className="min-w-[100px]"
          >
            Previous
          </Button>
          
          {!isLastQuestion ? (
            <Button
              onClick={() => handleNavigation('next')}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          )}
        </div>
        
        {isQuizComplete && !isLastQuestion && (
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
    );
  }

  // Fallback
  return (
    <QuizLoadingSteps
      steps={[
        { label: "Initializing quiz", status: "loading" }
      ]}
    />
  );
}