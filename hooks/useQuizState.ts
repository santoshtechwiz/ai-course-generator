"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  fetchQuiz,
  getQuizResults,
  fetchQuizHistory,
  resetQuizState,
  setCurrentQuestion,
  setUserAnswer,
  startTimer,
  pauseTimer,
  resumeTimer,
  decrementTimer,
  markQuizCompleted,
  setError,
  saveQuizSubmissionState,
  clearQuizSubmissionState,
  getQuizSubmissionState,
  setSubmissionInProgress,
} from "@/store/slices/quizSlice"

import type { QuizData, QuizType, UserAnswer, QuizState } from "@/app/types/quiz-types"
import { signIn } from "next-auth/react"
import { loadPersistedQuizState, hasAuthRedirectState } from "@/store/middleware/persistQuizMiddleware"
import { formatTime } from "@/lib/utils/quiz-utils"

// Define return type for the useQuiz hook to fix TypeScript errors
export interface QuizHookReturn {
  // State
  quizData: QuizData | null;
  currentQuestion: number;
  userAnswers: UserAnswer[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  results: QuizState['results'];
  isCompleted: boolean;
  quizHistory: QuizState['quizHistory'];
  currentQuizId: string | null;
  timeRemaining: number | null;
  timerActive: boolean;
  isAuthRedirect: boolean;
  submissionInProgress: boolean;

  // Error fields for better granularity
  quizError: string | null;
  submissionError: string | null;
  resultsError: string | null;
  historyError: string | null;

  // Actions
  loadQuiz: (slug: string, type?: QuizType, initialData?: QuizData) => Promise<QuizData | null>;
  resetQuizState: () => void;
  nextQuestion: () => boolean;
  previousQuestion: () => boolean;
  isLastQuestion: () => boolean;
  saveAnswer: (questionId: string, answer: string | Record<string, string>) => void;
  setUserAnswer: (questionId: string, answer: string | Record<string, string>) => void; // alias
  submitQuiz: (payload: string | { slug: string; quizId?: string; type?: QuizType; answers: UserAnswer[]; timeTaken?: number }) => Promise<any>;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  getResults: (slug: string) => Promise<any>;
  loadQuizHistory: () => Promise<any>;
  requireAuthentication: (callbackUrl: string) => void;
  isAuthenticated: () => boolean;

  // Helpers
  formatRemainingTime: () => string;
  getCurrentQuestion: () => any;
  getCurrentAnswer: () => any;
  getQuestionById: (questionId: string) => any;
  getAnswerById: (questionId: string) => any;
  getQuizProgress: () => number;
  areAllQuestionsAnswered: () => boolean;
  navigateToResults: (slug: string) => void;

  // Submission state functions
  saveSubmissionState: (slug: string, state: string) => Promise<void>;
  clearSubmissionState: (slug: string) => Promise<void>;
  getSubmissionState: (slug: string) => Promise<any>;

  // Backward compatibility for tests
  saveQuizState?: () => void;
}

export function useQuiz(): QuizHookReturn {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const quizState = useAppSelector((state) => state.quiz)

  const [isAuthRedirect, setIsAuthRedirect] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Start countdown timer
  useEffect(() => {
    if (quizState.timerActive && quizState.timeRemaining !== null) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          dispatch(decrementTimer())
        }, 1000)
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [quizState.timerActive, quizState.timeRemaining, dispatch])

  // Auto-submit when time runs out
  useEffect(() => {
    if (
      quizState.timeRemaining === 0 &&
      !quizState.isCompleted &&
      quizState.quizData &&
      quizState.userAnswers.length > 0
    ) {
      void handleSubmitQuiz(quizState.quizData.slug)
    }
  }, [quizState.timeRemaining, quizState.isCompleted, quizState.quizData, quizState.userAnswers])

  // Auth redirect state restore
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAuthRedirect(hasAuthRedirectState())
    }
  }, [])

  useEffect(() => {
    if (!isAuthRedirect) return

    const persisted = loadPersistedQuizState()
    if (!persisted || !persisted.quizData) {
      setIsAuthRedirect(false)
      return
    }

    const { quizData, currentQuestion, userAnswers, timerActive, timeRemaining } = persisted

    void dispatch(fetchQuiz.fulfilled(quizData, "", {} as any))

    if (typeof currentQuestion === "number") dispatch(setCurrentQuestion(currentQuestion))
    if (Array.isArray(userAnswers)) userAnswers.forEach((ans) => dispatch(setUserAnswer(ans)))
    if (typeof timeRemaining === "number") dispatch(startTimer())
    if (!timerActive) dispatch(pauseTimer())

    setIsAuthRedirect(false)
  }, [isAuthRedirect, dispatch])

  const requireAuthentication = useCallback((callbackUrl: string) => {
    signIn(undefined, { callbackUrl })
  }, [])

  const loadQuiz = useCallback(
    async (slug: string, type: QuizType = "mcq", initialData?: QuizData) => {
      if (initialData && Array.isArray(initialData.questions)) {
        dispatch(fetchQuiz.fulfilled(initialData, "", { slug, type }))
        return initialData
      }

      try {
        const result = await dispatch(fetchQuiz({ slug, type })).unwrap()
        return result
      } catch (error: any) {
        console.error("Error loading quiz:", error)

        // Handle authentication errors - call signIn for 401/Unauthorized
        if (
          error === "Unauthorized" ||
          (typeof error === "string" && error.includes("auth")) ||
          error?.status === 401 ||
          error?.message?.includes("auth")
        ) {
          signIn(undefined, { callbackUrl: `/dashboard/${type}/${slug}` })
        }

        throw error
      }
    },
    [dispatch],
  )

  const nextQuestion = useCallback(() => {
    const questions = quizState.quizData?.questions
    if (questions && quizState.currentQuestion < questions.length - 1) {
      dispatch(setCurrentQuestion(quizState.currentQuestion + 1))
      return true
    }
    return false
  }, [dispatch, quizState.currentQuestion, quizState.quizData])

  const previousQuestion = useCallback(() => {
    if (quizState.currentQuestion <= 0) return false
    dispatch(setCurrentQuestion(quizState.currentQuestion - 1))
    return true
  }, [dispatch, quizState.currentQuestion])

  const isLastQuestion = useCallback(() => {
    if (!quizState.quizData?.questions) return false
    return quizState.currentQuestion === quizState.quizData.questions.length - 1
  }, [quizState.quizData, quizState.currentQuestion])

  const saveAnswer = useCallback(
    (questionId: string, answer: string | Record<string, string>) => {
      dispatch(setUserAnswer({ questionId, answer }))
    },
    [dispatch],
  )

  const getSubmissionState = useCallback(
    async (slug: string) => {
      if (!slug) return null;
      return dispatch(getQuizSubmissionState(slug)).unwrap();
    },
    [dispatch]
  );
  
  const saveSubmissionState = useCallback(
    async (slug: string, state: string) => {
      if (!slug) return;
      await dispatch(saveQuizSubmissionState({ slug, state })).unwrap();
    },
    [dispatch]
  );
  
  const clearSubmissionState = useCallback(
    async (slug: string) => {
      if (!slug) return;
      await dispatch(clearQuizSubmissionState(slug)).unwrap();
    },
    [dispatch]
  );

  const handleSubmitQuiz = useCallback(
    async (
      payload: string | { slug: string; quizId?: string; type?: QuizType; answers: UserAnswer[]; timeTaken?: number },
    ) => {
      // Handle case when payload is undefined or null
      if (!payload) {
        console.error("Quiz submission payload is undefined or null")
        dispatch(setError("Invalid quiz submission data"))
        throw new Error("Invalid quiz submission data")
      }

      // Check if payload is a string (for backward compatibility)
      if (typeof payload === "string") {
        // If payload is just a slug string, use current quiz state
        const slug = payload
        const quizId = quizState.quizData?.id
        const type = quizState.quizData?.type || "mcq"
        const answers = quizState.userAnswers

        // Recursively call this function with properly structured payload
        return handleSubmitQuiz({
          slug,
          quizId,
          type,
          answers,
        })
      }

      // Original function implementation for object payload
      const { slug, quizId, type, answers = [] } = payload

      // Validate required fields
      if (!slug) {
        const errorMsg = "Missing slug for quiz submission"
        console.error(errorMsg)
        dispatch(setError(errorMsg))
        throw new Error(errorMsg)
      }

      if (!Array.isArray(answers) || answers.length === 0) {
        const errorMsg = "Invalid or empty answers array"
        console.error(errorMsg, answers)
        dispatch(setError(errorMsg))
        throw new Error(errorMsg)
      }

      try {
        // Ensure the payload has a valid quiz type
        const quizType = type || quizState.quizData?.type || "mcq"

        // Ensure we have a valid quizId
        const quizIdToUse = quizId || quizState.quizData?.id

        if (!quizIdToUse) {
          console.warn("Missing quizId for submission, this may cause issues")
        }

        // Pause timer to prevent state changes during submission
        dispatch(pauseTimer())

        // Instead of using localStorage directly, use our Redux action
        await saveSubmissionState(slug, "in-progress");
        dispatch(setSubmissionInProgress(true));

        // Make API call
        try {
          const response = await fetch(`/api/quizzes/common/${slug}/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
            credentials: "include", // Add this line
            body: JSON.stringify({
              quizId: quizIdToUse,
              answers,
              type: quizType,
              timeTaken: payload.timeTaken,
            }),
          })

          if (!response.ok) {
            // Check for 401 unauthorized response
            if (response.status === 401) {
              dispatch(setError("Session expired"))

              // Redirect for authentication
              signIn(undefined, { callbackUrl: `/dashboard/${quizType}/${slug}` })
              throw new Error("Session expired")
            }

            // For other errors
            throw new Error(`Server error: ${response.status} ${response.statusText}`)
          }

          // Handle both response formats - some tests might return text instead of json
          let result
          if (typeof response.json === "function") {
            result = await response.json()
          } else if (typeof response.text === "function") {
            const text = await response.text()
            try {
              result = JSON.parse(text)
            } catch (e) {
              console.warn("Failed to parse response as JSON:", text)
              result = { text }
            }
          } else {
            // For test mocks that might directly return the data
            result = response
          }

          // Mark quiz as completed with the result
          dispatch(markQuizCompleted(result))

          // Clear submission state after successful submission
          await clearSubmissionState(slug);
          dispatch(setSubmissionInProgress(false));

          return result
        } catch (error: any) {
          console.error("Error submitting quiz:", error?.message || error)

          // Clear submission state on error
          await clearSubmissionState(slug);
          dispatch(setSubmissionInProgress(false));

          // For non-Session errors, set a generic error message
          if (!error?.message?.includes("Session expired")) {
            dispatch(setError("Failed to submit quiz. Please try again."))

            // Re-enable timer if submission fails and time remains
            if (quizState.timeRemaining && quizState.timeRemaining > 0) {
              dispatch(resumeTimer())
            }
          }

          throw error
        }
      } catch (error: any) {
        console.error("Error submitting quiz:", error?.message || error)

        // Clear submission state on outer error
        await clearSubmissionState(slug);
        dispatch(setSubmissionInProgress(false));

        // For non-Session errors, set a generic error message
        if (!error?.message?.includes("Session expired")) {
          dispatch(setError("Failed to submit quiz. Please try again."))

          // Re-enable timer if submission fails and time remains
          if (quizState.timeRemaining && quizState.timeRemaining > 0) {
            dispatch(resumeTimer())
          }
        }

        throw error
      }
    },
    [dispatch, quizState, saveSubmissionState, clearSubmissionState]
  )

  // Fix the duplicate getQuizResults function
  const fetchQuizResults = useCallback(
    (slug: string) => {
      // If we already have results in the state and they match the slug, return them
      if (quizState.results && quizState.quizData?.slug === slug) {
        return Promise.resolve(quizState.results)
      }

      // Otherwise fetch from API
      return dispatch(getQuizResults(slug)).unwrap()
    },
    [dispatch, quizState.results, quizState.quizData?.slug],
  )

  const isAuthenticated = useCallback(() => {
    // This is a simple check - in a real app, you might want to use the session state
    return (typeof window !== "undefined" && !!sessionStorage.getItem("user")) || false
  }, [])

  const startQuizTimer = useCallback(() => dispatch(startTimer()), [dispatch])
  const pauseQuizTimer = useCallback(() => dispatch(pauseTimer()), [dispatch])
  const resumeQuizTimer = useCallback(() => dispatch(resumeTimer()), [dispatch])

  const loadQuizHistory = useCallback(() => dispatch(fetchQuizHistory()).unwrap(), [dispatch])

  const formatRemainingTime = useCallback(() => formatTime(quizState.timeRemaining), [quizState.timeRemaining])

  const getCurrentQuestion = useCallback(() => {
    const list = quizState.quizData?.questions
    return list?.[quizState.currentQuestion] || null
  }, [quizState.quizData, quizState.currentQuestion])

  const getCurrentAnswer = useCallback(() => {
    const current = getCurrentQuestion()
    if (!current) return null

    // Improved performance by using find direct by question id instead of calling getCurrentQuestion twice
    return quizState.userAnswers.find((a) => a.questionId === current.id)?.answer ?? null
  }, [getCurrentQuestion, quizState.userAnswers])

  const getQuestionById = useCallback(
    (questionId: string) => {
      return quizState.quizData?.questions?.find((q) => q.id === questionId) || null
    },
    [quizState.quizData],
  )

  const getAnswerById = useCallback(
    (questionId: string) => {
      return quizState.userAnswers.find((a) => a.questionId === questionId)?.answer || null
    },
    [quizState.userAnswers],
  )

  const getQuizProgress = useCallback(() => {
    if (!quizState.quizData?.questions?.length) return 0
    return (quizState.userAnswers.length / quizState.quizData.questions.length) * 100
  }, [quizState.quizData, quizState.userAnswers])

  const areAllQuestionsAnswered = useCallback(() => {
    if (!quizState.quizData?.questions) return false
    const uniqueAnswers = new Set(quizState.userAnswers.map((a) => a.questionId))
    return uniqueAnswers.size === quizState.quizData.questions.length
  }, [quizState.quizData, quizState.userAnswers])

  const navigateToResults = useCallback(
    (slug: string) => {
      const type = quizState.quizData?.type || "mcq"
      router.push(`/dashboard/${type}/${slug}/results`)
    },
    [router, quizState.quizData],
  )

  // Add the saveQuizState for backward compatibility with tests
  const saveQuizState = useCallback(() => {
    // For backward compatibility with tests, save the current quiz state
    const slug = quizState.quizData?.slug;
    if (slug) {
      saveSubmissionState(slug, "active");
    }
  }, [quizState.quizData?.slug, saveSubmissionState]);

  return {
    // State
    quizData: quizState.quizData,
    currentQuestion: quizState.currentQuestion,
    userAnswers: quizState.userAnswers,
    isLoading: quizState.isLoading,
    isSubmitting: quizState.isSubmitting,
    error: quizState.quizError || quizState.error, // Combine error fields for compatibility
    quizError: quizState.quizError,
    submissionError: quizState.submissionError,
    resultsError: quizState.resultsError,
    historyError: quizState.historyError,
    results: quizState.results,
    isCompleted: quizState.isCompleted,
    quizHistory: quizState.quizHistory,
    currentQuizId: quizState.currentQuizId,
    timeRemaining: quizState.timeRemaining,
    timerActive: quizState.timerActive,
    isAuthRedirect,
    submissionInProgress: quizState.submissionStateInProgress,

    // Actions
    loadQuiz,
    resetQuizState: () => dispatch(resetQuizState()),
    nextQuestion,
    previousQuestion,
    isLastQuestion,
    saveAnswer,
    setUserAnswer: saveAnswer, // backward compatible
    submitQuiz: handleSubmitQuiz, // renamed but backward compatible
    startTimer: startQuizTimer,
    pauseTimer: pauseQuizTimer,
    resumeTimer: resumeQuizTimer,
    getResults: fetchQuizResults,
    loadQuizHistory,
    requireAuthentication,
    isAuthenticated,

    // Helpers
    formatRemainingTime,
    getCurrentQuestion,
    getCurrentAnswer,
    getQuestionById,
    getAnswerById,
    getQuizProgress,
    areAllQuestionsAnswered,
    navigateToResults,

    // Add saveQuizState for backward compatibility
    saveQuizState,

    // Add new submission state functions
    saveSubmissionState,
    clearSubmissionState,
    getSubmissionState,
  }
}
