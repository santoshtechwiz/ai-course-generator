"use client"

import { useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { signIn } from "next-auth/react"
import { toast } from "sonner"

import type { AppDispatch } from "@/store"
import {
  fetchQuiz,
  saveAnswer,
  submitQuiz,
  setCurrentQuestionIndex,
  saveAuthRedirectState,
  selectQuestions,
  selectAnswers,
  selectCurrentQuestionIndex,
  selectCurrentQuestion,
  selectQuizStatus,
  selectQuizError,
  selectQuizTitle,
  selectQuizId,
  selectIsQuizComplete,
  selectQuizInProgress,
  type MCQAnswer,
} from "@/store/slices/quizSlice"

import { InitializingDisplay, EmptyQuestionsDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import { QuizSubmissionLoading } from "../../components/QuizSubmissionLoading"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"
import McqQuiz from "./McqQuiz"
import { McqQuestion, QuizResultsPreview } from "./types"


interface McqQuizWrapperProps {
  slug: string
  userId?: string | null
  quizData?: any
}

export default function McqQuizWrapper({ slug, userId, quizData }: McqQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const searchParams = useSearchParams()

  // Redux selectors - following the exact slice structure
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const currentQuestion = useSelector(selectCurrentQuestion)
  const status = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const quizTitle = useSelector(selectQuizTitle)
  const quizId = useSelector(selectQuizId)
  const isQuizComplete = useSelector(selectIsQuizComplete)
  const isQuizInProgress = useSelector(selectQuizInProgress)

  // Memoized computed states for performance
  const computedStates = useMemo(
    () => ({
      isLoading: status === "loading",
      isSubmitting: status === "submitting",
      hasError: status === "error",
      isLastQuestion: currentQuestionIndex === questions.length - 1,
      hasValidQuestions: Array.isArray(questions) && questions.length > 0,
      shouldShowSignIn: !userId && isQuizComplete,
    }),
    [status, currentQuestionIndex, questions, userId, isQuizComplete],
  )

  // Initialize quiz following the slice pattern
  useEffect(() => {
    if (slug && !quizId) {
      if (quizData) {
        // Use provided data
        dispatch(fetchQuiz({ id: slug, data: quizData }))
      } else {
        // Fetch from API
        dispatch(fetchQuiz({ id: slug }))
      }
    }
  }, [dispatch, slug, quizId, quizData])

  // Handle reset parameter
  useEffect(() => {
    if (searchParams?.get("reset") === "true") {
      dispatch(setCurrentQuestionIndex(0))
    }
  }, [searchParams, dispatch])

  // Handle answer submission following the slice's Answer type
  const handleAnswer = useCallback(
    async (selectedOption: string, timeSpent: number, isCorrect: boolean) => {
      if (!currentQuestion) return

      // Create MCQAnswer following the exact slice type
      const answer: MCQAnswer = {
        questionId: currentQuestion.id,
        selectedOptionId: selectedOption,
        timestamp: Date.now(),
      }

      try {
        // Use the slice's saveAnswer thunk which handles session management
        await dispatch(saveAnswer({ questionId: currentQuestion.id, answer })).unwrap()

        // Move to next question if not last
        if (!computedStates.isLastQuestion) {
          dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
        }
      } catch (error) {
        toast.error("Failed to save answer. Please try again.")
      }
    },
    [currentQuestion, computedStates.isLastQuestion, dispatch, currentQuestionIndex],
  )

  // Handle quiz submission following the slice pattern
  const handleSubmitQuiz = useCallback(async () => {
    if (!userId) {
      // Create a preview of the results directly instead of using createMCQResultsPreview
      const questionResults = (questions as McqQuestion[]).map(q => {
        const answer = Object.values(answers).find(a => (a as MCQAnswer).questionId === q.id) as MCQAnswer | undefined;
        
        // Find the selected option from the question options
        const selectedOption = q.options && Array.isArray(q.options) ? 
          q.options.find(o => {
            if (typeof o === 'string') {
              return o === answer?.selectedOptionId;
            }
            return o.id === answer?.selectedOptionId;
          }) : undefined;
        
        // Find the correct option
        const correctOption = q.options && Array.isArray(q.options) ?
          q.options.find(o => {
            if (typeof o === 'string') {
              return o === q.correctOptionId || o === q.correctAnswer;
            }
            return o.id === q.correctOptionId || o.text === q.correctAnswer;
          }) : undefined;
        
        // Determine if the answer is correct
        const isCorrect = answer?.selectedOptionId === q.correctOptionId || 
                          answer?.selectedOptionId === q.correctAnswer;
        
        // Create the question result object
        return {
          id: q.id,
          question: q.text || q.question || '',
          userAnswer: typeof selectedOption === 'string' ? 
            selectedOption : 
            selectedOption?.text || answer?.selectedOptionId || 'Not answered',
          correctAnswer: typeof correctOption === 'string' ? 
            correctOption : 
            correctOption?.text || q.correctAnswer || q.correctOptionId || '',
          isCorrect: !!isCorrect
        };
      });
      
      // Calculate score
      const score = questionResults.filter(q => q.isCorrect).length;
      
      // Create preview object
      const preview: QuizResultsPreview = {
        title: quizTitle || "",
        score,
        maxScore: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        questions: questionResults,
        slug
      };

      dispatch(
        saveAuthRedirectState({
          slug,
          quizId: quizId || slug,
          type: "mcq",
          answers,
          currentQuestionIndex,
          tempResults: preview,
        }),
      )
      return
    }

    try {
      // Use the slice's submitQuiz thunk
      await dispatch(submitQuiz()).unwrap()
      router.replace(`/dashboard/mcq/${slug}/results`)
    } catch (error) {
      toast.error("Failed to submit quiz. Please try again.")
    }
  }, [userId, questions, answers, quizTitle, slug, dispatch, quizId, currentQuestionIndex, router])

  // Handle sign-in for unauthenticated users
  const handleSignIn = useCallback(() => {
    signIn(undefined, {
      callbackUrl: `/dashboard/mcq/${slug}?fromAuth=true`,
    })
  }, [slug])

  // Handle retry with proper error recovery
  const handleRetry = useCallback(() => {
    if (!userId) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/mcq/${slug}`)}`)
    } else {
      dispatch(fetchQuiz({ id: slug }))
    }
  }, [userId, slug, router, dispatch])

  // Memoized current question answer for performance
  const currentQuestionAnswer = useMemo(() => {
    if (!currentQuestion) return undefined
    const answer = answers[currentQuestion.id] as MCQAnswer | undefined
    return answer?.selectedOptionId
  }, [currentQuestion, answers])

  // Auto-submit for authenticated users when quiz is complete
  useEffect(() => {
    if (userId && isQuizComplete && status === "idle") {
      handleSubmitQuiz()
    }
  }, [userId, isQuizComplete, status, handleSubmitQuiz])

  // Loading state
  if (computedStates.isLoading) {
    return <InitializingDisplay />
  }

  // Submitting state
  if (computedStates.isSubmitting) {
    return <QuizSubmissionLoading quizType="mcq" />
  }

  // Error state
  if (computedStates.hasError) {
    return (
      <ErrorDisplay
        error={error || "Failed to load quiz"}
        onRetry={handleRetry}
        onReturn={() => router.push("/dashboard")}
      />
    )
  }

  // Empty questions state
  if (!computedStates.hasValidQuestions) {
    return (
      <EmptyQuestionsDisplay
        onReturn={() => router.push("/dashboard")}
        message="This quiz doesn't contain any questions. Please try another quiz."
      />
    )
  }

  // Show sign-in prompt for completed quiz (unauthenticated users)
  if (computedStates.shouldShowSignIn) {
    // Create a preview of the results directly instead of using createMCQResultsPreview
    const questionResults = (questions as McqQuestion[]).map(q => {
      const answer = Object.values(answers).find(a => (a as MCQAnswer).questionId === q.id) as MCQAnswer | undefined;
      
      // Find the selected option from the question options
      const selectedOption = q.options && Array.isArray(q.options) ? 
        q.options.find(o => {
          if (typeof o === 'string') {
            return o === answer?.selectedOptionId;
          }
          return o.id === answer?.selectedOptionId;
        }) : undefined;
      
      // Find the correct option
      const correctOption = q.options && Array.isArray(q.options) ?
        q.options.find(o => {
          if (typeof o === 'string') {
            return o === q.correctOptionId || o === q.correctAnswer;
          }
          return o.id === q.correctOptionId || o.text === q.correctAnswer;
        }) : undefined;
      
      // Determine if the answer is correct
      const isCorrect = answer?.selectedOptionId === q.correctOptionId || 
                        answer?.selectedOptionId === q.correctAnswer;
      
      // Create the question result object
      return {
        id: q.id,
        question: q.text || q.question || '',
        userAnswer: typeof selectedOption === 'string' ? 
          selectedOption : 
          selectedOption?.text || answer?.selectedOptionId || 'Not answered',
        correctAnswer: typeof correctOption === 'string' ? 
          correctOption : 
          correctOption?.text || q.correctAnswer || q.correctOptionId || '',
        isCorrect: !!isCorrect
      };
    });
    
    // Calculate score
    const score = questionResults.filter(q => q.isCorrect).length;
    
    // Create preview object
    const preview: QuizResultsPreview = {
      title: quizTitle || "",
      score,
      maxScore: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      questions: questionResults,
      slug
    };

    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="mcq"
        onSignIn={handleSignIn}
        showSaveMessage
        message="Please sign in to submit your quiz and save your results"
        previewData={preview}
      />
    )
  }

  // Show current question
  if (currentQuestion) {
    return (
      <McqQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        isLastQuestion={computedStates.isLastQuestion}
        isSubmitting={computedStates.isSubmitting}
        existingAnswer={currentQuestionAnswer}
      />
    )
  }

  // Fallback
  return <InitializingDisplay />
}
