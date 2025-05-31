"use client"

import { useEffect } from "react"
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
  submitQuiz,
  setQuizResults,
  setPendingQuiz,
} from "@/store/slices/quizSlice"
import { selectIsAuthenticated } from "@/store/slices/authSlice"
import { useSessionService } from "@/hooks/useSessionService"

import { Button } from "@/components/ui/button"
import McqQuiz from "./McqQuiz"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { QuizType } from "@/types/quiz"

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
  const { saveAuthRedirectState } = useSessionService()

  // Redux selectors
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const currentQuestion = useSelector(selectCurrentQuestion)
  const quizTitle = useSelector(selectQuizTitle)
  const isQuizComplete = useSelector(selectIsQuizComplete)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  // Generate a unique session ID for this quiz attempt if not authenticated
  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      const sessionKey = `mcq_session_${slug}`
      if (!sessionStorage.getItem(sessionKey)) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        sessionStorage.setItem(sessionKey, sessionId)
      }
    }
  }, [slug, isAuthenticated])

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
  }, [quizStatus, dispatch, slug, quizData])

  // Handle quiz completion - only when explicitly triggered
  useEffect(() => {
    if (!isQuizComplete) return

    const safeSlug = typeof slug === "string" ? slug : String(slug)

    if (isAuthenticated) {
      dispatch(submitQuiz())
        .then((res: any) => {
          if (res?.payload) {
            dispatch(setQuizResults(res.payload))
            router.push(`/dashboard/mcq/${safeSlug}/results`)
          } else {
            // Generate results through the selector and redirect
            router.push(`/dashboard/mcq/${safeSlug}/results`)
          }
        })
        .catch((error) => {
          console.error("Error submitting quiz:", error)
          // Still redirect to results - we can use generated results
          router.push(`/dashboard/mcq/${safeSlug}/results`)
        })
    } else {
      // For unauthenticated users, redirect to sign in
      const pendingQuizData = {
        slug,
        quizData: {
          title: quizTitle,
          questions,
        },
        currentState: {
          answers,
          currentQuestionIndex,
          isCompleted: true,
          showResults: true,
        },
      }

      dispatch(setPendingQuiz(pendingQuizData))
      
      // Save auth redirect state
      saveAuthRedirectState({
        returnPath: `/dashboard/mcq/${safeSlug}/results`,
        quizState: {
          slug,
          quizData: {
            title: quizTitle,
            questions,
          },
          currentState: {
            answers,
            isCompleted: true,
            showResults: true,
          },
        },
      })
      
      router.push(`/dashboard/mcq/${safeSlug}/results`)
    }
  }, [isQuizComplete, isAuthenticated, dispatch, router, slug, quizTitle, questions, answers, currentQuestionIndex, saveAuthRedirectState])

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
      })
    )
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }

  const handleFinish = () => {
    dispatch({ type: "quiz/setQuizCompleted" })
  }

  const answeredQuestions = Object.keys(answers).length
  const progressPercentage = (answeredQuestions / questions.length) * 100

  if (quizStatus === "loading") {
    return <QuizLoadingSteps steps={[{ label: "Loading quiz data", status: "loading" }]} />
  }

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

  if (!currentQuestion) {
    return <QuizLoadingSteps steps={[{ label: "Initializing quiz", status: "loading" }]} />
  }

  const currentAnswer = answers[currentQuestion.id]
  const existingAnswer = currentAnswer?.selectedOptionId

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
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>

                <div className="flex gap-2">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => dispatch(setCurrentQuestionIndex(index))}
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
                  disabled={currentQuestionIndex === questions.length - 1}
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
          isSubmitting={quizStatus === "submitting"}
          existingAnswer={existingAnswer}
          onNext={handleNext}
          onFinish={handleFinish}
          showNavigation={false} // We handle navigation separately
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
                    <Button onClick={handleNext} disabled={!existingAnswer || quizStatus === "submitting"}>
                      Next Question <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleFinish}
                      disabled={answeredQuestions < questions.length || quizStatus === "submitting"}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {quizStatus === "submitting" ? "Submitting..." : "Finish Quiz"}
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
