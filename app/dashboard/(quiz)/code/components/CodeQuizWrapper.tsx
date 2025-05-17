"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useQuiz } from "@/hooks/useQuizState"
import { signIn } from "next-auth/react"
import { InitializingDisplay, EmptyQuestionsDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import { QuizSubmissionLoading } from "../../components/QuizSubmissionLoading"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"
import CodingQuiz from "./CodingQuiz"
import QuizResultPreview from "./QuizResultPreview"
import { CodeQuizQuestion } from "@/app/types/code-quiz-types"
import { UserAnswer } from "@/app/types/quiz-types"
import { getCorrectAnswer, isAnswerCorrect } from "@/lib/utils/quiz-type-utils"
import {
  loadAuthRedirectState,
  clearAuthRedirectState,
  saveAuthRedirectState,
  hasAuthRedirectState
} from "@/store/middleware/persistQuizMiddleware"
import toast from "react-hot-toast"
import { createResultsPreview } from "./QuizHelpers"

interface PreviewResults {
  score: number
  maxScore: number
  percentage: number
  title: string
  slug: string
  questions: Array<{
    id: string
    question: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }>
}

interface CodeQuizWrapperProps {
  slug: string
  quizId: string
  userId: string | null
  quizData?: {
    id: string
    title: string
    slug: string
    questions: CodeQuizQuestion[]
    timeLimit?: number | null
    isPublic?: boolean
    isFavorite?: boolean
    ownerId?: string
    type: 'code'
  }
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}

export default function CodeQuizWrapper({
  slug,
  quizId,
  userId,
  quizData,
  isPublic,
  isFavorite,
  ownerId,
}: CodeQuizWrapperProps) {
  const router = useRouter()
  const { status, fromAuth } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResultsLoader, setShowResultsLoader] = useState(false)
  const [showResultsPreview, setShowResultsPreview] = useState(false)
  const [previewResults, setPreviewResults] = useState<PreviewResults | null>(null)
  const [isReturningFromAuth, setIsReturningFromAuth] = useState(false)
  const authRedirectChecked = useRef(false)

  const quizHook = useQuiz()
  const isNewApiFormat = quizHook && 'quiz' in quizHook && 'status' in quizHook && 'actions' in quizHook
  const quizState = isNewApiFormat ? quizHook.quiz.data : (quizHook as any)?.quizData
  const currentQuestion = isNewApiFormat ? quizHook.quiz.currentQuestion : (quizHook as any)?.currentQuestion ?? 0
  const userAnswers = isNewApiFormat ? quizHook.quiz.userAnswers : (quizHook as any)?.userAnswers ?? []
  const isLastQuestion = isNewApiFormat ? quizHook.quiz.isLastQuestion : (quizHook as any)?.isLastQuestion?.() ?? false
  const isLoading = isNewApiFormat ? quizHook.status.isLoading : (quizHook as any)?.isLoading ?? false
  const quizError = isNewApiFormat ? quizHook.status.errorMessage : (quizHook as any)?.error || (quizHook as any)?.quizError
  const hasError = Boolean(quizError || errorMessage)

  const loadQuiz = isNewApiFormat ? quizHook.actions.loadQuiz : (quizHook as any)?.loadQuiz ?? (() => Promise.resolve(null))
  const submitQuiz = isNewApiFormat ? quizHook.actions.submitQuiz : (quizHook as any)?.submitQuiz ?? (() => Promise.resolve(null))
  const saveAnswer = isNewApiFormat ? quizHook.actions.saveAnswer : (quizHook as any)?.saveAnswer ?? (() => {})
  const resetQuizState = isNewApiFormat ? quizHook.actions.reset : (quizHook as any)?.resetQuizState ?? (() => {})
  const nextQuestion = isNewApiFormat ? quizHook.navigation.next : (quizHook as any)?.nextQuestion ?? (() => false)
  const saveQuizState = isNewApiFormat ? () => {} : (quizHook as any)?.saveQuizState ?? (() => {})
  const saveSubmissionState = isNewApiFormat ? async (slug: string, state: string) => Promise.resolve() : (quizHook as any)?.saveSubmissionState ?? (() => Promise.resolve())

  const questions = quizState?.questions || []
  const totalQuestions = questions.length
  const currentQuestionData = questions[currentQuestion] || null

  const handleReturn = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  const handleRetry = useCallback(() => {
    if (!userId || status !== "authenticated") {
      const returnUrl = `/dashboard/code/${slug}`
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(returnUrl)}`)
    } else {
      window.location.reload()
    }
  }, [userId, slug, router, status])

  const handleShowSignIn = useCallback(() => {
    if (quizState && previewResults) {
      saveAuthRedirectState({
        slug,
        quizId,
        type: "code",
        userAnswers,
        currentQuestion,
        fromSubmission: true,
        previewResults,
      })
    }

    if (typeof saveQuizState === 'function') {
      saveQuizState()
    }

    signIn(undefined, {
      callbackUrl: `/dashboard/code/${slug}?fromAuth=true`
    })
  }, [slug, quizId, quizState, userAnswers, currentQuestion, saveQuizState, previewResults])

  const handleSubmitQuiz = useCallback(async (answers: UserAnswer[], elapsedTime: number) => {
    if (!Array.isArray(answers) || answers.length === 0) {
      toast.error("No answers to submit");
      return;
    }

    setShowResultsPreview(false)
    setShowResultsLoader(true)

    try {
      const submissionPayload = {
        slug,
        quizId,
        type: "code" as const,
        answers,
        timeTaken: elapsedTime
      }

      const result = await submitQuiz(submissionPayload)

      toast.success("Quiz submitted successfully!")

      setTimeout(() => {
        router.replace(`/dashboard/code/${slug}/results`)
      }, 1000)

      return result
    } catch (error: any) {
      const resultsData = createResultsPreview({
        questions,
        answers,
        quizTitle: quizState?.title || "Code Quiz",
        slug,
      })

      if (error?.status === 401 || (typeof error?.message === 'string' && error.message.toLowerCase().includes('unauthorized'))) {
        saveAuthRedirectState({
          slug,
          quizId,
          type: "code",
          userAnswers: answers,
          currentQuestion: questions.length - 1,
          fromSubmission: true,
          previewResults: resultsData,
        })

        signIn(undefined, {
          callbackUrl: `/dashboard/code/${slug}?fromAuth=true`
        })

        return;
      }

      toast.error("Failed to submit quiz. Please try again.")
      setShowResultsLoader(false)
      setIsSubmitting(false)
      setErrorMessage("Failed to submit quiz. Please try again.")

      throw error
    }
  }, [submitQuiz, slug, quizId, router, questions.length, quizState?.title, questions])

  useEffect(() => {
    return () => {
      if (!window.location.pathname.includes(`/dashboard/code/${slug}`)) {
        if (typeof resetQuizState === 'function') {
          resetQuizState();
        }
      }
    }
  }, [resetQuizState, slug])

  useEffect(() => {
    if (!authRedirectChecked.current && status === "authenticated" && hasAuthRedirectState()) {
      authRedirectChecked.current = true;
      const redirectState = loadAuthRedirectState();

      if (redirectState && redirectState.slug === slug) {
        setIsReturningFromAuth(true);

        if (redirectState.previewResults) {
          setPreviewResults(redirectState.previewResults);
          setShowResultsPreview(true);
        }

        if (redirectState.fromSubmission && redirectState.userAnswers) {
          const answersToSubmit = redirectState.userAnswers as UserAnswer[];

          setTimeout(() => {
            setShowResultsLoader(true);
            handleSubmitQuiz(answersToSubmit, 600);
          }, 1000);
        }

        clearAuthRedirectState();
      }
    }

    return () => {
      authRedirectChecked.current = false;
    };
  }, [slug, status, handleSubmitQuiz])

  useEffect(() => {
    if (fromAuth && status === "authenticated") {
      setIsReturningFromAuth(true);
    }
  }, [fromAuth, status])

  const handleAnswer = useCallback(
    async (answer: string, elapsedTime: number, isCorrect: boolean) => {
      try {
        const question = questions[currentQuestion];
        if (!question?.id) {
          setErrorMessage("Invalid question data");
          return;
        }

        saveAnswer(question.id, answer)

        if (isLastQuestion) {
          setIsSubmitting(true)

          const currentAnswers = [...userAnswers]
          if (!currentAnswers.some(a => a.questionId === question.id)) {
            currentAnswers.push({ questionId: question.id, answer })
          }

          const resultsData = createResultsPreview({
            questions,
            answers: currentAnswers,
            quizTitle: quizState?.title || "Code Quiz",
            slug
          })

          if (typeof saveSubmissionState === 'function') {
            await saveSubmissionState(slug, "in-progress")
          }

          setPreviewResults(resultsData)
          setShowResultsPreview(true)
          setIsSubmitting(false)
        } else {
          nextQuestion()
        }
      } catch (err) {
        console.error("Error handling answer:", err)
        setErrorMessage("Failed to submit answer")
      }
    },
    [questions, currentQuestion, saveAnswer, slug, isLastQuestion, nextQuestion, userAnswers, quizState, saveSubmissionState]
  )

  const handleCancelSubmit = useCallback(() => {
    setShowResultsPreview(false)
    setPreviewResults(null)
  }, [])

  const handleRetrySubmission = useCallback(async () => {
    if (!quizState?.questions?.length) {
      setErrorMessage("Quiz data is missing. Please reload the page.");
      return;
    }

    setErrorMessage(null)
    setIsSubmitting(true)
    setShowResultsLoader(true)

    try {
      const result = await submitQuiz({
        slug,
        quizId,
        type: "code",
        answers: userAnswers || [],
        timeTaken: 600
      })

      toast.success("Quiz submitted successfully!")

      setTimeout(() => {
        router.replace(`/dashboard/code/${slug}/results`)
      }, 1000)

      return result
    } catch (error: any) {
      toast.error("Failed to submit quiz. Please try again.")
      setShowResultsLoader(false)
      setIsSubmitting(false)
      setErrorMessage("Still unable to submit quiz. Please try again later.")

      throw error
    }
  }, [quizState, submitQuiz, slug, quizId, router, userAnswers])

  if (hasError) {
    return (
      <ErrorDisplay
        data-testid="error-display"
        error={errorMessage || quizError || "An error occurred"}
        onRetry={errorMessage === "Failed to submit quiz. Please try again." ? handleRetrySubmission : handleRetry}
        onReturn={handleReturn}
      />
    )
  }

  if (!userId && showResultsPreview && previewResults) {
    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="code"
        onSignIn={handleShowSignIn}
        showSaveMessage={true}
        message="Please sign in to submit your quiz"
        previewData={previewResults}
      />
    )
  }

  if (showResultsPreview && previewResults) {
    return (
      <QuizResultPreview
        result={previewResults}
        onSubmit={handleSubmitQuiz}
        onCancel={handleCancelSubmit}
        userAnswers={userAnswers}
      />
    )
  }

  if (showResultsLoader) {
    return <QuizSubmissionLoading quizType="code" />
  }

  if (isReturningFromAuth && previewResults) {
    return (
      <QuizResultPreview
        result={previewResults}
        onSubmit={(answers, time) => handleSubmitQuiz(userAnswers, time || 600)}
        onCancel={handleCancelSubmit}
        userAnswers={userAnswers}
      />
    )
  }

  if (isLoading || status === "loading") {
    return <InitializingDisplay />
  }

  if (quizState && Array.isArray(quizState.questions) && quizState.questions.length === 0) {
    return <EmptyQuestionsDisplay onReturn={handleReturn} />
  }

  if (currentQuestionData) {
    const existingAnswer = userAnswers.find(a => a.questionId === currentQuestionData.id)?.answer;

    return (
      <CodingQuiz
        question={currentQuestionData}
        onAnswer={handleAnswer}
        questionNumber={currentQuestion + 1}
        totalQuestions={totalQuestions}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
        existingAnswer={typeof existingAnswer === "string" ? existingAnswer : undefined}
      />
    )
  }

  return <InitializingDisplay />
}
