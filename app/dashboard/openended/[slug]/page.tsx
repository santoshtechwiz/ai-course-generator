'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import QuizResults from '../components/QuizResults'
import QuizQuestion from '../components/QuizQuestion'
import { CourseAIErrors } from '@/app/types'
import CourseAILoader from '../../course/components/CourseAILoader'
import { QuizActions } from '../../mcq/components/QuizActions'

interface Question {
  id: number
  question: string
  answer: string
  openEndedQuestion: {
    hints: string
    difficulty: string
    tags: string
  }
}

interface QuizData {
  id: number,
  questions: Question[]
  topic: string
}

const QuizPage = ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = React.use(params)
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<CourseAIErrors | null>(null)

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true)
      try {
        const response = await axios.get<QuizData>(`/api/oquiz/${slug}`)
        setQuizData(response.data)
        setError(null)
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          setError(new CourseAIErrors(error.response?.data?.error || 'Failed to load quiz data'))
        } else {
          setError(new CourseAIErrors('An unexpected error occurred'))
        }
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [slug])

  const handleAnswer = (answer: string) => {
    if (!quizData || !quizData.questions) return

    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)

    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setQuizCompleted(true)
      saveQuizResults(newAnswers)
    }
  }

  const saveQuizResults = async (finalAnswers: string[]) => {
    try {
      await axios.post(`/api/quiz/${slug}/complete`, { answers: finalAnswers })
    } catch (error) {
      console.error('Error saving quiz results:', error)
    }
  }

  const handleRestart = () => {
    const confirmRestart = window.confirm('Are you sure you want to restart the quiz?')
    if (confirmRestart) {
      setCurrentQuestion(0)
      setAnswers([])
      setQuizCompleted(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
       
          <CourseAILoader></CourseAILoader>
       
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
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <QuizActions quizId={quizData?.id.toString()} quizSlug={slug} initialIsPublic={false} initialIsFavorite={false}></QuizActions>
      <h1 className="text-3xl font-bold mb-4">Open-Ended Quiz: {quizData?.topic || 'Unknown'}</h1>
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
