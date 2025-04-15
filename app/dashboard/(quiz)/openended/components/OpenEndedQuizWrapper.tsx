"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { SignInPrompt } from "@/app/auth/signin/components/SignInPrompt"
import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"
import QuizResultsOpenEnded from "./QuizResultsOpenEnded"
import type { QuestionOpenEnded } from "@/app/types/types"
import { useQuizResult } from "@/hooks/use-quiz-result"
import { useRouter } from "next/navigation"
import QuizActions from "../../components/QuizActions"
import { QuizSubmissionFeedback } from "../../components/QuizSubmissionFeedback"

interface QuizData {
  id: number
  questions: QuestionOpenEnded[]
  title: string
  userId: string
}

interface OpenEndedQuizWrapperProps {
  slug: string
  quizData: QuizData
}

interface Answer {
  answer: string
  timeSpent: number
  hintsUsed: boolean
}

const OpenEndedQuizWrapper: React.FC<OpenEndedQuizWrapperProps> = ({ slug, quizData }) => {
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [quizStartTime, setQuizStartTime] = useState<number>(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false) // Add this to track if already submitted
  const router = useRouter()
  // Use a ref to prevent multiple submissions
  const isSubmittingRef = useRef(false)
  const hasCalledSuccessCallback = useRef(false)

  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"

  // IMPORTANT: Remove the onSuccess callback from useQuizResult
  const { submitQuizResult, isSuccess, isError, errorMessage, resetSubmissionState, result } = useQuizResult({
    // Remove the onSuccess callback that might be causing the loop
  })

  // Handle success manually with useEffect instead
  useEffect(() => {
    if (isSuccess && result && !hasCalledSuccessCallback.current) {
      hasCalledSuccessCallback.current = true
      console.log("Quiz submission successful:", result)
    }
  }, [isSuccess, result])

  // Handle navigation after submission with proper dependencies
   const handleFeedbackContinue = useCallback(() => {
     setQuizCompleted(true)
     resetSubmissionState?.()
     // Don't return anything here
   }, [resetSubmissionState])

  // Reset submission state when success or error changes
  useEffect(() => {
    if (isSuccess || isError) {
      setIsSubmitting(false)
      isSubmittingRef.current = false
    }
  }, [isSuccess, isError])

  useEffect(() => {
    if (quizData?.questions && quizData.questions.length > 0) {
      const initialAnswers = Array(quizData.questions.length)
        .fill(null)
        .map(() => ({
          answer: "",
          timeSpent: 0,
          hintsUsed: false,
        }))
      setAnswers(initialAnswers)
      setQuizStartTime(Date.now())
      setQuestionStartTime(Date.now())
      console.log(`Quiz initialized with ${quizData.questions.length} questions`)
    }
  }, [quizData?.questions])

  const handleAnswerSubmit = useCallback(
    (answer: string) => {
      if (!quizData || !quizData.questions || activeQuestion >= quizData.questions.length) return

      const currentIndex = activeQuestion
      const timeSpent = (Date.now() - questionStartTime) / 1000

      const newAnswer: Answer = {
        answer,
        timeSpent,
        hintsUsed: false,
      }

      setAnswers((prevAnswers) => {
        const updatedAnswers = [...prevAnswers]
        updatedAnswers[currentIndex] = newAnswer

        return updatedAnswers
      })

      const isLast = currentIndex === quizData.questions.length - 1

      if (isLast) {
        setQuizCompleted(true)
      } else {
        setActiveQuestion((prev) => prev + 1)
        setQuestionStartTime(Date.now())
      }

      console.log(`Answered Q${currentIndex + 1}:`, {
        answer,
        timeSpent: Math.round(timeSpent),
      })
    },
    [activeQuestion, quizData, questionStartTime],
  )

  const handleRestart = useCallback(() => {
    if (!window.confirm("Are you sure you want to restart the quiz?")) return

    setActiveQuestion(0)
    setAnswers(
      Array(quizData.questions.length)
        .fill(null)
        .map(() => ({
          answer: "",
          timeSpent: 0,
          hintsUsed: false,
        })),
    )
    setQuizCompleted(false)
    setScore(null)
    setQuizStartTime(Date.now())
    setQuestionStartTime(Date.now())
    setHasSubmitted(false) // Reset submission tracking
    isSubmittingRef.current = false
    hasCalledSuccessCallback.current = false
    console.log("Quiz restarted")
  }, [quizData.questions.length])

  // Fixed handleComplete function with proper dependencies and submission state management
  const handleComplete = useCallback(
    (calculatedScore: number) => {
      setScore(calculatedScore)
      // Use ref to prevent multiple submissions
      if (isSubmittingRef.current || hasSubmitted) {
        console.log("Submission already in progress or completed, ignoring")
        return
      }

      // Set the ref immediately to prevent race conditions
      isSubmittingRef.current = true

      // Use setScore instead of the undefined setFinalScore
      setScore(calculatedScore)

      if (isAuthenticated) {
        setIsSubmitting(true)
        setHasSubmitted(true)

        submitQuizResult(
          quizData.id.toString(),
          answers,
          (Date.now() - quizStartTime) / 1000,
          calculatedScore,
          "openended",
        )
      }
    },
    [isAuthenticated, answers, quizData.id, quizStartTime, submitQuizResult, hasSubmitted],
  )

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return <p className="text-center text-gray-500 my-8">No questions available for this quiz.</p>
  }

  return (
    <div className="flex flex-col gap-8">
      <QuizActions
        quizId={quizData.id.toString()}
        quizSlug={slug}
        userId={quizData.userId}
        ownerId={quizData.userId}
        initialIsPublic={false}
        initialIsFavorite={false}
        quizType="openended"
        position="left-center"
      />

      {isSubmitting && (
        <div className="bg-secondary/20 p-4 rounded-md text-center">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-primary rounded-full mb-2"></div>
          <p>Saving your quiz results...</p>
        </div>
      )}

      {quizCompleted ? (
        isAuthenticated ? (
          <>
            <QuizResultsOpenEnded
              answers={answers}
              questions={quizData.questions}
              onRestart={handleRestart}
              onComplete={handleComplete}
            />
            {/* Only show feedback when submission is successful and not submitting */}
            {isSuccess && result && !isSubmitting && (
              <QuizSubmissionFeedback
                score={score || 0} // Ensure score is defined here
                totalQuestions={quizData.questions.length}
                isSubmitting={false}
                isSuccess={isSuccess}
                isError={isError}
                errorMessage={errorMessage}
                onContinue={handleFeedbackContinue}
                quizType="openended"
              />
            )}
          </>
        ) : (
          <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Quiz Completed</h2>
            <p className="mb-4">Sign in to view your results and save your progress.</p>
            <SignInPrompt callbackUrl={`/dashboard/openended/${slug}`} />
          </div>
        )
      ) : (
        <OpenEndedQuizQuestion
          questions={[quizData.questions[activeQuestion]]}
          quizId={quizData.id}
          slug={slug}
          title="Open Ended Quiz"
          onComplete={() => handleComplete(0)}
          onSubmitAnswer={handleAnswerSubmit}
         
         
        />
      )}
    </div>
  )
}

export default OpenEndedQuizWrapper

