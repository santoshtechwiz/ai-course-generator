"use client"

import { useEffect, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import BlanksQuiz from "./BlanksQuiz"
import type { BlanksQuizWrapperProps } from "../blanks-quiz-types"
import { 
  initializeQuiz, 
  completeQuiz, 
  setCurrentQuestion,
  setQuizLoadingState,
  setLastLoadedQuiz,
  clearUnsavedChanges
} from "@/app/store/slices/textQuizSlice"

export default function BlankQuizWrapper({ quizData, slug }: BlanksQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const quizState = useAppSelector((state) => state.textQuiz)
  const [initializationError, setInitializationError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  // Validate quiz data and initialize
  useEffect(() => {
    const initializeQuizData = () => {
      // Clear any previous errors
      setInitializationError(null)

      // Check for valid quiz data
      if (!quizData?.id || !slug) {
        console.error("Invalid quiz data:", { quizData, slug })
        setInitializationError("Invalid quiz data")
        dispatch(setQuizLoadingState('failed'))
        return false
      }

      // Check for questions array
      if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
        console.error("No questions available:", { quizData })
        setInitializationError("No questions available for this quiz")
        dispatch(setQuizLoadingState('failed'))
        // Fix: Return false here since this is an error condition
        return false 
      }

      // Success case
      return true
    }

    // Only proceed with initialization if not already initialized
    if (!isInitialized) {
      const isValid = initializeQuizData()
      
      if (isValid) {
        try {
          // Check if we need to reinitialize based on slug change
          const needsInit = quizState.lastLoadedQuiz !== slug || !quizState.quizData
          
          if (needsInit) {
            dispatch(setQuizLoadingState('loading'))
            dispatch(initializeQuiz({
              ...quizData,
              type: "blanks",
              slug,
            }))
            dispatch(setLastLoadedQuiz(slug))
          }
          
          dispatch(setQuizLoadingState('succeeded'))
          setIsInitialized(true)
        } catch (error) {
          console.error("Error initializing quiz:", error)
          setInitializationError("Failed to initialize quiz")
          dispatch(setQuizLoadingState('failed'))
        }
      }
    }
  }, [quizData, slug, dispatch, quizState.lastLoadedQuiz, quizState.quizData, isInitialized])

  // Handle question completion
  const handleQuestionComplete = useCallback(() => {
    if (quizState.isCompleted || isNavigating) return

    // Make sure quizData exists
    if (!quizData || !quizData.questions) {
      console.error("Cannot complete question: quiz data missing")
      return
    }

    const currentIndex = quizState.currentQuestionIndex
    const totalQuestions = quizData.questions.length
    const isLastQuestion = currentIndex >= totalQuestions - 1

    if (isLastQuestion) {
      // Set flag to prevent multiple calls
      setIsNavigating(true)
      
      try {
        dispatch(
          completeQuiz({
            completedAt: new Date().toISOString(),
            quizId: quizData.id,
            title: quizData.title,
            questions: quizData.questions,
            slug: slug,
            answers: quizState.answers,
          })
        )
        dispatch(clearUnsavedChanges())

        // Add a small delay to ensure state updates have time to propagate
        // This helps with test reliability
        setTimeout(() => {
          const resultsPath = `/dashboard/blanks/${slug}/results`
          console.log("Navigating to results:", resultsPath)
          router.replace(resultsPath)
        }, 10)
      } catch (error) {
        console.error("Error completing quiz:", error)
        setIsNavigating(false)
      }
    } else {
      dispatch(setCurrentQuestion(currentIndex + 1))
    }
  }, [quizState, quizData, slug, dispatch, router, isNavigating])

  // Handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (quizState.hasUnsavedChanges && !quizState.isCompleted) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [quizState.hasUnsavedChanges, quizState.isCompleted])

  // Loading state
  if (quizState.status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8" data-testid="loading-quiz">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (initializationError || quizState.status === 'failed' || !quizData) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="quiz-error-container">
        <div className="text-center space-y-4">
          <p className="text-destructive" data-testid="quiz-error">
            {initializationError || quizState.error || "Failed to load quiz"}
          </p>
          <button
            onClick={() => router.push("/dashboard/quizzes")}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
            data-testid="return-button"
          >
            Return to Quizzes
          </button>
        </div>
      </div>
    )
  }

  // No questions
  if (!quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="empty-questions">
        <div className="text-center space-y-4">
          <p className="text-destructive">No questions available for this quiz</p>
          <button
            onClick={() => router.push("/dashboard/quizzes")}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Return to Quizzes
          </button>
        </div>
      </div>
    )
  }

  // Safely access the current question
  const currentQuestionIndex = quizState.currentQuestionIndex || 0;
  const currentQuestion = quizData.questions[currentQuestionIndex];
  
  // No question found
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="question-not-found">
        <div className="text-center space-y-4">
          <p className="text-destructive">Question not found</p>
          <button
            onClick={() => router.push("/dashboard/quizzes")}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Return to Quizzes
          </button>
        </div>
      </div>
    )
  }

  // Render quiz
  return (
    <BlanksQuiz
      question={currentQuestion}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={quizData.questions.length}
      isLastQuestion={currentQuestionIndex >= quizData.questions.length - 1}
      onQuestionComplete={handleQuestionComplete}
    />
  )
}
