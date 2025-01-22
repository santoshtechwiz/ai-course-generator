"use client"

import React, { useEffect, useState, use } from "react";
import axios from "axios"
import QuizResults from "../components/QuizResults"
import QuizQuestion from "../components/QuizQuestion"
import { CourseAIErrors } from "@/app/types"
import CourseAILoader from "../../course/components/CourseAILoader"
import { QuizActions } from "../../mcq/components/QuizActions"

interface Question {
  id: number
  question: string
  answer: string
  openEndedQuestion: {
    hints: string
    difficulty: string
    tags: string
    inputType: string
  }
}

interface QuizData {
  id: number
  questions: Question[]
  topic: string
}

const QuizPage = (props: { params: Promise<{ slug: string }> }) => {
  const params = use(props.params);
  const { slug } = params
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Array<{ answer: string; timeSpent: number; hintsUsed: boolean }>>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<CourseAIErrors | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [finalScore, setFinalScore] = useState<number | null>(null)

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true)
      try {
        const response = await axios.get<QuizData>(`/api/oquiz/${slug}`)
        const quizDataWithDefaults = {
          ...response.data,
          questions: response.data.questions.map((question) => ({
            ...question,
            openEndedQuestion: {
              ...question.openEndedQuestion,
              inputType: question.openEndedQuestion.inputType || "fill-in-the-blanks",
            },
          })),
        }
        setQuizData(quizDataWithDefaults)
        setStartTime(Date.now())
        setError(null)
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          setError(new CourseAIErrors(error.response?.data?.error || "Failed to load quiz data"))
        } else {
          setError(new CourseAIErrors("An unexpected error occurred"))
        }
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [slug])

  const handleAnswer = (answer: string) => {
    if (!quizData || !quizData.questions) return

    const timeSpent = startTime ? (Date.now() - startTime) / 1000 : 0
    const newAnswer = { answer, timeSpent, hintsUsed: false } // Assume no hints for now
    const newAnswers = [...answers, newAnswer]
    setAnswers(newAnswers)

    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setStartTime(Date.now()) // Reset start time for next question
    } else {
      setQuizCompleted(true)
      //Calculate score here and pass it to saveQuizResults and handleQuizComplete
      const score = calculateScore(answers)
      saveQuizResults(newAnswers, score)
      handleQuizComplete(score)
    }
  }

  const calculateScore = (answers: Array<{ answer: string; timeSpent: number; hintsUsed: boolean }>): number => {
    // Implement your scoring logic here based on answers
    // This is a placeholder, replace with your actual scoring algorithm
    return answers.length
  }

  const saveQuizResults = async (
    finalAnswers: Array<{ answer: string; timeSpent: number; hintsUsed: boolean }>,
    score: number,
  ) => {
    try {
      const response = await axios.post(`/api/quiz/score`, {
        quizId: quizData?.id,
        answers: finalAnswers,
        totalTime: finalAnswers.reduce((total, ans) => total + ans.timeSpent, 0),
        score: score,
      })
      console.log("Quiz results saved:", response.data)
    } catch (error) {
      console.error("Error saving quiz results:", error)
    }
  }

  const handleQuizComplete = (score: number) => {
    setFinalScore(score)
    // saveQuizResults(answers, score) //already called in handleAnswer
  }

  const handleRestart = () => {
    const confirmRestart = window.confirm("Are you sure you want to restart the quiz?")
    if (confirmRestart) {
      setCurrentQuestion(0)
      setAnswers([])
      setQuizCompleted(false)
      setStartTime(Date.now())
      setFinalScore(null)
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
        <p className="text-red-500 text-lg font-semibold">{error.message}</p>
      </div>
    )
  }

  if (quizCompleted) {
    return (
      <QuizResults
        answers={answers}
        questions={quizData?.questions || []}
        onRestart={handleRestart}
        onComplete={handleQuizComplete}
        finalScore={finalScore}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <QuizActions quizId={quizData?.id.toString()} quizSlug={slug} initialIsPublic={false} initialIsFavorite={false} />
      <h1 className="text-3xl font-bold mb-4">Open-Ended Quiz: {quizData?.topic || "Unknown"}</h1>
      {quizData && quizData.questions && quizData.questions.length > 0 ? (
        <QuizQuestion
          question={quizData.questions[currentQuestion]}
          onAnswer={handleAnswer}
          questionNumber={currentQuestion + 1}
          totalQuestions={quizData.questions.length}
        />
      ) : (
        <p className="text-gray-500">No questions available for this quiz.</p>
      )}
    </div>
  )
}

export default QuizPage

