"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import {
  selectQuestions,
  selectAnswers,
  selectQuizStatus,
  selectQuizError,
  selectQuizTitle,
  selectIsQuizComplete,
  selectCurrentQuestionIndex,
  selectCurrentQuestion,
  fetchQuiz,
  submitQuiz,
  setQuizResults,
  setPendingQuiz,
  saveAnswer,
  setCurrentQuestionIndex
} from "@/store/slices/quizSlice"
import { selectIsAuthenticated } from "@/store/slices/authSlice"

import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { useSessionService } from "@/hooks/useSessionService"
import { CheckCircle } from "lucide-react"
import BlanksQuiz from "./BlanksQuiz"
import type { BlankQuestion } from "./types"
import type { QuizType } from "@/types/quiz"

interface BlanksQuizWrapperProps {
  slug: string
  quizData?: {
    title?: string
    questions?: BlankQuestion[]
  }
}

export default function BlanksQuizWrapper({ slug, quizData }: BlanksQuizWrapperProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { saveAuthRedirectState } = useSessionService()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redux selectors
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const quizTitle = useSelector(selectQuizTitle)
  const isQuizComplete = useSelector(selectIsQuizComplete)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const currentQuestion = useSelector(selectCurrentQuestion) as BlankQuestion

  // Load quiz data on mount
  useEffect(() => {
    if (quizStatus === "idle") {
      const quizPayload = quizData?.questions?.length
        ? {
            slug,
            data: {
              slug,
              title: quizData.title || "Fill in the Blanks Quiz",
              questions: quizData.questions,
              type: "blanks" as QuizType,
            },
            type: "blanks" as QuizType,
          }
        : { slug, type: "blanks" as QuizType }

      dispatch(fetchQuiz(quizPayload))
    }
  }, [quizStatus, dispatch, slug, quizData])

  // Handle quiz completion
  useEffect(() => {
    if (!isQuizComplete) return

    const safeSlug = typeof slug === "string" ? slug : String(slug)

    if (isAuthenticated) {
      setIsSubmitting(true)
      dispatch(submitQuiz())
        .then((res: any) => {
          if (res?.payload) {
            dispatch(setQuizResults(res.payload))
            router.push(`/dashboard/blanks/${safeSlug}/results`)
          } else {
            console.error("Submit quiz failed: payload is undefined", res)
            router.push(`/dashboard/blanks/${safeSlug}/results`)
          }
        })
        .catch((error) => {
          console.error("Error submitting quiz:", error)
          toast.error("Failed to submit quiz. Please try again.")
          router.push(`/dashboard/blanks/${safeSlug}/results`)
        })
        .finally(() => {
          setIsSubmitting(false)
        })
    } else {
      // For unauthenticated users, redirect to results page
      const pendingQuizData = {
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
      }

      dispatch(setPendingQuiz(pendingQuizData))
      
      // Save auth redirect state
      saveAuthRedirectState({
        returnPath: `/dashboard/blanks/${safeSlug}/results`,
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
      
      router.push(`/dashboard/blanks/${safeSlug}/results`)
    }
  }, [isQuizComplete, isAuthenticated, dispatch, router, slug, quizTitle, questions, answers, saveAuthRedirectState])

  // Handle user's answer submission
  const handleAnswerSubmit = (questionId: string | number, answer: string) => {
    if (!answer.trim()) return false
    
    dispatch(saveAnswer({
      questionId,
      answer: {
        questionId,
        userAnswer: answer,
        timestamp: Date.now(),
        type: "blanks",
      },
    }))
    
    return true
  }

  const handleQuizSubmit = () => {
    dispatch({ type: "quiz/setQuizCompleted" })
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
  const progressPercentage = questions.length > 0 ? (answeredQuestions / questions.length) * 100 : 0

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
  const existingAnswer = currentAnswer?.userAnswer

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Quiz Header */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">{quizTitle || "Fill in the Blanks Quiz"}</CardTitle>
                <p className="text-muted-foreground mt-1">
                  {answeredQuestions} of {questions.length} answered
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
                  Previous
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
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Question */}
        <BlanksQuiz
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          existingAnswer={existingAnswer}
          onAnswer={(answer) => handleAnswerSubmit(currentQuestion.id, answer)}
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
                      Next Question
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
