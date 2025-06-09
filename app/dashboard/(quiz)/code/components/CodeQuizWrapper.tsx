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
  setQuizResults,
  setQuizCompleted,
} from "@/store/slices/quizSlice"

import CodeQuiz from "./CodeQuiz"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"
import { QuizLoader } from "@/components/ui/quiz-loader"
import type { QuizType } from "@/app/types/auth-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle } from "lucide-react"

interface CodeQuizWrapperProps {
  slug: string
  quizData?: {
    title?: string
    questions?: any[]
  }
}

export default function CodeQuizWrapper({ slug, quizData }: CodeQuizWrapperProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

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
              title: quizData.title || "Code Quiz",
              questions: quizData.questions,
              type: "code" as QuizType,
            },
            type: "code" as QuizType,
          }
        : { slug, type: "code" as QuizType }

      dispatch(fetchQuiz(quizPayload))
    }
  }, [quizStatus, dispatch, slug, quizData])

  // Handle quiz completion - only when explicitly triggered
  useEffect(() => {
    if (!isQuizComplete) return
    
    // When complete, navigate to results
    const safeSlug = typeof slug === "string" ? slug : String(slug)
    router.push(`/dashboard/code/${safeSlug}/results`)
  }, [isQuizComplete, router, slug])

  // Answer handler - store the selected answer
  const handleAnswerQuestion = (selectedOption: string | undefined) => {
    if (!selectedOption || !currentQuestion) return

    // Simple check for plain array of options
    if (!Array.isArray(currentQuestion.options)) return
    if (!currentQuestion.options.includes(selectedOption)) return

    // Store the answer in Redux
    dispatch(
      saveAnswer({
        questionId: currentQuestion.id,
        answer: {
          questionId: currentQuestion.id,
          selectedOptionId: selectedOption,
          timestamp: Date.now(),
          type: "code",
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

  // Complete the quiz
  const handleFinish = () => {
    dispatch(setQuizCompleted())
  }

  // UI calculations
  const answeredQuestions = Object.keys(answers).length
  const progressPercentage = (answeredQuestions / questions.length) * 100

  // Loading state
  if (quizStatus === "loading") {
    return <QuizLoader message="Loading quiz data" subMessage="Preparing your code questions" />
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
    return <QuizLoadingSteps steps={[{ label: "Initializing quiz", status: "loading" }]} />
  }

  // Current answer from Redux
  const currentAnswer = answers[currentQuestion.id]
  const existingAnswer = currentAnswer?.selectedOptionId

  // Submitting state
  if (quizStatus === "submitting") {
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
                  <CardTitle className="text-2xl font-bold">{quizTitle || "Code Quiz"}</CardTitle>
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
        <CodeQuiz
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
