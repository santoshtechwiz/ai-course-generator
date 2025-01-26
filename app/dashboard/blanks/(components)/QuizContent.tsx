'use client'

import React, { useState, useEffect, useCallback } from "react"

import { Book, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SignInPrompt } from "@/app/components/SignInPrompt"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { submitQuizData } from "@/app/actions/actions"
import { FillInTheBlanksQuiz } from "../../components/FillInTheBlanksQuiz"
import { QuizActions } from "../../mcq/components/QuizActions"
import QuizResults from "../../openended/components/QuizResults"

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
  userId: string
}

const saveQuizState = (state: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("quizState", JSON.stringify(state))
  }
}

const loadQuizState = () => {
  if (typeof window !== "undefined") {
    const state = localStorage.getItem("quizState")
    return state ? JSON.parse(state) : null
  }
  return null
}

export function QuizContent({ slug }: { slug: string }) {
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ answer: string; timeSpent: number; hintsUsed: boolean }[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const router = useRouter()

  const fetchQuizData = useCallback(async () => {
    try {
      const response = await fetch(`/api/oquiz/${slug}`)
      if (!response.ok) throw new Error("Failed to fetch quiz data")
      const data: QuizData = await response.json()
      setQuizData(data)
      setError(null)
    } catch (error) {
      console.error("Error fetching quiz data:", error)
      setError("Failed to load quiz data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchQuizData()
  }, [fetchQuizData])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (!quizCompleted) {
      timer = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [quizCompleted])

  useEffect(() => {
    if (isAuthenticated) {
      const savedState = loadQuizState()
      if (savedState) {
        setQuizData(savedState.quizData)
        setCurrentQuestion(savedState.currentQuestion)
        setAnswers(savedState.answers)
        setQuizCompleted(savedState.quizCompleted)
        setElapsedTime(savedState.elapsedTime)
        localStorage.removeItem("quizState")
      }
    }
  }, [isAuthenticated])

  const handleAnswer = useCallback(
    (answer: string) => {
      const newAnswers = [...answers, { answer, timeSpent: elapsedTime, hintsUsed: false }]
      setAnswers(newAnswers)

      const newCurrentQuestion = currentQuestion + 1
      const newQuizCompleted = !!quizData && newCurrentQuestion >= quizData.questions.length

      setCurrentQuestion(newCurrentQuestion)
      setQuizCompleted(newQuizCompleted)
      setElapsedTime(0)

      if (newQuizCompleted) {
        saveQuizState({
          quizData,
          currentQuestion: newCurrentQuestion,
          answers: newAnswers,
          quizCompleted: newQuizCompleted,
          elapsedTime: 0,
        })
      }
    },
    [elapsedTime, quizData, currentQuestion, answers],
  )

  const handleRestart = useCallback(() => {
    if (window.confirm("Are you sure you want to restart the quiz?")) {
      setCurrentQuestion(0)
      setAnswers([])
      setQuizCompleted(false)
      setStartTime(Date.now())
      setElapsedTime(0)
    }
  }, [])

  const handleComplete = useCallback(
    async (score: number) => {
      if (isAuthenticated && quizData) {
        try {
          await submitQuizData({
            slug,
            quizId: quizData.id,
            answers,
            elapsedTime,
            score,
            type: "fill-in-the-blank"
          })
          // You might want to add a success toast notification here
        } catch (error) {
          console.error("Error saving quiz results:", error)
          // You might want to add an error toast notification here
        }
      }
    },
    [isAuthenticated, quizData, slug, answers, elapsedTime],
  )

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
          <Button onClick={() => fetchQuizData()} className="mt-4">
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
        <QuizResults
          answers={answers}
          questions={quizData.questions}
          onRestart={handleRestart}
          onComplete={handleComplete}
        />
      )
    } else {
      return (
        <div className="max-w-4xl mx-auto p-4">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Book className="w-6 h-6 mr-2" />
                Quiz Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">You've completed the quiz! Sign in to see your results and save your progress.</p>
              <SignInPrompt callbackUrl={`/dashboard/blanks/${slug}`} />
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  const currentQuizQuestion = quizData.questions[currentQuestion]

  return (
    <div className="max-w-4xl mx-auto p-4">
      <QuizActions
        userId={session?.user?.id || ""}
        ownerId={quizData.userId}
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
            Fill in the Blanks Quiz: {quizData.topic || "Unknown"}
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
    </div>
  )
}
