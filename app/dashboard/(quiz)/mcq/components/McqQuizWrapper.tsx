"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import {
  selectQuestions,
  selectAnswers,
  selectQuizStatus,
  selectQuizError,
  selectCurrentQuestionIndex,
  selectCurrentQuestion,
  selectQuizTitle,
  selectIsQuizComplete,
  setCurrentQuestionIndex,
  saveAnswer,
  fetchQuiz,
  setQuizCompleted,
  submitQuiz,
  resetSubmissionState,
} from "@/store/slices/quiz-slice"

import { Button } from "@/components/ui/button"
import McqQuiz from "./McqQuiz"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { ChevronLeft, ChevronRight, CheckCircle, Trophy } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { QuizType } from "@/types/quiz"
import { useAuth } from "@/hooks/use-auth"

interface McqQuizWrapperProps {
  slug: string
  quizData?: {
    title?: string
    questions?: any[]
  }
}

export default function McqQuizWrapper({ slug, quizData }: McqQuizWrapperProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  
  // Track submission state locally to prevent multiple submissions
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxSubmitAttemptsRef = useRef<number>(0)

  // Redux selectors - pure quiz state
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const currentQuestion = useSelector(selectCurrentQuestion)
  const quizTitle = useSelector(selectQuizTitle)
  const isQuizComplete = useSelector(selectIsQuizComplete)

  // Load quiz data on mount
  useEffect(() => {
    if (quizStatus === "idle") {
      const quizPayload = quizData?.questions?.length
        ? {
            slug,
            data: {
              slug,
              title: quizData.title || "MCQ Quiz",
              questions: quizData.questions,
              type: "mcq" as QuizType,
            },
            type: "mcq" as QuizType,
          }
        : { slug, type: "mcq" as QuizType }

      dispatch(fetchQuiz(quizPayload))
    }
    
    // Clear any previous submission state on component mount
    dispatch(resetSubmissionState())
    
    // Cleanup
    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current)
      }
    }
  }, [quizStatus, dispatch, slug, quizData])

  // Add safety timeout to prevent UI freeze
  useEffect(() => {
    // If we've been submitting for more than 10 seconds, something is wrong
    if (isSubmitting) {
      const safetyTimeout = setTimeout(() => {
        // Force navigation to results
        const safeSlug = typeof slug === "string" ? slug : String(slug)
        router.push(`/dashboard/mcq/${safeSlug}/results`)
      }, 10000) // 10 seconds timeout
      
      return () => clearTimeout(safetyTimeout)
    }
  }, [isSubmitting, router, slug])

  // Handle quiz completion - only when explicitly triggered
  useEffect(() => {
    if (!isQuizComplete || hasSubmitted || !isAuthenticated) return

    // Show completion toast with celebration
    toast.success("🎉 Quiz completed! Calculating your results...", {
      duration: 2000,
    })

    // Navigate to results page with safety timeout
    const safeSlug = typeof slug === "string" ? slug : String(slug)
    setHasSubmitted(true)

    // Add a small delay for better UX
    submissionTimeoutRef.current = setTimeout(() => {
      router.push(`/dashboard/mcq/${safeSlug}/results`)
    }, 1500)

  }, [isQuizComplete, router, slug, hasSubmitted, isAuthenticated])

  // Handle answer selection
  const handleAnswerQuestion = (selectedOptionId: string) => {
    if (!currentQuestion) return

    dispatch(
      saveAnswer({
        questionId: currentQuestion.id,
        answer: {
          questionId: currentQuestion.id,
          selectedOptionId,
          isCorrect: selectedOptionId === currentQuestion.correctOptionId,
          type: "mcq",
        },
      }),
    )
  }

  // Navigation handlers
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }

  // Complete the quiz - now with better safeguards and retry mechanism
  const handleFinish = () => {
    if (hasSubmitted || isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      // First mark as completed
      dispatch(setQuizCompleted())
      
      // Store answers in localStorage as backup
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('quiz_answers_backup', JSON.stringify({
            slug,
            answers,
            timestamp: Date.now()
          }))
        } catch (e) {
          console.error('Failed to backup answers:', e)
        }
      }

      // Then submit the quiz to generate results
      dispatch(submitQuiz())
        .unwrap()
        .then(() => {
          setHasSubmitted(true)
          const safeSlug = typeof slug === "string" ? slug : String(slug)
          
          // Navigate to results page after a short delay
          submissionTimeoutRef.current = setTimeout(() => {
            router.push(`/dashboard/mcq/${safeSlug}/results`)
          }, 1000)
        })
        .catch(err => {
          console.error("Quiz submission error:", err)
          maxSubmitAttemptsRef.current += 1
          
          // If we've tried 3 times or more, just navigate to results
          if (maxSubmitAttemptsRef.current >= 3) {
            toast.error("Having trouble submitting quiz. Redirecting to results page.")
            const safeSlug = typeof slug === "string" ? slug : String(slug)
            setTimeout(() => {
              router.push(`/dashboard/mcq/${safeSlug}/results`)
            }, 1000)
            return
          }
          
          // Otherwise show error and reset submission state
          setIsSubmitting(false)
          toast.error("Failed to submit quiz. Please try again.")
        })
    } catch (err) {
      console.error("Error in quiz submission flow:", err)
      setIsSubmitting(false)
      toast.error("Failed to submit quiz. Please try again.")
    }
  }

  // UI calculations
  const answeredQuestions = Object.keys(answers).length
  const progressPercentage = (answeredQuestions / questions.length) * 100
  const allQuestionsAnswered = answeredQuestions === questions.length
  const actualSubmittingState = isSubmitting || quizStatus === "submitting"

  // Loading state
  if (quizStatus === "loading") {
    return <QuizLoader message="Loading quiz data" subMessage="Getting your questions ready" />
  }

  // Error state
  if (quizStatus === "failed") {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quiz Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">{error || "Unable to load quiz data."}</p>
            <div className="space-x-4">
              <Button onClick={() => window.location.reload()}>Try Again</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")}>
                Back to Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Empty questions state
  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">No Questions Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">This quiz has no questions.</p>
            <Button onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No current question state
  if (!currentQuestion) {
    return <QuizLoader steps={[{ label: "Initializing quiz", status: "loading" }]} />
  }

  // Get current answer
  const currentAnswer = answers[currentQuestion.id]
  const existingAnswer = currentAnswer?.selectedOptionId

  // Submitting state
  if (actualSubmittingState) {
    return <QuizLoader full message="Quiz Completed! 🎉" subMessage="Calculating your results..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Quiz Header */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-bold">{quizTitle || "MCQ Quiz"}</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {answeredQuestions} of {questions.length} questions answered
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">
                      {answeredQuestions}/{questions.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Question Navigation */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => dispatch(setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1)))}
                  disabled={currentQuestionIndex === 0 || actualSubmittingState}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>

                <div className="flex gap-2 overflow-x-auto py-2 px-1">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => dispatch(setCurrentQuestionIndex(index))}
                      disabled={actualSubmittingState}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        index === currentQuestionIndex
                          ? "bg-primary text-primary-foreground"
                          : answers[questions[index].id]
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() =>
                    dispatch(setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1)))
                  }
                  disabled={currentQuestionIndex === questions.length - 1 || actualSubmittingState}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Question */}
        <McqQuiz
          question={currentQuestion}
          onAnswer={handleAnswerQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          isSubmitting={actualSubmittingState}
          existingAnswer={existingAnswer}
        />

        {/* Bottom Navigation */}
        <div className="mt-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>

                <div className="flex gap-3">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <Button 
                      onClick={handleNext} 
                      disabled={!existingAnswer || actualSubmittingState}
                    >
                      Next Question <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleFinish}
                      disabled={!allQuestionsAnswered || actualSubmittingState || hasSubmitted}
                      className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                      <Trophy className="w-4 h-4" />
                      {actualSubmittingState ? "Submitting..." : "Finish Quiz"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
