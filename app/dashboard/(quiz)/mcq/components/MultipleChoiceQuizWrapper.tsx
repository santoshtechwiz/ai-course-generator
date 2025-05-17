"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useQuiz } from "@/hooks/useQuizState"
import { InitializingDisplay, EmptyQuestionsDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import { QuizSubmissionLoading } from "../../components/QuizSubmissionLoading"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"
import { MCQResult } from "../../components/MCQResult"
import MultipleChoiceQuiz from "./MultipleChoiceQuiz"
import MCQResultPreview from "./MCQResultPreview"
import { UserAnswer } from "@/app/types/quiz-types"

interface MultipleChoiceQuizWrapperProps {
  slug: string
  quizId: string
  userId: string | null
  quizData?: any
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}

export default function MultipleChoiceQuizWrapper({
  slug,
  quizId,
  userId,
  quizData,
  isPublic,
  isFavorite,
  ownerId,
}: MultipleChoiceQuizWrapperProps) {
  const router = useRouter()
  const { status, fromAuth } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResultsLoader, setShowResultsLoader] = useState(false)
  const [needsSignIn, setNeedsSignIn] = useState(false)
  const [showResultsPreview, setShowResultsPreview] = useState(false)
  const [previewResults, setPreviewResults] = useState<any>(null)
  const [isReturningFromAuth, setIsReturningFromAuth] = useState(false)

  // Get quiz state from hook
  const quizHook = useQuiz()
  
  // Handle both old and new API formats for test compatibility
  // If quizHook returns the new structured API format
  const isNewApiFormat = quizHook && 'quiz' in quizHook && 'status' in quizHook && 'actions' in quizHook
  
  // Extract values from either the new or old API
  const quizState = isNewApiFormat 
    ? quizHook.quiz.data 
    : (quizHook as any)?.quizData
    
  const currentQuestion = isNewApiFormat 
    ? quizHook.quiz.currentQuestion 
    : (quizHook as any)?.currentQuestion ?? 0
    
  const userAnswers = isNewApiFormat 
    ? quizHook.quiz.userAnswers 
    : (quizHook as any)?.userAnswers ?? []
    
  const isLastQuestion = isNewApiFormat 
    ? quizHook.quiz.isLastQuestion 
    : (quizHook as any)?.isLastQuestion?.() ?? false
    
  const isLoading = isNewApiFormat 
    ? quizHook.status.isLoading 
    : (quizHook as any)?.isLoading ?? false
    
  const quizError = isNewApiFormat 
    ? quizHook.status.errorMessage 
    : (quizHook as any)?.error || (quizHook as any)?.quizError
  
  const hasError = Boolean(quizError || errorMessage)
  
  // Actions - handle both API formats
  const loadQuiz = isNewApiFormat 
    ? quizHook.actions.loadQuiz 
    : (quizHook as any)?.loadQuiz ?? (() => Promise.resolve(null))
    
  const submitQuiz = isNewApiFormat 
    ? quizHook.actions.submitQuiz 
    : (quizHook as any)?.submitQuiz ?? (() => Promise.resolve(null))
    
  const saveAnswer = isNewApiFormat 
    ? quizHook.actions.saveAnswer 
    : (quizHook as any)?.saveAnswer ?? (() => {})
    
  const resetQuizState = isNewApiFormat 
    ? quizHook.actions.reset 
    : (quizHook as any)?.resetQuizState ?? (() => {})
    
  // Navigation - handle both API formats
  const nextQuestion = isNewApiFormat 
    ? quizHook.navigation.next 
    : (quizHook as any)?.nextQuestion ?? (() => false)

  // For backward compatibility
  const saveQuizState = isNewApiFormat 
    ? () => {} // No direct equivalent in new API 
    : (quizHook as any)?.saveQuizState ?? (() => {})

  const saveSubmissionState = isNewApiFormat 
    ? async (slug: string, state: string) => Promise.resolve() 
    : (quizHook as any)?.saveSubmissionState ?? (() => Promise.resolve())

  // Define quiz state variables early to avoid initialization issues
  const questions = quizState?.questions || []
  const totalQuestions = questions.length
  const currentQuestionData = questions[currentQuestion] || null

  // Rest of the component code...
  // ... (All the handlers and UI rendering)

  // Load quiz data
  useEffect(() => {
    if (!quizState && !isLoading && !hasError && loadQuiz && quizData?.questions?.length) {
      loadQuiz(slug, "mcq", {
        id: quizId,
        title: quizData.title,
        slug,
        type: "mcq",
        questions: quizData.questions,
        isPublic: isPublic ?? false,
        isFavorite: isFavorite ?? false,
        ownerId: ownerId ?? "",
        timeLimit: quizData.timeLimit ?? null,
      })
    }
  }, [slug, quizId, quizData, isPublic, isFavorite, ownerId, quizState, isLoading, hasError, loadQuiz])

  // ... rest of the component implementation
  
  // Return similar UI structure as CodeQuizWrapper but with MCQ components
}
