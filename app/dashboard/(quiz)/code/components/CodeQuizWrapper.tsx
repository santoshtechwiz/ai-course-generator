"use client"

import { useEffect, useMemo, useCallback, useRef, useState, memo } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useAuth } from "@/modules/auth"
import type { AppDispatch } from "@/store"
import {
  selectQuizQuestions,
  selectQuizAnswers,
  selectCurrentQuestionIndex,
  selectQuizStatus,
  selectQuizTitle,
  selectIsQuizComplete,
  selectQuizUserId,
  setCurrentQuestionIndex,
  saveAnswer,
  resetQuiz,
  submitQuiz,
  fetchQuiz,
} from "@/store/slices/quiz-slice"

import { toast } from "sonner"
import { NoResults } from "@/components/ui/no-results"
import CodeQuiz from "./CodeQuiz"

import { QuizActions } from "../../components/QuizActions"
import { GlobalLoader, useGlobalLoader } from "@/components/ui/loader"


interface CodeQuizWrapperProps {
  slug: string
  title?: string
}

function CodeQuizWrapper({ slug, title }: CodeQuizWrapperProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { user } = useAuth()

  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownLoaderRef = useRef(false)
  const questions = useSelector(selectQuizQuestions)
  const answers = useSelector(selectQuizAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)

  const quizId = useSelector((state: any) => state.quiz.quizId) // Assuming quizId is stored in quiz slice
  const quizOwnerId = useSelector(selectQuizUserId) // Get the actual quiz owner ID
  const userId = user?.id // Get user ID from session-based auth
  
  const pdfData = {
    title: quizTitle || title,
    description: "This is a code quiz. Solve the coding problems to complete the quiz.",
    questions: questions
  }  // Track initialization to prevent duplicate loads
  const isInitializedRef = useRef(false);
  
  // Load the quiz
  useEffect(() => {
    // Store in variable to handle potential cleanup scenarios
    let isComponentMounted = true;
    
    const loadQuiz = async () => {
      // Prevent double initialization
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;
      
      try {
        dispatch(resetQuiz());
        
        // Only proceed if component is still mounted
        if (isComponentMounted) {
          await dispatch(fetchQuiz({ slug, quizType: "code" })).unwrap();
        }
      } catch (err) {
        if (isComponentMounted) {
          console.error("Failed to load quiz:", err);
          toast.error("Failed to load quiz. Please try again.");
        }
      }
    }

    loadQuiz();

    return () => {
      isComponentMounted = false;
      if (submissionTimeoutRef.current) clearTimeout(submissionTimeoutRef.current);
    }
  }, [slug, dispatch])// Navigate to result
  useEffect(() => {
    let isMounted = true;
    
    // To prevent infinite loop, we track if we've already shown the loader for this completion    
    if (isCompleted && quizStatus === "succeeded" && !hasShownLoaderRef.current && isMounted) {
      hasShownLoaderRef.current = true;
      
      // Prevent navigation if component gets unmounted
      submissionTimeoutRef.current = setTimeout(() => {
        if (isMounted) {
          router.push(`/dashboard/code/${slug}/results`)
        }
      }, 500)
    }

    return () => {
      isMounted = false;
      if (submissionTimeoutRef.current) clearTimeout(submissionTimeoutRef.current)
    }
  }, [isCompleted, quizStatus, router, slug])

  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex] || null
  }, [questions, currentQuestionIndex])

  const handleAnswer = useCallback((selectedOptionId: string) => {
    if (!currentQuestion) return false

    dispatch(saveAnswer({
      questionId: String(currentQuestion.id),
      answer: selectedOptionId,
      selectedOptionId
    }))

    return true
  }, [currentQuestion, dispatch])

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }, [currentQuestionIndex, questions.length, dispatch])

  const handleSubmitQuiz = useCallback(async () => {
    try {
      toast.success("Quiz submitted successfully!")
       await dispatch(submitQuiz()).unwrap()

      setTimeout(() => {
        router.push(`/dashboard/code/${slug}/results`)
      }, 500)
    } catch (err) {
      console.error("Error submitting quiz:", err)
      toast.error("Failed to submit quiz. Please try again.")
    }
  }, [dispatch, router, slug])


  const isLoading = quizStatus === "loading" || quizStatus === "idle"
  const hasError = quizStatus === "failed"
  const isSubmitting = quizStatus === "submitting"
  const formattedQuestion = useMemo(() => {
    if (!currentQuestion) return null

    // Use type assertion to handle potential shape differences
    const currentQuestionAny = currentQuestion as any;
    const questionText = currentQuestionAny.question || ''
    const options = Array.isArray(currentQuestionAny.options)
      ? currentQuestionAny.options.map((opt: any) =>
        typeof opt === "string" ? opt : opt.text || ''
      )
      : []

    return {
      id: String(currentQuestion.id),
      text: questionText,
      question: questionText,
      options,
      codeSnippet: currentQuestion.codeSnippet || '',
      language: currentQuestion.language || 'javascript',
      correctAnswer: currentQuestion.answer || '',
    }
  }, [currentQuestion])



  const existingAnswer = useMemo(() => {
    if (!currentQuestion) return undefined
    return answers[String(currentQuestion.id)]?.selectedOptionId || undefined
  }, [currentQuestion, answers])

  const canGoNext = currentQuestionIndex < questions.length - 1
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  if (isLoading) {
      return (
      <GlobalLoader
        fullScreen={true}
        size="lg"
        text="AI is generating your personalized quiz results"
        subText="Crafting personalized content with advanced AI technology"
        theme="primary"
      />
    )
  }
  if (hasError) {
    return (
      <NoResults
        variant="error"
        title="Error Loading Quiz"
        description="We couldn't load this quiz. Please try again later or contact support if the problem persists."
        action={{
          label: "Return to Dashboard",
          onClick: () => router.push("/dashboard"),
        }}
      />
    )
  }
  if (!formattedQuestion) {
    return (
      <GlobalLoader
        fullScreen={true}
        size="lg"        text="AI is generating your personalized quiz results"
        subText="Crafting personalized content with advanced AI technology"
        theme="primary"
      />
    )
  }  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-2 sm:px-4">      <QuizActions
        initialIsFavorite={false}
        quizSlug={slug}
        quizData={pdfData}
        userId={userId || ''}
        quizId={quizId}
        initialIsPublic={false}
        ownerId={quizOwnerId || ''}
      ></QuizActions>
      <CodeQuiz
        question={formattedQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        existingAnswer={existingAnswer}
        onAnswer={handleAnswer}
        onNext={handleNextQuestion}
        onSubmit={handleSubmitQuiz}
        isSubmitting={isSubmitting}
        canGoNext={canGoNext}
        isLastQuestion={isLastQuestion}
        quizTitle={quizTitle || title || "Code Quiz"}
      />
    </div>
  )
}

// Export memoized version to prevent unnecessary re-renders
export default memo(CodeQuizWrapper);
