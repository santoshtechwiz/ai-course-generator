"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useSession } from "next-auth/react"
import type { AppDispatch } from "@/store"
import {
  selectQuestions,
  selectAnswers,
  selectCurrentQuestionIndex,
  selectQuizStatus,
  selectQuizResults,
  selectQuizTitle,
  selectIsQuizComplete,
  hydrateQuiz,
  setCurrentQuestionIndex,
  saveAnswer,
  resetQuiz,
  setQuizResults,
  setQuizCompleted,
  fetchQuiz,
} from "@/store/slices/quiz-slice"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Flag, RefreshCw } from "lucide-react"
import OpenEndedQuiz from "./OpenEndedQuiz"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"
import type { OpenEndedQuestion } from "@/types/quiz"

interface OpenEndedQuizWrapperProps {
  slug: string
  quizData?: {
    id: string | number
    title: string
    questions: OpenEndedQuestion[]
    userId?: string
  }
}

export default function OpenEndedQuizWrapper({ slug, quizData }: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reset = searchParams.get("reset") === "true"
  const dispatch = useDispatch<AppDispatch>()
  const { data: session } = useSession()

  // Track if we've already submitted to prevent double submissions
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Redux state
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const results = useSelector(selectQuizResults)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (reset) dispatch(resetQuiz())

    const init = async () => {
      setLoading(true)

      if (quizData) {
        dispatch(
          hydrateQuiz({
            slug,
            quizData,
            currentState: {
              currentQuestionIndex: 0,
              answers: {},
              isCompleted: false,
              showResults: false,
            },
          }),
        )
        setLoading(false)
      } else {
        try {
          const result = await dispatch(fetchQuiz({ slug, type: "openended" })).unwrap()
          if (!result) throw new Error("No data received")
          setError(null)
        } catch (err) {
          setError("Failed to load quiz. Please try again.")
        } finally {
          setLoading(false)
        }
      }
    }

    init()
  }, [slug, quizData, reset, dispatch])

  // Handle quiz completion
  useEffect(() => {
    if (!isCompleted || hasSubmitted) return

    // When complete, navigate to results page
    const safeSlug = typeof slug === "string" ? slug : String(slug)

    // Add a small delay for better UX
    const timer = setTimeout(() => {
      router.push(`/dashboard/openended/${safeSlug}/results`)
    }, 1000)

    return () => clearTimeout(timer)
  }, [isCompleted, router, slug, hasSubmitted])

  const currentQuestion = useMemo(() => {
    if (!questions.length || currentQuestionIndex >= questions.length) return null
    return questions[currentQuestionIndex]
  }, [questions, currentQuestionIndex])

  const calculateSimilarity = (userAnswer: string, correctAnswer: string, keywords?: string[]) =>
    getBestSimilarityScore(userAnswer, correctAnswer) / 100

  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return false

    const questionId = currentQuestion.id?.toString() || currentQuestionIndex.toString()
    const similarity = calculateSimilarity(answer, currentQuestion.answer || "", currentQuestion.keywords)
    const isCorrect = similarity >= 0.7

    dispatch(
      saveAnswer({
        questionId,
        answer: {
          questionId,
          text: answer,
          userAnswer: answer, // Add for consistency
          type: "openended",
          similarity,
          isCorrect,
          timestamp: Date.now(),
        },
      }),
    )
    return true
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1))
    }
  }

  const handleSubmitQuiz = () => {
    if (hasSubmitted) return

    setHasSubmitted(true)

    const answeredCount = Object.keys(answers).length
    const totalQuestions = questions.length

    console.log(`Submitting quiz with ${answeredCount} out of ${totalQuestions} questions answered`)

    const questionResults = questions.map((question, index) => {
      const id = question.id?.toString() || index.toString()
      const userAnswer = answers[id]?.text || answers[id]?.userAnswer || ""
      const similarity = calculateSimilarity(userAnswer, question.answer || "", question.keywords)
      const isCorrect = similarity >= 0.7

      return {
        questionId: id,
        question: question.question || question.text,
        correctAnswer: question.answer || "",
        userAnswer,
        similarity,
        isCorrect,
        keywords: question.keywords,
        type: "openended",
      }
    })

    const correctCount = questionResults.filter((q) => q.isCorrect).length
    const percentage = Math.round((correctCount / questions.length) * 100)

    const results = {
      quizId: slug,
      slug: slug,
      title: quizTitle || "Open Ended Quiz",
      quizType: "openended",
      maxScore: questions.length,
      userScore: correctCount,
      score: correctCount,
      percentage,
      completedAt: new Date().toISOString(),
      questionResults,
      questions: questionResults,
    }

    dispatch(setQuizResults(results))
    dispatch(setQuizCompleted())

    // Ensure navigation to results page
    router.push(`/dashboard/openended/${slug}/results`)
  }

  const handleRetake = () => {
    dispatch(resetQuiz())
    dispatch(
      hydrateQuiz({
        slug,
        quizData: quizData || { questions, title: quizTitle },
        currentState: {
          currentQuestionIndex: 0,
          answers: {},
          isCompleted: false,
          showResults: false,
        },
      }),
    )
  }

  const canGoNext = currentQuestionIndex < questions.length - 1
  const canGoPrevious = currentQuestionIndex > 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  if (loading || quizStatus === "loading") {
    return <QuizLoader message="Loading quiz..." subMessage="Preparing questions" />
  }

  if (error || quizStatus === "failed") {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Error</h2>
          <p className="text-muted-foreground mb-6">{error || "Unable to load quiz."}</p>
          <Button onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
        </CardContent>
      </Card>
    )
  }

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading current question...</p>
        </CardContent>
      </Card>
    )
  }

  const currentAnswer =
    answers[currentQuestion.id?.toString() || currentQuestionIndex.toString()]?.text ||
    answers[currentQuestion.id?.toString() || currentQuestionIndex.toString()]?.userAnswer ||
    ""

  const answeredQuestions = Object.keys(answers).length
  const allQuestionsAnswered = answeredQuestions === questions.length

  // Submitting state
  if (quizStatus === "submitting") {
    return <QuizLoader full message="Quiz Completed! 🎉" subMessage="Calculating your results..." />
  }

  return (
    <div className="space-y-6">
      <OpenEndedQuiz
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        existingAnswer={currentAnswer}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSubmit={handleSubmitQuiz}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        isLastQuestion={isLastQuestion}
      />

      {answeredQuestions >= 0 && (
        <Card className="border-2 border-success/30 bg-success/5">
          <CardContent className="p-4 text-center">
            <p className="mb-4 font-medium">
              {allQuestionsAnswered
                ? "All questions answered. Ready to submit?"
                : answeredQuestions > 0
                ? `${answeredQuestions} questions answered. Submit quiz?`
                : "Submit quiz? (No questions answered yet)"}
            </p>
            <Button
              onClick={handleSubmitQuiz}
              size="lg"
              className="bg-success hover:bg-success/90 text-white"
              disabled={hasSubmitted || quizStatus === "submitting"}
            >
              <Flag className="w-4 h-4 mr-2" />
              {hasSubmitted ? "Submitting..." : "Submit Quiz and View Results"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
