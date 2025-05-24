"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { AppDispatch } from "@/store"
import {
  fetchQuiz,
  setQuizId,
  setQuizType,
  selectQuestions,
  selectAnswers,
  selectCurrentQuestionIndex,
  selectQuizStatus,
  selectQuizError,
  selectIsQuizComplete,
  selectCurrentQuestion,
  saveAnswer,
  submitQuiz,
  setCurrentQuestionIndex,
  selectQuizResults,
  saveAuthRedirectState
} from "@/store/slices/quizSlice"

import { InitializingDisplay, EmptyQuestionsDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import { QuizSubmissionLoading } from "../../components/QuizSubmissionLoading"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"
import OpenEndedQuiz from "./OpenEndedQuiz"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"

interface OpenEndedQuizWrapperProps {
  slug: string
  quizId: string | number
  userId?: string | null
  quizData: any
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}

export default function OpenEndedQuizWrapperRedux({ 
  slug, 
  quizId, 
  userId, 
  quizData 
}: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tempResults, setTempResults] = useState<any>(null)
  
  // Get quiz data from Redux store
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const currentQuestion = useSelector(selectCurrentQuestion)
  const status = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isQuizComplete = useSelector(selectIsQuizComplete)
  const results = useSelector(selectQuizResults)
  
  const isLoading = status === 'loading'
  const hasError = status === 'error'

  // Initialize quiz data
  useEffect(() => {
    if (quizData && quizId) {
      console.log("Initializing quiz with ID:", quizId, "and slug:", slug)
      dispatch(setQuizId(quizId.toString()))
      dispatch(setQuizType('openended'))
      
      // If we have the quiz data already, use it directly
      dispatch(fetchQuiz({
        id: quizId.toString(),
        data: quizData
      }))
    }
  }, [dispatch, quizData, quizId, slug])

  // Handle retry action
  const handleRetry = useCallback(() => {
    if (!userId) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/openended/${slug}`)}`)
    } else {
      window.location.reload()
    }
  }, [userId, slug, router])

  // Handle answer submission
  const handleAnswer = useCallback(
    (answer: string, timeSpent: number, hintsUsed: boolean) => {
      if (!currentQuestion) return

      // Create user answer object with basic similarity scoring
      const similarity = currentQuestion.answer 
        ? getBestSimilarityScore(answer, currentQuestion.answer || "") 
        : 50; // Default value if no reference answer
      
      const isCorrect = similarity >= 70; // Set threshold for "correct" answers

      // Save the answer to Redux state
      dispatch(saveAnswer({ 
        questionId: currentQuestion.id, 
        answer: {
          questionId: currentQuestion.id,
          answer,
          isCorrect,
          timeSpent,
          similarity,
          hintsUsed,
          timestamp: Date.now()
        }
      }))

      // Check if this is the last question
      if (currentQuestionIndex === questions.length - 1) {
        // Create a preview of results for the last question
        const allAnswers = [...Object.values(answers)]
        
        // Add the current answer
        allAnswers.push({
          questionId: currentQuestion.id,
          answer,
          isCorrect,
          similarity,
          timeSpent
        })
        
        // Create results preview
        const preview = {
          score: allAnswers.reduce((sum, a) => sum + (a.similarity || 0) / 100, 0),
          maxScore: questions.length,
          percentage: Math.round(allAnswers.reduce((sum, a) => sum + (a.similarity || 0), 0) / questions.length),
          title: quizData?.title || "Open Ended Quiz",
          slug,
          questions: questions.map(q => {
            const ans = allAnswers.find(a => a.questionId === q.id)
            return {
              id: q.id,
              question: q.question,
              userAnswer: ans?.answer || "",
              correctAnswer: q.answer || "",
              isCorrect: ans?.isCorrect || false,
              similarity: ans?.similarity || 0
            }
          })
        }

        // Store temporary results
        setTempResults(preview)
        
        // For signed-in users, automatically submit
        if (userId) {
          handleSubmitQuiz()
        }
      } else {
        // Navigate to next question
        dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
      }
    },
    [currentQuestion, currentQuestionIndex, questions, answers, quizData, slug, userId, dispatch]
  )

  // Handle quiz submission
  const handleSubmitQuiz = useCallback(
    async () => {
      try {
        setIsSubmitting(true)
        
        // Calculate total time spent
        const totalTime = Object.values(answers).reduce(
          (sum, a: any) => sum + (a.timeSpent || 0), 
          0
        )

        // Submit quiz to backend
        await dispatch(submitQuiz({
          slug,
          quizId,
          type: "openended",
          timeTaken: totalTime
        })).unwrap()

        // Navigate to results page
        router.replace(`/dashboard/openended/${slug}/results`)
      } catch (error) {
        console.error("Error submitting quiz:", error)
        toast.error("Failed to submit quiz. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    },
    [dispatch, answers, slug, quizId, router]
  )

  // Handle sign-in action for non-authenticated users
  const handleShowSignIn = useCallback(() => {
    // Save quiz state to Redux before redirect
    dispatch(saveAuthRedirectState({
      slug,
      quizId: quizId.toString(),
      type: "openended",
      answers,
      currentQuestionIndex,
      tempResults
    }))

    // Redirect to sign-in page
    signIn(undefined, {
      callbackUrl: `/dashboard/openended/${slug}?fromAuth=true`,
    })
  }, [slug, quizId, answers, currentQuestionIndex, tempResults, dispatch])

  // Loading state
  if (isLoading || isSubmitting) {
    return isSubmitting ? 
      <QuizSubmissionLoading quizType="openended" /> : 
      <InitializingDisplay />
  }

  // Error state
  if (hasError) {
    return (
      <ErrorDisplay 
        error={error || "Failed to load quiz"} 
        onRetry={handleRetry} 
        onReturn={() => router.push("/dashboard")} 
      />
    )
  }

  // Empty questions state
  if (questions.length === 0) {
    return <EmptyQuestionsDisplay onReturn={() => router.push("/dashboard")} />
  }

  // Non-authenticated user with completed quiz
  if (!userId && tempResults) {
    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="openended"
        onSignIn={handleShowSignIn}
        showSaveMessage
        message="Please sign in to submit your quiz and save your results"
        previewData={tempResults}
      />
    )
  }

  // Authenticated user with completed quiz (preview before submission)
  if (userId && tempResults) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Completed</CardTitle>
            <CardDescription>Your responses have been recorded</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You've completed all {questions.length} questions.
            </p>
            <div className="space-y-4">
              <Button onClick={handleSubmitQuiz} disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  'View Results'
                )}
              </Button>
              <Button variant="outline" onClick={() => setTempResults(null)} disabled={isSubmitting} className="w-full">
                Return to Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Quiz in progress
  if (currentQuestion) {
    const userAnswer = answers[currentQuestion.id]?.answer
    
    return (
      <OpenEndedQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        isLastQuestion={currentQuestionIndex === questions.length - 1}
        isSubmitting={status === 'submitting' || isSubmitting}
        existingAnswer={typeof userAnswer === "string" ? userAnswer : undefined}
      />
    )
  }

  // Default loading state
  return <InitializingDisplay />
}
