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
import { RefreshCw } from "lucide-react"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"
import BlanksQuiz from "./BlanksQuiz"
import BlankQuizResults from "./BlankQuizResults"
import { useSessionService } from "@/hooks/useSessionService"
import type { BlankQuestion } from "./types"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"

interface BlanksQuizWrapperProps {
  slug: string
  quizData?: {
    id: string | number
    title: string
    questions: BlankQuestion[]
    userId?: string
  }
}

export default function BlanksQuizWrapper({ slug, quizData }: BlanksQuizWrapperProps) {
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
          const result = await dispatch(fetchQuiz({ slug, type: "blanks" })).unwrap()
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

  // Handle answer submission
  const handleAnswer = (answer: string) => {
    if (!questions[currentQuestionIndex]) return false

    const question = questions[currentQuestionIndex]
    // Ensure we have a unique and stable questionId
    const questionId = question.id?.toString() || `question_${currentQuestionIndex}`

    // Create answer object for blanks quiz
    const answerData = {
      questionId,
      userAnswer: answer,
      type: "blanks",
      filledBlanks: {
        [questionId]: answer,
      },
      timestamp: Date.now(), // Add timestamp to track most recent answers
    }

    // Save answer to Redux
    dispatch(saveAnswer({ questionId, answer: answerData }))
    return true
  }

  // Handle next question with debouncing to prevent rapid clicks
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Save current answer before moving to next question
      const currentQuestionId = questions[currentQuestionIndex]?.id?.toString() || `question_${currentQuestionIndex}`

      if (!answers[currentQuestionId] && questions[currentQuestionIndex]) {
        // If no answer is provided yet, save an empty answer to track progress
        const emptyAnswerData = {
          questionId: currentQuestionId,
          userAnswer: "",
          type: "blanks",
          filledBlanks: {
            [currentQuestionId]: "",
          },
          timestamp: Date.now(),
        }

        dispatch(saveAnswer({ questionId: currentQuestionId, answer: emptyAnswerData }))
      }

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
    const questionResults = questions.map((question, index) => {
      // Use a consistent way to generate question IDs
      const questionId = question.id?.toString() || `question_${index}`
      const answerData = answers[questionId]
      const userAnswer = answerData?.filledBlanks?.[questionId] || answerData?.userAnswer || ""
      const correctAnswer = question.answer || ""
      const similarityPercent = getBestSimilarityScore(userAnswer, correctAnswer)
      const similarity = similarityPercent / 100
      const isCorrect = similarity >= 0.7

      return {
        questionId,
        userAnswer,
        correctAnswer,
        isCorrect,
        similarity,
        question: question.question,
      }
    })

    const correctCount = questionResults.filter((q) => q.isCorrect).length
    const totalCount = questions.length
    const percentage = Math.round((correctCount / totalCount) * 100)

    const generatedResults = {
      title: quizTitle,
      maxScore: totalCount,
      userScore: correctCount,
      percentage,
      completedAt: new Date().toISOString(),
      questionResults,
      questions,
    }

    // Set results in Redux
    dispatch(setQuizResults(generatedResults))
    dispatch(setQuizCompleted())

    // Store results using session service
    storeResults(slug, generatedResults)

    // Navigate to results page for authenticated users
    if (session?.user) {
      router.push(`/dashboard/blanks/${slug}/results`)
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
    return <BlankQuizResults result={results} onRetake={handleRetake} isAuthenticated={!!session?.user} slug={slug} />
  }

  // Show current question
  return currentQuestion ? (
    <BlanksQuiz
      question={currentQuestion}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={questions.length}
      existingAnswer={
        answers[currentQuestion.id?.toString() || currentQuestionIndex.toString()]?.filledBlanks?.[
          currentQuestion.id?.toString() || currentQuestionIndex.toString()
        ] ||
        answers[currentQuestion.id?.toString() || currentQuestionIndex.toString()]?.userAnswer ||
        ""
      }
      onAnswer={handleAnswer}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSubmit={handleSubmitQuiz}
      canGoNext={canGoNext}
      canGoPrevious={canGoPrevious}
      isLastQuestion={isLastQuestion}
    />
  ) : (
    <Card>
      <CardContent className="p-6 text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Loading questions...</p>
      </CardContent>
    </Card>
  )
}
