"use client"

import React, { useEffect, useState, useCallback } from "react"
import axios from "axios"

import { CourseAIErrors } from "@/app/types"
import CourseAILoader from "../../course/components/CourseAILoader"
import { QuizActions } from "../../mcq/components/QuizActions"
import { useSession } from "next-auth/react"
import { SignInPrompt } from "@/app/components/SignInPrompt"
import { toast } from "@/hooks/use-toast"

import QuizResultsOpenEnded from "../components/QuizResultsOpenEnded"
import QuizQuestion from "../components/QuizQuestion"

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
  topic: string,
  userId: string
}

const QuizPage = ({ params }: { params: { slug: string } }) => {
  const  slug  = React.use(params).slug;
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<
    Array<{ answer: string; timeSpent: number; hintsUsed: boolean; isCorrect: boolean }>
  >([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<CourseAIErrors | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"

  const fetchQuiz = useCallback(async () => {
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
  }, [slug])

  useEffect(() => {
    fetchQuiz()
  }, [fetchQuiz])

  useEffect(() => {
    if (isAuthenticated) {
      const savedResults = localStorage.getItem("quizResults")
      if (savedResults) {
        const { slug: savedSlug, answers: savedAnswers, score: savedScore } = JSON.parse(savedResults)
        if (savedSlug === slug) {
          setAnswers(savedAnswers)
          setFinalScore(savedScore)
          setQuizCompleted(true)
          saveQuizResults(savedAnswers, savedScore)
          localStorage.removeItem("quizResults")
        }
      }
    }
  }, [isAuthenticated, slug])

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!quizData || !quizData.questions) return

      const timeSpent = startTime ? (Date.now() - startTime) / 1000 : 0
      const isCorrect = answer.toLowerCase() === quizData.questions[currentQuestion].answer.toLowerCase()
      const newAnswer = { answer, timeSpent, hintsUsed: false, isCorrect }

      setAnswers((prevAnswers) => [...prevAnswers, newAnswer])
      setCurrentQuestion((prevQuestion) => {
        if (prevQuestion < quizData.questions.length - 1) {
          setStartTime(Date.now())
          return prevQuestion + 1
        } else {
          setQuizCompleted(true)
          const updatedAnswers = [...answers, newAnswer]
          const score = calculateScore(updatedAnswers)
          if (isAuthenticated) {
            saveQuizResults(updatedAnswers, score)
          } else {
            localStorage.setItem("quizResults", JSON.stringify({ slug, answers: updatedAnswers, score }))
          }
          setFinalScore(score)
          return prevQuestion
        }
      })
    },
    [quizData, currentQuestion, startTime, answers, isAuthenticated, slug],
  )

  const calculateScore = useCallback((answers: Array<{ isCorrect: boolean }>) => {
    const correctAnswers = answers.filter((answer) => answer.isCorrect).length
    return (correctAnswers / answers.length) * 100
  }, [])

  const saveQuizResults = useCallback(
    async (
      finalAnswers: Array<{ answer: string; timeSpent: number; hintsUsed: boolean; isCorrect: boolean }>,
      score: number,
    ) => {
      try {
        const response = await axios.post(`/api/quiz/${slug}/complete`, {
          quizId: quizData?.id,
          answers: finalAnswers,
          totalTime: finalAnswers.reduce((total, ans) => total + ans.timeSpent, 0),
          score: score,
          type: "open-ended",
        })

        toast({
          variant: "success",
          title: "Quiz results saved!",
        })
      } catch (error) {
        console.error("Error saving quiz results:", error)
        toast({
          variant: "destructive",
          title: "Failed to save quiz results",
        })
      }
    },
    [quizData, slug],
  )

  const handleRestart = useCallback(() => {
    const confirmRestart = window.confirm("Are you sure you want to restart the quiz?")
    if (confirmRestart) {
      setCurrentQuestion(0)
      setAnswers([])
      setQuizCompleted(false)
      setStartTime(Date.now())
      setFinalScore(null)
    }
  }, [])

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-screen">
  //       <CourseAILoader />
  //     </div>
  //   )
  // }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500 text-lg font-semibold">{error.message}</p>
      </div>
    )
  }

  if (quizCompleted || (isAuthenticated && finalScore !== null)) {
    if (isAuthenticated) {
      return (
        <QuizResultsOpenEnded
          answers={answers}
          questions={quizData?.questions || []}
          onRestart={handleRestart}
          onComplete={() => {}} // Remove the onComplete prop as it's no longer needed
        />
      )
    } else {
      return <SignInPrompt callbackUrl={`/dashboard/openended/${slug}`} />
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <QuizActions
        quizId={quizData?.id?.toString() || ""}
        quizSlug={slug}
        userId={session?.user?.id || ""}
        ownerId={quizData?.userId || ""}
        initialIsPublic={false}
        initialIsFavorite={false}
      />
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

