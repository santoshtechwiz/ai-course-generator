"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession, signIn } from "next-auth/react"

// Define types
export type QuizType = "mcq" | "blanks" | "openended" | "code" | "flashcard"

export interface QuizAnswer {
  answer: string
  timeSpent: number
  isCorrect: boolean
  hintsUsed?: boolean
  similarity?: number
}

export interface QuizState {
  quizId: string
  slug: string
  quizType: QuizType
  currentQuestion: number
  totalQuestions: number
  startTime: number
  answers: QuizAnswer[]
  isCompleted: boolean
  score?: number
  redirectPath?: string
}

export interface QuizResult {
  quizId: string
  slug: string
  quizType: QuizType
  score: number
  answers: QuizAnswer[]
  totalTime: number
  timestamp: number
  isCompleted: boolean
  redirectPath?: string
}

// Define action types
type QuizAction =
  | { type: "SET_CURRENT_QUESTION"; payload: number }
  | { type: "SET_ANSWERS"; payload: QuizAnswer[] }
  | { type: "SET_ANSWER"; payload: { index: number; answer: QuizAnswer } }
  | { type: "SET_SCORE"; payload: number }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_COMPLETED"; payload: boolean }
  | { type: "RESET_QUIZ" }
  | { type: "INITIALIZE_QUIZ"; payload: Partial<QuizState> }
  | { type: "COMPLETE_QUIZ"; payload: { score: number; answers: QuizAnswer[] } }

// Define context state
interface QuizContextState {
  quizId: string
  slug: string
  title: string
  description: string
  quizType: QuizType
  questionCount: number
  currentQuestionIndex: number
  answers: QuizAnswer[]
  isCompleted: boolean
  isLoading: boolean
  error: string | null
  score: number
  showAuthPrompt: boolean
  isSaving: boolean
}

// Define context type
interface QuizContextType {
  state: QuizContextState
  dispatch: React.Dispatch<QuizAction>
  nextQuestion: () => void
  prevQuestion: () => void
  submitAnswer: (answer: string, timeSpent: number, isCorrect: boolean) => void
  completeQuiz: (finalAnswers: QuizAnswer[]) => void
  restartQuiz: () => void
  handleSignIn: () => void
  closeAuthPrompt: () => void
}

// Initial state
const initialState: QuizContextState = {
  quizId: "",
  slug: "",
  title: "",
  description: "",
  quizType: "mcq",
  questionCount: 0,
  currentQuestionIndex: 0,
  answers: [],
  isCompleted: false,
  isLoading: true,
  error: null,
  score: 0,
  showAuthPrompt: false,
  isSaving: false,
}

// Create context
const QuizContext = createContext<QuizContextType | undefined>(undefined)

// Reducer function
const quizReducer = (state: QuizContextState, action: QuizAction): QuizContextState => {
  switch (action.type) {
    case "SET_CURRENT_QUESTION":
      return { ...state, currentQuestionIndex: action.payload }
    case "SET_ANSWERS":
      return { ...state, answers: action.payload }
    case "SET_ANSWER":
      const newAnswers = [...state.answers]
      newAnswers[action.payload.index] = action.payload.answer
      return { ...state, answers: newAnswers }
    case "SET_SCORE":
      return { ...state, score: action.payload }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "SET_COMPLETED":
      return { ...state, isCompleted: action.payload }
    case "INITIALIZE_QUIZ":
      return {
        ...state,
        ...action.payload,
        answers: action.payload.answers || new Array(state.questionCount).fill(null),
      }
    case "COMPLETE_QUIZ":
      return {
        ...state,
        isCompleted: true,
        score: action.payload.score,
        answers: action.payload.answers,
      }
    case "RESET_QUIZ":
      return {
        ...state,
        currentQuestionIndex: 0,
        answers: new Array(state.questionCount).fill(null),
        isCompleted: false,
        score: 0,
        error: null,
      }
    default:
      return state
  }
}

// Storage helpers
const saveToStorage = (key: string, data: any, expirationHours = 24) => {
  if (typeof window === "undefined") return

  try {
    const item = {
      value: data,
      expiry: Date.now() + expirationHours * 60 * 60 * 1000,
    }
    localStorage.setItem(key, JSON.stringify(item))
  } catch (error) {
    console.error(`Error saving to storage with key ${key}:`, error)
  }
}

const getFromStorage = (key: string) => {
  if (typeof window === "undefined") return null

  try {
    const itemStr = localStorage.getItem(key)
    if (!itemStr) return null

    const item = JSON.parse(itemStr)

    // Check if the item has expired
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(key)
      return null
    }

    return item.value
  } catch (error) {
    console.error(`Error getting from storage with key ${key}:`, error)
    return null
  }
}

// Provider props
interface QuizProviderProps {
  children: React.ReactNode
  quizData: any
  slug: string
}

// Provider component
export const QuizProvider: React.FC<QuizProviderProps> = ({ children, quizData, slug }) => {
  const [state, dispatch] = useReducer(quizReducer, {
    ...initialState,
    quizId: quizData?.id || "",
    slug,
    title: quizData?.title || "",
    description: quizData?.description || "",
    questionCount: quizData?.questions?.length || 0,
    answers: new Array(quizData?.questions?.length || 0).fill(null),
  })

  const { data: session, status } = useSession()
  const router = useRouter()
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [authFlowInProgress, setAuthFlowInProgress] = useState(false)
  const [startTime] = useState(Date.now())

  const isAuthenticated = status === "authenticated"

  // Initialize quiz state
  useEffect(() => {
    const initializeQuiz = async () => {
      if (status === "loading") return

      dispatch({ type: "SET_LOADING", payload: true })

      try {
        // Check if quiz data is valid
        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
          dispatch({
            type: "SET_ERROR",
            payload: "This quiz has no questions. Please try another quiz.",
          })
          dispatch({ type: "SET_LOADING", payload: false })
          return
        }

        // Check if we just completed authentication flow
        const justAuthenticated =
          typeof window !== "undefined" &&
          sessionStorage.getItem("quizAuthComplete") === "true" &&
          sessionStorage.getItem("quizRedirectPath")?.includes(slug)

        // Check URL parameters
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search)
          const hasCompletedParam = urlParams.get("completed") === "true"

          if (hasCompletedParam || justAuthenticated) {
            // Load saved result
            const savedResult = getFromStorage(`quiz_result_${state.quizId}`)

            if (savedResult) {
              dispatch({
                type: "COMPLETE_QUIZ",
                payload: {
                  score: savedResult.score || 0,
                  answers: savedResult.answers || [],
                },
              })
            } else {
              // Try to get result from guest storage
              const guestResult = getFromStorage(`guest_quiz_${state.quizId}`)

              if (guestResult) {
                dispatch({
                  type: "COMPLETE_QUIZ",
                  payload: {
                    score: guestResult.score || 0,
                    answers: guestResult.answers || [],
                  },
                })

                // If authenticated, save guest result to user account
                if (isAuthenticated) {
                  saveQuizResult(guestResult)
                  clearGuestResult()
                }
              }
            }

            // Clear auth flow markers
            if (justAuthenticated) {
              sessionStorage.removeItem("quizAuthComplete")
              sessionStorage.removeItem("quizRedirectPath")
              sessionStorage.removeItem("quizData")
              sessionStorage.removeItem("quizAuthFlow")
            }
          } else {
            // Check for saved state
            const savedState = getFromStorage(`quiz_state_${state.quizId}`)

            if (savedState) {
              dispatch({
                type: "INITIALIZE_QUIZ",
                payload: {
                  currentQuestionIndex: savedState.currentQuestion || 0,
                  answers: savedState.answers || [],
                  isCompleted: savedState.isCompleted || false,
                  score: savedState.score || 0,
                },
              })

              // If completed, redirect to results page
              if (savedState.isCompleted && !hasCompletedParam) {
                router.replace(`/dashboard/mcq/${slug}?completed=true`)
                return
              }
            }
          }
        }
      } catch (error) {
        console.error("Error initializing quiz:", error)
        dispatch({ type: "SET_ERROR", payload: "Failed to initialize quiz. Please try again." })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    initializeQuiz()
  }, [quizData, slug, status, router, state.quizId, isAuthenticated])

  // Save quiz state when answers change
  useEffect(() => {
    if (state.answers.length > 0 && state.quizId && !state.isLoading) {
      saveQuizState()
    }
  }, [state.answers, state.currentQuestionIndex])

  // Save state before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!state.isCompleted && state.answers.some((a) => a !== null) && state.quizId) {
        saveQuizState()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [state.answers, state.currentQuestionIndex, state.isCompleted, state.quizId])

  // Helper functions
  const saveQuizState = () => {
    const quizState: QuizState = {
      quizId: state.quizId,
      slug: state.slug,
      quizType: state.quizType,
      currentQuestion: state.currentQuestionIndex,
      totalQuestions: state.questionCount,
      startTime,
      answers: state.answers.filter((a) => a !== null),
      isCompleted: state.isCompleted,
      score: state.score,
    }

    saveToStorage(`quiz_state_${state.quizId}`, quizState, 24)
  }

  const saveQuizResult = async (result: QuizResult) => {
    if (!result.quizId) return

    // Save to localStorage
    saveToStorage(`quiz_result_${result.quizId}`, result, 72)

    // If authenticated, save to server
    if (isAuthenticated) {
      try {
        const response = await fetch(`/api/quiz/${result.slug}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizId: result.quizId,
            slug: result.slug,
            answers: result.answers,
            totalTime: result.totalTime,
            score: result.score,
            type: result.quizType,
            totalQuestions: result.answers.length,
            completedAt: new Date().toISOString(),
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to save quiz result: ${response.status}`)
        }

        // Mark as saved to server
        localStorage.setItem(`quiz_${result.quizId}_saved`, "true")
      } catch (error) {
        console.error("Error saving quiz result to server:", error)
      }
    }
  }

  const saveGuestResult = (result: QuizResult) => {
    if (!result.quizId) return

    saveToStorage(`guest_quiz_${result.quizId}`, result, 72)
  }

  const clearGuestResult = () => {
    if (typeof window === "undefined" || !state.quizId) return

    localStorage.removeItem(`guest_quiz_${state.quizId}`)
  }

  const calculateScore = (answers: QuizAnswer[]): number => {
    const validAnswers = answers.filter((a) => a !== null)
    if (validAnswers.length === 0) return 0

    const correctCount = validAnswers.filter((a) => a && a.isCorrect).length
    return Math.round((correctCount / validAnswers.length) * 100)
  }

  // Action handlers
  const nextQuestion = useCallback(() => {
    if (state.currentQuestionIndex < state.questionCount - 1) {
      dispatch({ type: "SET_CURRENT_QUESTION", payload: state.currentQuestionIndex + 1 })
    }
  }, [state.currentQuestionIndex, state.questionCount])

  const prevQuestion = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
      dispatch({ type: "SET_CURRENT_QUESTION", payload: state.currentQuestionIndex - 1 })
    }
  }, [state.currentQuestionIndex])

  const submitAnswer = useCallback(
    (answer: string, timeSpent: number, isCorrect: boolean) => {
      dispatch({
        type: "SET_ANSWER",
        payload: {
          index: state.currentQuestionIndex,
          answer: { answer, timeSpent, isCorrect },
        },
      })

      // Auto-advance to next question if not the last question
      if (state.currentQuestionIndex < state.questionCount - 1) {
        setTimeout(() => {
          nextQuestion()
        }, 1000)
      }
    },
    [state.currentQuestionIndex, state.questionCount, nextQuestion],
  )

  const completeQuiz = useCallback(
    async (finalAnswers: QuizAnswer[]) => {
      // Calculate score
      const score = calculateScore(finalAnswers)

      // Create result object
      const result: QuizResult = {
        quizId: state.quizId,
        slug: state.slug,
        quizType: state.quizType,
        score,
        answers: finalAnswers,
        totalTime: (Date.now() - startTime) / 1000,
        timestamp: Date.now(),
        isCompleted: true,
        redirectPath: `/dashboard/mcq/${state.slug}?completed=true`,
      }

      // Update state
      dispatch({
        type: "COMPLETE_QUIZ",
        payload: { score, answers: finalAnswers },
      })

      // If authenticated, save result
      if (isAuthenticated) {
        await saveQuizResult(result)
      } else {
        // Save as guest result
        saveGuestResult(result)
        // Show auth prompt
        setShowAuthPrompt(true)
      }

      // Save state as completed
      saveQuizState()
    },
    [state.quizId, state.slug, state.quizType, isAuthenticated, startTime],
  )

  const restartQuiz = useCallback(() => {
    dispatch({ type: "RESET_QUIZ" })
    router.refresh()
  }, [router])

  const handleSignIn = useCallback(() => {
    if (authFlowInProgress) return

    setAuthFlowInProgress(true)

    // Store quiz data for auth flow
    if (typeof window !== "undefined") {
      sessionStorage.setItem("quizAuthFlow", "true")
      sessionStorage.setItem(
        "quizData",
        JSON.stringify({
          quizId: state.quizId,
          slug: state.slug,
          quizType: state.quizType,
        }),
      )
      sessionStorage.setItem("quizRedirectPath", `/dashboard/mcq/${state.slug}?completed=true`)
    }

    // Redirect to sign in
    signIn(undefined, {
      callbackUrl: `/dashboard/mcq/${state.slug}?completed=true`,
    }).catch((error) => {
      console.error("Sign in error:", error)
      setAuthFlowInProgress(false)
    })
  }, [state.quizId, state.slug, state.quizType, authFlowInProgress])

  const closeAuthPrompt = useCallback(() => {
    setShowAuthPrompt(false)
  }, [])

  // Check for auth flow completion
  useEffect(() => {
    if (isAuthenticated && typeof window !== "undefined") {
      const inAuthFlow = sessionStorage.getItem("quizAuthFlow") === "true"

      if (inAuthFlow) {
        // Mark auth flow as complete
        sessionStorage.setItem("quizAuthComplete", "true")
        sessionStorage.removeItem("quizAuthFlow")

        // Get saved quiz data
        const quizDataStr = sessionStorage.getItem("quizData")
        if (quizDataStr) {
          try {
            const quizData = JSON.parse(quizDataStr)

            // Get guest result
            const guestResult = getFromStorage(`guest_quiz_${quizData.quizId}`)

            if (guestResult) {
              // Save guest result to user account
              saveQuizResult(guestResult)
              // Clear guest result
              clearGuestResult()
            }
          } catch (error) {
            console.error("Error parsing quiz data:", error)
          }
        }
      }
    }
  }, [isAuthenticated])

  const contextValue = {
    state: {
      ...state,
      showAuthPrompt,
    },
    dispatch,
    nextQuestion,
    prevQuestion,
    submitAnswer,
    completeQuiz,
    restartQuiz,
    handleSignIn,
    closeAuthPrompt,
  }

  return <QuizContext.Provider value={contextValue}>{children}</QuizContext.Provider>
}

// Custom hook
export const useQuiz = () => {
  const context = useContext(QuizContext)
  if (!context) {
    throw new Error("useQuiz must be used within a QuizProvider")
  }
  return context
}
