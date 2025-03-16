"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import type { CourseAIErrors, QuestionOpenEnded } from "@/app/types/types"
import { useSession } from "next-auth/react"
import { SignInPrompt } from "@/components/SignInPrompt"
import { toast } from "@/hooks/use-toast"
import QuizResultsOpenEnded from "./QuizResultsOpenEnded"
import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"
import { submitQuizData } from "@/app/actions/actions"
import { QuizActions } from "@/components/QuizActions"
import { FloatingQuizToolbar } from "@/components/FloatingQuizToolbar"


interface QuizData {
  id: number
  questions: QuestionOpenEnded[]
  title: string
  userId: string
}

interface OpenEndedQuizWrapperProps {
  slug: string
  quizData: QuizData
}

const OpenEndedQuizWrapper: React.FC<OpenEndedQuizWrapperProps> = ({ slug, quizData }) => {
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
  const isSaving = useRef(false)

  const saveQuizResults = useCallback(
    async (
      finalAnswers: Array<{ answer: string; timeSpent: number; hintsUsed: boolean; isCorrect: boolean }>,
      score: number,
    ) => {
      if (isSaving.current) return
      isSaving.current = true

      try {
        await submitQuizData(
          {
            slug,
            quizId: quizData?.id,
            answers: finalAnswers,
            elapsedTime: finalAnswers.reduce((total, ans) => total + ans.timeSpent, 0),
            score,
            type: "openended",
          },
          () => {},
        )
        toast({
          variant: "success",
          title: "Quiz results saved successfully",
        })
      } catch (error) {
        console.error("Error saving quiz results:", error)
        toast({
          variant: "destructive",
          title: "Failed to save quiz results",
        })
      } finally {
        isSaving.current = false
      }
    },
    [quizData, slug],
  )

  useEffect(() => {
    setStartTime(Date.now())
    setLoading(false)
  }, [])

  useEffect(() => {
    const handleSavedResults = async () => {
      const savedResults = localStorage.getItem("quizResults")
      if (savedResults) {
        const { slug: savedSlug, answers: savedAnswers, score: savedScore } = JSON.parse(savedResults)
        if (savedSlug === slug) {
          setAnswers(savedAnswers)
          setFinalScore(savedScore)
          setQuizCompleted(true)

          if (isAuthenticated && !isSaving.current) {
            await saveQuizResults(savedAnswers, savedScore)
            localStorage.removeItem("quizResults")
          }
        }
      }
    }

    if (isAuthenticated) {
      handleSavedResults()
    }
  }, [isAuthenticated, slug, saveQuizResults])

  const calculateScore = useCallback((answers: Array<{ isCorrect: boolean }>) => {
    const correctAnswers = answers.filter((answer) => answer.isCorrect).length
    return (correctAnswers / answers.length) * 100
  }, [])

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!quizData || !quizData.questions) return

      const timeSpent = startTime ? (Date.now() - startTime) / 1000 : 0
      const isCorrect = answer.toLowerCase() === quizData.questions[currentQuestion].answer.toLowerCase()
      const newAnswer = { answer, timeSpent, hintsUsed: false, isCorrect }

      setAnswers((prevAnswers) => {
        const updatedAnswers = [...prevAnswers, newAnswer]

        if (currentQuestion < quizData.questions.length - 1) {
          setStartTime(Date.now())
          setCurrentQuestion((prev) => prev + 1)
        } else {
          setQuizCompleted(true)
          const score = calculateScore(updatedAnswers)
          setFinalScore(score)

          if (isAuthenticated) {
            saveQuizResults(updatedAnswers, score)
          } else {
            localStorage.setItem("quizResults", JSON.stringify({ slug, answers: updatedAnswers, score }))
          }
        }

        return updatedAnswers
      })
    },
    [quizData, currentQuestion, startTime, isAuthenticated, slug, saveQuizResults, calculateScore],
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

  const onComplete = useCallback(
    (score: number) => {
      setFinalScore(score)
      if (isAuthenticated) {
        saveQuizResults(answers, score)
      }
    },
    [isAuthenticated, answers, saveQuizResults],
  )

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500 text-lg font-semibold">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <QuizActions
        quizId={quizData.id.toString()}
        quizSlug={slug}
        userId={quizData.userId}
        ownerId={quizData.userId}
        initialIsPublic={false}
        initialIsFavorite={false}
        quizType="openended"
           position="left-center"
      />
     
      {quizCompleted || (isAuthenticated && finalScore !== null) ? (
        isAuthenticated ? (
          <QuizResultsOpenEnded
            answers={answers}
            questions={quizData?.questions || []}
            onRestart={handleRestart}
            onComplete={onComplete}
          />
        ) : (
          <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Quiz Completed</h2>
            <p className="mb-4">Sign in to view your results and save your progress.</p>
            <SignInPrompt callbackUrl={`/dashboard/openended/${slug}`} />
          </div>
        )
      ) : quizData && quizData.questions && quizData.questions.length > 0 ? (
        <OpenEndedQuizQuestion
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

export default OpenEndedQuizWrapper

