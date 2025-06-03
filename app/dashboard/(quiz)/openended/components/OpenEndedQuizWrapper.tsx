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
} from "@/store/slices/quizSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Flag } from "lucide-react"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"
import OpenEndedQuiz from "./OpenEndedQuiz"

import { useSessionService } from "@/hooks/useSessionService"
import type { OpenEndedQuestion } from "@/types/quiz"
import OpenEndedQuizResults from "./QuizResultsOpenEnded"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"

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
  const { data: session, status: authStatus } = useSession()
  const dispatch = useDispatch<AppDispatch>()
  const { storeResults } = useSessionService()

  // Redux selectors
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const results = useSelector(selectQuizResults)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize quiz data
  useEffect(() => {
    if (reset) {
      dispatch(resetQuiz())
    }

    const initializeQuiz = async () => {
      setLoading(true)

      if (quizData) {
        // Hydrate quiz with provided data
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
        // Fetch quiz data from API
        try {
          const result = await dispatch(fetchQuiz({ slug, type: "openended" })).unwrap()
          if (result) {
            setError(null)
          } else {
            setError("Failed to load quiz data")
          }
        } catch (err) {
          console.error("Error fetching quiz:", err)
          setError("Failed to load quiz. Please try again.")
        } finally {
          setLoading(false)
        }
      }
    }

    initializeQuiz()
  }, [quizData, slug, reset, dispatch])

  // Calculate similarity between user answer and correct answer
  const calculateSimilarity = (userAnswer: string, correctAnswer: string, keywords?: string[]): number => {
    return getBestSimilarityScore(userAnswer, correctAnswer) / 100
  }

  // Handle answer submission
  const handleAnswer = (answer: string) => {
    if (!questions[currentQuestionIndex]) return false

    const question = questions[currentQuestionIndex]
    const questionId = question.id?.toString() || currentQuestionIndex.toString()

    // Calculate similarity with correct answer
    const similarity = calculateSimilarity(answer, question.answer || "", question.keywords)
    const similarityThreshold = 0.7 // 70% similarity threshold
    const isCorrect = similarity >= similarityThreshold

    // Create answer object for open-ended quiz
    const answerData = {
      questionId,
      text: answer,
      type: "openended",
      similarity,
      isCorrect,
      timestamp: Date.now(),
    }

    // Save answer to Redux
    dispatch(saveAnswer({ questionId, answer: answerData }))
    return true
  }

  // Handle next question
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }

  // Handle previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1))
    }
  }

  // Submit quiz and calculate results
  const handleSubmitQuiz = () => {
    if (!questions.length) return

    // Generate results locally
    const questionResults = questions.map((question) => {
      const questionId = question.id?.toString() || ""
      const answerData = answers[questionId]
      const userAnswer = answerData?.text || ""
      const correctAnswer = question.answer || ""
      const similarity = calculateSimilarity(userAnswer, correctAnswer, question.keywords)
      const isCorrect = similarity >= 0.7

      return {
        questionId,
        userAnswer,
        correctAnswer,
        isCorrect,
        similarity,
        question: question.question || question.text,
        keywords: question.keywords,
      }
    })

    const correctCount = questionResults.filter((q) => q.isCorrect).length
    const totalCount = questions.length
    const percentage = Math.round((correctCount / totalCount) * 100)

    const generatedResults = {
      title: quizTitle,
      maxScore: totalCount,
      userScore: correctCount,
      score: correctCount,
      percentage,
      completedAt: new Date().toISOString(),
      questionResults,
      questions: questionResults,
    }

    // Set results in Redux
    dispatch(setQuizResults(generatedResults))
    dispatch(setQuizCompleted())

    // Store results using session service
    storeResults(slug, generatedResults)

    // Navigate to results page for authenticated users
    if (session?.user) {
      router.push(`/dashboard/openended/${slug}/results`)
    }
  }

  // Handle retaking the quiz
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

  // Current question
  const currentQuestion = useMemo(() => {
    if (!questions.length) return null
    return questions[currentQuestionIndex]
  }, [questions, currentQuestionIndex])

  // Navigation state
  const canGoNext = currentQuestionIndex < questions.length - 1
  const canGoPrevious = currentQuestionIndex > 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  // Loading state
  if (loading || quizStatus === "loading") {
    return <QuizLoadingSteps steps={[{ label: "Loading quiz data", status: "loading" }]} />
  }

  // Error state
  if (error || quizStatus === "failed") {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Error Loading Quiz</h2>
          <p className="text-muted-foreground mb-6">{error || "Quiz not found"}</p>
          <Button onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
        </CardContent>
      </Card>
    )
  }

  // Show results if completed
  if (isCompleted && results) {
    return (
      <OpenEndedQuizResults result={results} onRetake={handleRetake} isAuthenticated={!!session?.user} slug={slug} />
    )
  }

  // Show current question
  return currentQuestion ? (
    <div className="space-y-6">
      <OpenEndedQuiz
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        existingAnswer={answers[currentQuestion.id?.toString() || currentQuestionIndex.toString()]?.text || ""}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSubmit={handleSubmitQuiz}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        isLastQuestion={isLastQuestion}
      />

      {/* Add a prominent submit button at the bottom when all questions have answers */}
      {Object.keys(answers).length === questions.length && (
        <Card className="border-2 border-success/30 bg-success/5">
          <CardContent className="p-4 text-center">
            <p className="mb-4 font-medium">You've answered all questions! Ready to submit your quiz?</p>
            <Button onClick={handleSubmitQuiz} size="lg" className="bg-success hover:bg-success/90 text-white">
              <Flag className="w-4 h-4 mr-2" />
              Submit Quiz and See Results
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  ) : (
    <Card>
      <CardContent className="p-6 text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Loading questions...</p>
      </CardContent>
    </Card>
  )
}

// No changes needed; ensure all quiz types use similar answer/feedback props and UI patterns.
