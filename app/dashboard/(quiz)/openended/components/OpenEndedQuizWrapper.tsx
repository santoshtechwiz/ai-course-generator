"use client"

import { useEffect, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"
import { initializeQuiz, completeQuiz, setCurrentQuestion } from "@/store/slices/textQuizSlice"
import type { OpenEndedQuizData } from "@/types/quiz"

interface OpenEndedQuizWrapperProps {
  quizData: OpenEndedQuizData
  slug: string
}

export default function OpenEndedQuizWrapper({ quizData, slug }: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const quizState = useAppSelector((state) => state.textQuiz)
  const [isInitializing, setIsInitializing] = useState(true)

  // Add validation for quiz data
  const isValidQuizData = useMemo(() => {
    return Boolean(
      quizData &&
      quizData.id &&
      Array.isArray(quizData.questions) &&
      quizData.questions.length > 0 &&
      quizData.questions.every(q => q.question && q.answer)
    )
  }, [quizData])

  // Memoize quiz data to prevent unnecessary re-renders
  const quizInfo = useMemo(
    () => ({
      id: quizData?.id,
      questionCount: quizData?.questions?.length || 0,
      hasQuestions: Boolean(quizData?.questions?.length),
      isValid: isValidQuizData,
    }),
    [quizData?.id, quizData?.questions?.length, isValidQuizData],
  )

  // Initialize quiz with stable dependencies and loading state
  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (quizInfo.id && quizInfo.hasQuestions && slug) {
        dispatch(
          initializeQuiz({
            ...quizData,
            type: "openended",
            slug,
          }),
        )
      }
      setIsInitializing(false)
    }, 500)

    return () => clearTimeout(initTimer)
  }, [dispatch, quizInfo.id, quizInfo.hasQuestions, slug, quizData])

  // Handle question completion with memoized values
  const handleQuestionComplete = useCallback(() => {
    // Safely access currentQuestionIndex with nullish coalescing
    const currentIndex = quizState?.currentQuestionIndex ?? 0

    if (currentIndex === quizInfo.questionCount - 1) {
      // Complete quiz before navigation
      // Create a timestamp for completion
      const completionTimestamp = new Date().toISOString();
      
      // Ensure we have the latest answers
      const currentAnswers = [...quizState.answers];
      
      // Dispatch with both timestamp and answers
      dispatch(
        completeQuiz({
          answers: currentAnswers,
          completedAt: completionTimestamp,
        }),
      )
      
      // Debug log to verify dispatch
      console.log('Completing quiz with:', {
        answerCount: currentAnswers.length,
        timestamp: completionTimestamp
      });
      
      // Wait a bit longer to ensure state updates are processed before navigation
      setTimeout(() => {
        router.replace(`/dashboard/openended/${slug}/results`)
      }, 800) // Increased delay for better reliability
    } else {
      dispatch(setCurrentQuestion(currentIndex + 1))
    }
  }, [quizState, quizInfo.questionCount, router, slug, dispatch])

  // Display loading state while initializing
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="text-muted-foreground">Initializing your quiz...</p>
        </div>
      </div>
    )
  }

  // Display error if quiz data is invalid
  if (!quizInfo.isValid) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-destructive">Invalid quiz data. Please try again later.</p>
          <button
            onClick={() => router.push("/dashboard/quizzes")}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Return to Quizzes
          </button>
        </div>
      </div>
    )
  }

  // Show loading state if data is not ready
  if (!quizInfo.id || !quizInfo.hasQuestions) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="text-muted-foreground">Loading your quiz questions...</p>
        </div>
      </div>
    )
  }

  // Get current question with proper error handling
  const currentQuestionIndex = quizState?.currentQuestionIndex ?? 0
  // Make sure quizData.questions exists before accessing it
  if (!quizData?.questions?.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-destructive">No quiz questions available.</p>
          <button
            onClick={() => router.push("/dashboard/quizzes")}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Return to Quizzes
          </button>
        </div>
      </div>
    )
  }
  
  // Safely get the current question
  const currentQuestion = quizData.questions[currentQuestionIndex] || quizData.questions[0]
  
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-destructive">Failed to load quiz question.</p>
          <button
            onClick={() => router.push("/dashboard/quizzes")}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Return to Quizzes
          </button>
        </div>
      </div>
    )
  }

  return (
    <OpenEndedQuizQuestion
      question={currentQuestion}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={quizInfo.questionCount}
      isLastQuestion={currentQuestionIndex === quizInfo.questionCount - 1}
      onQuestionComplete={handleQuestionComplete}
    />
  )
}
