"use client"

import React, { useState, useEffect } from "react"
import { QuizActions } from "../../mcq/components/QuizActions"
import CourseAILoader from "../../course/components/CourseAILoader"
import QuizResults from "../../openended/components/QuizResults"
import { FillInTheBlanksQuiz } from "../../components/FillInTheBlanksQuiz"
import { Book, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession, signIn } from "next-auth/react"
import { SignInPrompt } from "@/app/components/SignInPrompt"

interface Question {
  id: number
  question: string
  answer: string
  openEndedQuestion: {
    hints: string[]
    difficulty: string
    tags: string[]
    inputType: string
  }
}

interface QuizData {
  id: number
  questions: Question[]
  topic: string
}

export default function Page({ params }: { params: { slug: string } }) {
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ answer: string; timeSpent: number; hintsUsed: boolean }[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const slug = React.use(params).slug

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (startTime && !quizCompleted) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [startTime, quizCompleted])

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const response = await fetch(`/api/oquiz/${slug}`)
        if (!response.ok) {
          throw new Error("Failed to fetch quiz data")
        }
        const data: QuizData = await response.json()
        const quizDataWithDefaults = {
          ...data,
          questions: data.questions.map((question: Question) => ({
            ...question,
            openEndedQuestion: {
              ...question.openEndedQuestion,
              inputType: question.openEndedQuestion.inputType || "fill-in-the-blanks",
              hints: question.openEndedQuestion.hints || [],
              tags: question.openEndedQuestion.tags || [],
            },
          })),
        }
        setQuizData(quizDataWithDefaults)
        setStartTime(Date.now())
        setError(null)
      } catch (error) {
        console.error("Error fetching quiz data:", error)
        setError("Failed to load quiz data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchQuizData()
  }, [slug])

  useEffect(() => {
    if (isAuthenticated) {
      const savedResults = localStorage.getItem("quizResults")
      if (savedResults) {
        const { slug: savedSlug, answers: savedAnswers, score, totalTime } = JSON.parse(savedResults)
        if (savedSlug === slug) {
          setAnswers(savedAnswers)
          setQuizCompleted(true)
          setFinalScore(score)
          setElapsedTime(totalTime)
          localStorage.removeItem("quizResults")
        }
      }
    }
  }, [isAuthenticated, slug])

  const handleAnswer = async (answer: string) => {
    if (!quizData) return

    const newAnswers = [...answers]
    newAnswers[currentQuestion] = { answer, timeSpent: elapsedTime, hintsUsed: false }
    setAnswers(newAnswers)

    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setStartTime(Date.now())
      setElapsedTime(0)
    } else {
      setQuizCompleted(true)
      if (isAuthenticated) {
        await updateScore(slug, newAnswers, elapsedTime, setError)
      } else {
        // Save data to local storage for anonymous users
        localStorage.setItem(
          "quizResults",
          JSON.stringify({
            slug,
            answers: newAnswers,
            totalTime: elapsedTime,
          }),
        )
      }
    }
  }

  const handleRestart = () => {
    const confirmRestart = window.confirm("Are you sure you want to restart the quiz?")
    if (confirmRestart) {
      setCurrentQuestion(0)
      setAnswers([])
      setQuizCompleted(false)
      setStartTime(Date.now())
      setElapsedTime(0)
      setError(null)
      setFinalScore(null)
    }
  }

  const handleComplete = async (score: number) => {
    setFinalScore(score)
    if (!isAuthenticated) {
      const savedResults = localStorage.getItem("quizResults")
      if (savedResults) {
        const { slug: savedSlug, answers: savedAnswers, totalTime } = JSON.parse(savedResults)
        if (savedSlug === slug) {
          localStorage.setItem(
            "quizResults",
            JSON.stringify({
              ...JSON.parse(savedResults),
              score,
            }),
          )
        }
      }
      signIn(undefined, { callbackUrl: `/dashboard/blanks/${slug}` })
    } else {
      await updateScore(slug, answers, elapsedTime, setError)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CourseAILoader />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center text-red-500">
            <AlertCircle className="w-6 h-6 mr-2" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!quizData) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-500">
            <Book className="w-6 h-6 mr-2" />
            No Quiz Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>No quiz data available.</p>
        </CardContent>
      </Card>
    )
  }

  if (quizCompleted) {
    if (isAuthenticated) {
      return (
        <React.Suspense fallback={<CourseAILoader />}>
          <QuizResults
            answers={answers}
            questions={quizData.questions}
            onRestart={handleRestart}
            onComplete={handleComplete}
          />
        </React.Suspense>
      )
    } else {
      return (
        <SignInPrompt callbackUrl={`/dashboard/blanks/${slug}`} />
      )
    }
  }

  const currentQuizQuestion = quizData.questions[currentQuestion]

  return (
    <div className="max-w-4xl mx-auto p-4">
      <React.Suspense fallback={<CourseAILoader />}>
        <QuizActions
          quizId={quizData.id.toString()}
          quizSlug={slug}
          initialIsPublic={false}
          initialIsFavorite={false}
        />
        <div className="mb-4 text-center">
          <span className="text-lg font-semibold">
            Question {currentQuestion + 1} of {quizData.questions.length}
          </span>
        </div>
        <div className="mb-4 text-center">
          <span className="text-md">
            Time: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, "0")}
          </span>
        </div>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Book className="w-6 h-6 mr-2" />
              Open-Ended Quiz: {quizData.topic || "Unknown"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quizData.questions.length > 0 ? (
              <FillInTheBlanksQuiz
                question={currentQuizQuestion}
                onAnswer={handleAnswer}
                questionNumber={currentQuestion + 1}
                totalQuestions={quizData.questions.length}
              />
            ) : (
              <p className="text-gray-500 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                No questions available for this quiz.
              </p>
            )}
          </CardContent>
        </Card>
      </React.Suspense>
    </div>
  )
}

async function updateScore(
  slug: string,
  answers: { answer: string; timeSpent: number; hintsUsed: boolean }[],
  totalTime: number,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
) {
  try {
    const response = await fetch(`/api/quiz/${slug}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slug,
        answers,
        totalTime,
      }),
    })
    if (!response.ok) {
      throw new Error("Failed to update score")
    }
  } catch (error) {
    console.error("Error saving quiz results:", error)
    setError("Failed to save quiz results. Your progress may not be recorded.")
  }
}

