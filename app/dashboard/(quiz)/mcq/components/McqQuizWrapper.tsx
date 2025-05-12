"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { memo, useState, useEffect, useCallback, useMemo, useRef } from "react"

import McqQuizResult from "./McqQuizResult"
import McqQuiz from "./McqQuiz"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"
import {
  ErrorDisplay,
  LoadingDisplay,
  InitializingDisplay,
  QuizNotFoundDisplay,
  EmptyQuestionsDisplay,
} from "@/app/dashboard/components/QuizStateDisplay"
import { useToast } from "@/hooks"
import { calculateTotalTime } from "@/lib/utils/quiz-index"
import { quizUtils } from "@/lib/utils/quiz-utils"
import { useQuiz } from "@/hooks/useQuizState"
import type { McqQuizWrapperProps } from "./types"

const McqQuizContent = memo(function McqQuizContent({ quizData, slug, userId, quizId }: McqQuizWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { quizState, isAuthenticated, initialize, submitAnswer, completeQuiz, requireAuthentication, restoreState } =
    useQuiz()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(quizState.error || null)
  const [quizUIState, setQuizUIState] = useState({
    showResults: false,
    showAuthPrompt: false,
    quizResults: null as any,
  })
  const [isRestoringState, setIsRestoringState] = useState(false)

  const startTimeRef = useRef<number>(Date.now())
  const isReset = searchParams.get("reset") === "true"
  const fromAuth = searchParams.get("fromAuth") === "true"
  const hasAttemptedRestoration = useRef(false)

  const quizQuestions = useMemo(
    () => quizData?.questions || quizState?.questions || [],
    [quizData?.questions, quizState?.questions],
  )

  useEffect(() => {
    if (quizData && !isReset) {
      initialize({
        id: quizData.id || quizId,
        slug,
        title: quizData.title || "MCQ Quiz",
        quizType: "mcq",
        questions: quizData.questions || [],
        requiresAuth: true,
      })
    }
  }, [initialize, quizData, quizId, slug, isReset])

  useEffect(() => {
    if (quizQuestions.length > 0) {
      setAnswers(Array(quizQuestions.length).fill(null))
    }
  }, [quizQuestions.length])

  const createResultObject = useCallback(() => {
    const answersArray = quizState.answers || []
    const correctAnswers = answersArray.filter((a: any) => a?.isCorrect).length
    const totalTimeSpent = calculateTotalTime(answersArray.filter(Boolean))

    return {
      quizId: quizId || quizState?.quizId || "test-quiz",
      slug,
      answers: answersArray,
      score: quizState.score || 0,
      totalQuestions: quizQuestions.length || 0,
      correctAnswers,
      totalTimeSpent,
      completedAt: quizState.completedAt || new Date().toISOString(),
      elapsedTime: Math.floor((Date.now() - startTimeRef.current) / 1000),
    }
  }, [quizState, quizId, quizQuestions.length, slug])

  useEffect(() => {
    if (quizState.isCompleted && !isRestoringState) {
      const results = createResultObject()
      setQuizUIState({
        showResults: isAuthenticated || fromAuth,
        showAuthPrompt: !(isAuthenticated || fromAuth),
        quizResults: results,
      })
    }
  }, [quizState.isCompleted, isAuthenticated, fromAuth, createResultObject, isRestoringState])

  useEffect(() => {
    if (quizState.error) setError(quizState.error)
  }, [quizState.error])

  useEffect(() => {
    if (quizState.isCompleted && isAuthenticated && !quizState.resultsSaved) {
      toast({
        title: "Quiz completed!",
        description: "Your results have been saved.",
      })
    }
  }, [quizState.isCompleted, quizState.resultsSaved, isAuthenticated, toast])

  const handleSignIn = useCallback(() => {
    const redirectUrl = `/dashboard/mcq/${slug}?fromAuth=true`
    requireAuthentication?.(redirectUrl)
  }, [requireAuthentication, slug])

  useEffect(() => {
    if (fromAuth && isAuthenticated && !hasAttemptedRestoration.current) {
      hasAttemptedRestoration.current = true
      setIsRestoringState(true)

      // First check if we have savedState in quizState
      if (quizState.savedState) {
        restoreState()

        // After state is restored, update UI
        setTimeout(() => {
          setQuizUIState({
            showResults: true,
            showAuthPrompt: false,
            quizResults: createResultObject(),
          })
          setIsRestoringState(false)
        }, 0)
      } else {
        setIsRestoringState(false)
      }

      // Clean up URL params
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.delete("fromAuth")
        window.history.replaceState({}, "", url.toString())
      }
    }
  }, [isAuthenticated, quizState.savedState, restoreState, fromAuth, createResultObject])

  const currentQuestion = useMemo(() => quizQuestions[currentQuestionIndex], [quizQuestions, currentQuestionIndex])
  const isLastQuestion = useMemo(
    () => currentQuestionIndex === quizQuestions.length - 1,
    [currentQuestionIndex, quizQuestions.length],
  )

  const handleQuizCompletion = useCallback(
    async (finalAnswers: any[]) => {
      if (isCompleting) return

      setIsCompleting(true)

      try {
        const correctAnswers = finalAnswers.filter((a) => a?.isCorrect).length
        const score = quizUtils.calculateScore
          ? quizUtils.calculateScore(finalAnswers, "mcq")
          : Math.round((correctAnswers / quizQuestions.length) * 100)

        const result = {
          quizId: quizId || quizState.quizId || "test-quiz",
          slug,
          answers: finalAnswers,
          score,
          totalQuestions: quizQuestions.length,
          correctAnswers,
          totalTimeSpent: calculateTotalTime(finalAnswers.filter(Boolean)),
          completedAt: new Date().toISOString(),
          elapsedTime: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }

        // Only update UI state if not already showing results or auth prompt
        if (!quizUIState.showResults && !quizUIState.showAuthPrompt) {
          setQuizUIState({
            showResults: isAuthenticated,
            showAuthPrompt: !isAuthenticated,
            quizResults: result,
          })
        }

        try {
          await completeQuiz({
            answers: finalAnswers,
            score,
            completedAt: result.completedAt,
          })
        } catch (err) {
          console.error("Error completing quiz:", err)
          setError("Failed to complete the quiz. Please try again.")
          toast({
            title: "Error",
            description: "Failed to complete the quiz.",
            variant: "destructive",
          })
        }
      } catch (err) {
        console.error("Error completing quiz:", err)
        setError("Failed to complete the quiz. Please try again.")
        toast({
          title: "Error",
          description: "Failed to complete the quiz.",
          variant: "destructive",
        })
      } finally {
        setIsCompleting(false)
      }
    },
    [
      isCompleting,
      quizQuestions.length,
      quizId,
      quizState.quizId,
      slug,
      isAuthenticated,
      toast,
      completeQuiz,
      quizUIState.showResults,
      quizUIState.showAuthPrompt,
    ],
  )

  const handleAnswer = useCallback(
    (selectedOption: string, timeSpent: number, isCorrect: boolean) => {
      if (isCompleting || !currentQuestion) return

      const answer = {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        selectedOption,
        correctOption: currentQuestion.answer,
        isCorrect,
        timeSpent,
        index: currentQuestionIndex,
      }

      setAnswers((prev) => {
        const updated = [...prev]
        updated[currentQuestionIndex] = answer
        return updated
      })

      submitAnswer(answer)

      if (isLastQuestion) {
        const finalAnswers = [...answers.slice(0, currentQuestionIndex), answer]
        handleQuizCompletion(finalAnswers)
      } else {
        setCurrentQuestionIndex((prev) => prev + 1)
      }
    },
    [isCompleting, currentQuestion, currentQuestionIndex, isLastQuestion, answers, submitAnswer, handleQuizCompletion],
  )

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  if (quizUIState.showAuthPrompt) {
    return <NonAuthenticatedUserSignInPrompt onSignIn={handleSignIn} quizType="mcq quiz" showSaveMessage />
  }

  if (quizUIState.showResults) {
    return <McqQuizResult result={quizUIState.quizResults} />
  }

  if (!currentQuestion) {
    return <LoadingDisplay />
  }

  return (
    <div className="space-y-6">
      <McqQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={quizQuestions.length}
        isLastQuestion={isLastQuestion}
      />

      {isCompleting && (
        <div className="p-4 mt-4 border rounded-md">
          <div className="flex items-center justify-center">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
            <p>Submitting your answers...</p>
          </div>
        </div>
      )}
    </div>
  )
})

export default function McqQuizWrapper({ quizData, slug, userId, quizId }: McqQuizWrapperProps) {
  const [isInitializing, setIsInitializing] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isReset = searchParams.get("reset") === "true"

  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 500)
    return () => clearTimeout(timer)
  }, [isReset])

  if (isInitializing) {
    return <InitializingDisplay />
  }

  if (!slug) {
    return <QuizNotFoundDisplay onReturn={() => router.push("/dashboard/quizzes")} />
  }

  if (!quizData?.questions?.length) {
    return <EmptyQuestionsDisplay onReturn={() => router.push("/dashboard/quizzes")} />
  }

  return <McqQuizContent quizData={quizData} slug={slug} userId={userId} quizId={quizId} />
}
