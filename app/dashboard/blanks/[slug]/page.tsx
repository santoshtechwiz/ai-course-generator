"use client"

import React, { useState, useEffect } from "react"
import axios from "axios"
import { Suspense } from "react"
import { QuizActions } from "../../mcq/components/QuizActions"
import { FillInTheBlanksQuiz } from "../components/FillInTheBlanksQuiz"
import QuizResults from "../../openended/components/QuizResults"
import CourseAILoader from "../../course/components/CourseAILoader"

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
  const [answers, setAnswers] = useState<string[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const response = await axios.get<QuizData>(`/api/oquiz/${params.slug}`)
        const quizDataWithDefaults = {
          ...response.data,
          questions: response.data.questions.map((question: Question) => ({
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
        setError(null)
      } catch (error) {
        console.error("Error fetching quiz data:", error)
        setError("Failed to load quiz data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchQuizData()
  }, [params.slug])

  const handleAnswer = async (answer: string) => {
    if (!quizData) return

    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)

    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setQuizCompleted(true)
      try {
        await axios.post(`/api/quiz/${params.slug}/complete`, { answers: newAnswers })
      } catch (error) {
        console.error("Error saving quiz results:", error)
        setError("Failed to save quiz results. Your progress may not be recorded.")
      }
    }
  }

  const handleRestart = () => {
    const confirmRestart = window.confirm("Are you sure you want to restart the quiz?")
    if (confirmRestart) {
      setCurrentQuestion(0)
      setAnswers([])
      setQuizCompleted(false)
      setError(null)
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
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500 text-lg font-semibold">{error}</p>
      </div>
    )
  }

  if (!quizData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg font-semibold">No quiz data available.</p>
      </div>
    )
  }

  if (quizCompleted) {
    return (
      <Suspense fallback={<CourseAILoader />}>
        <QuizResults answers={answers} questions={quizData.questions} onRestart={handleRestart} />
      </Suspense>
    )
  }

  const currentQuizQuestion = quizData.questions[currentQuestion]

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Suspense fallback={<CourseAILoader />}>
        <QuizActions
          quizId={quizData.id.toString()}
          quizSlug={params.slug}
          initialIsPublic={false}
          initialIsFavorite={false}
        />
        <h1 className="text-3xl font-bold mb-4">Open-Ended Quiz: {quizData.topic || "Unknown"}</h1>
        {quizData.questions.length > 0 ? (
          <FillInTheBlanksQuiz
            question={currentQuizQuestion}
            onAnswer={handleAnswer}
            questionNumber={currentQuestion + 1}
            totalQuestions={quizData.questions.length}
          />
        ) : (
          <p className="text-gray-500">No questions available for this quiz.</p>
        )}
      </Suspense>
    </div>
  )
}
