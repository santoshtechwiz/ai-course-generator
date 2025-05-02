// Replace the entire file with a simplified version that uses Redux

"use client"

import type React from "react"
import { createContext, useContext, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/unified-auth-provider"
import { toast } from "@/hooks/use-toast"
import type { QuizType, QuizDataInput, QuizSubmission, QuizAnswer, QuizResult } from "@/app/types/quiz-types"
import { useDispatch, useSelector } from "react-redux"
import {
  initializeQuiz,
  setCurrentQuestion,
  setAnswer,
  completeQuiz as completeQuizAction,
  resetQuiz as resetQuizAction,
  setAnimationState,
  setRequiresAuth,
  setHasGuestResult,
  clearGuestResults as clearGuestResultsAction,
  setLoading,
  setLoadingResults,
  setResultsReady,
  setError,
  setSavingResults,
  selectQuizState,
} from "../store/quizSlice"
import { quizApi } from "@/lib/quiz-api"

// -- Context Type ----------------------------------
export interface QuizContextType {
  state: ReturnType<typeof selectQuizState>
  isAuthenticated: boolean
  nextQuestion: () => void
  prevQuestion: () => void
  submitAnswer: (answer: string, timeSpent: number, isCorrect: boolean, similarity?: number) => void
  completeQuiz: (finalAnswers: (QuizAnswer | null)[], finalScore?: number) => void
  restartQuiz: () => void
  getTimeSpentOnCurrentQuestion: () => number
  fetchQuizResults: () => Promise<boolean>
  clearQuizData: () => Promise<void>
  retryLoadingResults: () => Promise<void>
  onAuthRequired?: (redirectUrl: string) => void
  handleAuthenticationRequired: () => void
  clearGuestResults: () => void
  dispatch: any
}

// -- Provider --------------------------------------------------
interface QuizProviderProps {
  children: React.ReactNode
  quizData: QuizDataInput
  slug: string
  quizType: QuizType | string
  onAuthRequired?: (redirectUrl: string) => void
}

const QuizContext = createContext<QuizContextType | undefined>(undefined)

export const QuizProvider: React.FC<QuizProviderProps> = ({ children, quizData, slug, quizType, onAuthRequired }) => {
  const dispatch = useDispatch()
  const state = useSelector(selectQuizState)
  const { signIn, isAuthenticated: authIsAuthenticated } = useAuth()
  const router = useRouter()
  const startTimeRef = useRef(Date.now())
  const completionInProgress = useRef(false)

  // Initialize quiz on mount
  useEffect(() => {
    const quizId = quizData?.quizId || quizData?.id || ""

    dispatch(
      initializeQuiz({
        quizId,
        slug,
        title: quizData?.title || "",
        description: quizData?.description || "",
        quizType: quizData?.quizType || quizType,
        questionCount: quizData?.questions?.length || 0,
        quizData,
        startTime: Date.now(),
      }),
    )

    // Check for completed state in localStorage
    if (typeof window !== "undefined") {
      const isCompleted = localStorage.getItem(`quiz_${quizId}_completed`) === "true"
      if (isCompleted) {
        fetchQuizResults()
      }
    }
  }, [dispatch, quizData, slug, quizType])

  // Clean up URL parameters
  const cleanupUrlIfNeeded = () => {
    if (typeof window === "undefined") return

    if (window.location.search && window.history && window.history.replaceState) {
      const url = new URL(window.location.href)
      url.search = ""
      window.history.replaceState({}, document.title, url.toString())
    }
  }

  // Clear guest results
  const clearGuestResults = () => {
    if (state.quizId) {
      // Clear guest result from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem(`guest_quiz_${state.quizId}`)
        localStorage.removeItem(`quiz_${state.quizId}_completed`)
      }
    }

    dispatch(clearGuestResultsAction())
  }

  // Handle authentication required
  const handleAuthenticationRequired = () => {
    // If user is already authenticated, don't redirect
    if (authIsAuthenticated) return

    // Create redirect URL
    const redirectUrl = `/dashboard/${state.quizType}/${state.slug}?completed=true`

    try {
      // Save current state before redirecting
      if (typeof window !== "undefined") {
        // Save minimal data needed for auth redirect
        localStorage.setItem(
          "pendingQuizData",
          JSON.stringify({
            quizId: state.quizId,
            slug: state.slug,
            type: state.quizType,
            answers: state.answers,
            score: state.score,
          }),
        )
        localStorage.setItem("quizAuthRedirect", redirectUrl)
        localStorage.setItem("inAuthFlow", "true")
      }

      if (!onAuthRequired) {
        // Fallback to direct sign-in
        if (typeof signIn === "function") {
          signIn("credentials", { callbackUrl: redirectUrl })
          return
        }

        // If no signIn function, redirect directly
        if (typeof window !== "undefined") {
          window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`
        }
        return
      }

      // Call the provided auth handler
      onAuthRequired(redirectUrl)
    } catch (error) {
      console.error("Error in handleAuthenticationRequired:", error)
      toast({
        title: "Authentication error",
        description: "There was a problem with the authentication process. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Navigation
  const nextQuestion = () => {
    if (state.currentQuestionIndex < state.questionCount - 1) {
      dispatch(setCurrentQuestion(state.currentQuestionIndex + 1))

      // Save current state to localStorage for guest users
      if (!authIsAuthenticated && typeof window !== "undefined") {
        localStorage.setItem(
          `quiz_state_${state.quizType}_${state.quizId}`,
          JSON.stringify({
            quizId: state.quizId,
            type: state.quizType,
            slug: state.slug,
            currentQuestion: state.currentQuestionIndex + 1,
            totalQuestions: state.questionCount,
            startTime: startTimeRef.current,
            isCompleted: false,
            answers: state.answers,
            timeSpentPerQuestion: state.timeSpentPerQuestion,
          }),
        )
      }
    }
  }

  const prevQuestion = () => {
    if (state.currentQuestionIndex > 0) {
      dispatch(setCurrentQuestion(state.currentQuestionIndex - 1))

      // Save current state to localStorage for guest users
      if (!authIsAuthenticated && typeof window !== "undefined") {
        localStorage.setItem(
          `quiz_state_${state.quizType}_${state.quizId}`,
          JSON.stringify({
            quizId: state.quizId,
            type: state.quizType,
            slug: state.slug,
            currentQuestion: state.currentQuestionIndex - 1,
            totalQuestions: state.questionCount,
            startTime: startTimeRef.current,
            isCompleted: false,
            answers: state.answers,
            timeSpentPerQuestion: state.timeSpentPerQuestion,
          }),
        )
      }
    }
  }

  // Submit answer
  const submitAnswer = (answer: string, timeSpent: number, isCorrect: boolean, similarity?: number) => {
    const answerObj: QuizAnswer = { answer, timeSpent, isCorrect, similarity }

    dispatch(
      setAnswer({
        index: state.currentQuestionIndex,
        answer: answerObj,
      }),
    )

    // Save current state with the new answer for guest users
    if (!authIsAuthenticated && typeof window !== "undefined") {
      const updatedAnswers = [...state.answers]
      updatedAnswers[state.currentQuestionIndex] = answerObj

      localStorage.setItem(
        `quiz_state_${state.quizType}_${state.quizId}`,
        JSON.stringify({
          quizId: state.quizId,
          type: state.quizType,
          slug: state.slug,
          currentQuestion: state.currentQuestionIndex,
          totalQuestions: state.questionCount,
          startTime: startTimeRef.current,
          isCompleted: false,
          answers: updatedAnswers,
          timeSpentPerQuestion: state.timeSpentPerQuestion,
        }),
      )
    }

    if (state.currentQuestionIndex < state.questionCount - 1) {
      setTimeout(nextQuestion, 500)
    }
  }

  // Retry loading results
  const retryLoadingResults = async () => {
    dispatch(setError(null))
    await fetchQuizResults()
  }

  // Calculate score
  const calculateScore = (answers: (QuizAnswer | null)[]) => {
    const valid = answers.filter((a) => a !== null) as QuizAnswer[]
    if (!valid.length) return 0

    // Simple score calculation
    const correctCount = valid.filter((a) => a.isCorrect).length
    return Math.round((correctCount / valid.length) * 100)
  }

  // Complete quiz
  const handleCompleteQuiz = (finalAnswers: (QuizAnswer | null)[], finalScore?: number) => {
    // Prevent multiple completions
    if (completionInProgress.current || state.isCompleted) {
      return
    }

    // Validate input parameters
    if (!Array.isArray(finalAnswers)) {
      console.error("Invalid finalAnswers provided:", finalAnswers)
      toast({
        title: "Error completing quiz",
        description: "Invalid quiz data. Please try again.",
        variant: "destructive",
      })
      return
    }

    // Check if we have any non-null answers
    const validAnswerCount = finalAnswers.filter((a) => a !== null).length
    if (validAnswerCount === 0) {
      console.error("No valid answers to submit")
      toast({
        title: "Cannot complete quiz",
        description: "No answers were provided. Please answer at least one question.",
        variant: "destructive",
      })
      return
    }

    completionInProgress.current = true
    dispatch(setAnimationState("completing"))

    const score = finalScore !== undefined ? finalScore : calculateScore(finalAnswers)
    const filled = [...finalAnswers]
    while (filled.length < state.questionCount) filled.push(null)

    setTimeout(() => {
      try {
        // Complete the quiz in Redux
        dispatch(completeQuizAction({ score, answers: filled }))

        // Save the result for guest users
        if (!authIsAuthenticated && typeof window !== "undefined") {
          const validAnswers = filled.filter((a) => a !== null) as QuizAnswer[]

          const quizResult: QuizResult = {
            quizId: state.quizId,
            slug: state.slug,
            type: state.quizType,
            score,
            answers: validAnswers,
            totalTime: (Date.now() - startTimeRef.current) / 1000,
            totalQuestions: state.questionCount,
            completedAt: new Date().toISOString(),
          }

          // Save to localStorage for guest users
          localStorage.setItem(`quiz_result_${state.quizId}`, JSON.stringify(quizResult))
          localStorage.setItem(`guest_quiz_${state.quizId}`, JSON.stringify(quizResult))
          localStorage.setItem(`quiz_${state.quizId}_completed`, "true")

          // Mark that we have a guest result
          dispatch(setHasGuestResult(true))

          // For certain quiz types, require authentication to see results
          if ((state.quizType === "mcq" || state.quizType === "blanks") && !authIsAuthenticated) {
            dispatch(setRequiresAuth(true))
          } else {
            dispatch(setResultsReady(true))
          }
        } else if (authIsAuthenticated) {
          // For authenticated users, submit to API
          dispatch(setSavingResults(true))

          const validAnswers = filled.filter((a) => a !== null) as QuizAnswer[]

          const submission: QuizSubmission = {
            quizId: state.quizId,
            slug: state.slug,
            type: state.quizType,
            score,
            answers: validAnswers,
            totalTime: (Date.now() - startTimeRef.current) / 1000,
            totalQuestions: state.questionCount,
          }

          // Submit to API
          quizApi
            .submitQuizResult(submission)
            .then(() => {
              toast({
                title: "Quiz completed!",
                description: "Your results have been saved.",
              })
              dispatch(setSavingResults(false))
              dispatch(setResultsReady(true))
            })
            .catch((error) => {
              console.error("Error submitting quiz result:", error)
              toast({
                title: "Error saving results",
                description: error instanceof Error ? error.message : "An unexpected error occurred",
                variant: "destructive",
              })
              dispatch(setSavingResults(false))
            })
        }

        // Mark quiz as completed in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(`quiz_${state.quizId}_completed`, "true")
        }
      } catch (error) {
        console.error("Error in quiz completion process:", error)
        completionInProgress.current = false

        toast({
          title: "Error completing quiz",
          description: "There was a problem completing your quiz. Please try again.",
          variant: "destructive",
        })
      }

      completionInProgress.current = false
    }, 800)
  }

  // Clear quiz data
  const clearQuizData = async () => {
    if (!state.quizId) return

    // Only clear localStorage for guest users
    if (!authIsAuthenticated && typeof window !== "undefined") {
      localStorage.removeItem(`quiz_state_${state.quizType}_${state.quizId}`)
    }
  }

  // Restart quiz
  const restartQuiz = () => {
    clearQuizData()

    // Clear completion state from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(`quiz_${state.quizId}_completed`)
      cleanupUrlIfNeeded()
    }

    dispatch(resetQuizAction())
  }

  // Get time spent on current question
  const getTimeSpentOnCurrentQuestion = () => {
    return state.timeSpentPerQuestion[state.currentQuestionIndex] || 0
  }

  // Fetch quiz results
  const fetchQuizResults = async (): Promise<boolean> => {
    if (!state.quizId || !state.slug || state.isLoadingResults) return false

    dispatch(setLoadingResults(true))
    dispatch(setError(null))

    try {
      // For authenticated users, try to fetch from API
      if (authIsAuthenticated) {
        try {
          const apiResult = await quizApi.fetchQuizResult(state.quizId, state.slug)

          if (apiResult && apiResult.answers && apiResult.answers.length > 0) {
            // Save the result to localStorage for future use
            if (typeof window !== "undefined") {
              localStorage.setItem(
                `quiz_result_${state.quizId}`,
                JSON.stringify({
                  ...apiResult,
                  completedAt: apiResult.completedAt || new Date().toISOString(),
                }),
              )

              // Clear guest result after successful fetch
              localStorage.removeItem(`guest_quiz_${state.quizId}`)
            }

            dispatch(
              completeQuizAction({
                score: apiResult.score,
                answers: apiResult.answers,
              }),
            )

            dispatch(setResultsReady(true))
            dispatch(setLoadingResults(false))
            return true
          }

          // Check for guest result that can be migrated
          if (typeof window !== "undefined") {
            const guestResultStr = localStorage.getItem(`guest_quiz_${state.quizId}`)
            if (guestResultStr) {
              try {
                const guestResult = JSON.parse(guestResultStr)
                if (guestResult && guestResult.answers && guestResult.answers.length > 0) {
                  // Submit the guest result to the server
                  await quizApi.submitQuizResult({
                    quizId: guestResult.quizId,
                    slug: guestResult.slug,
                    type: guestResult.type,
                    score: guestResult.score,
                    answers: guestResult.answers,
                    totalTime: guestResult.totalTime,
                    totalQuestions: guestResult.totalQuestions,
                  })

                  // Now try fetching again
                  const retryResult = await quizApi.fetchQuizResult(state.quizId, state.slug)
                  if (retryResult && retryResult.answers && retryResult.answers.length > 0) {
                    dispatch(
                      completeQuizAction({
                        score: retryResult.score,
                        answers: retryResult.answers,
                      }),
                    )

                    dispatch(setResultsReady(true))
                    dispatch(setLoadingResults(false))
                    return true
                  }
                }
              } catch (e) {
                console.error("Error processing guest result:", e)
              }
            }
          }

          dispatch(setError("No saved results found."))
        } catch (apiError) {
          console.error("Error fetching results from API:", apiError)
          dispatch(setError("Failed to fetch results from server."))
        }
      } else {
        // For guest users, check localStorage
        if (typeof window !== "undefined") {
          const guestResultStr = localStorage.getItem(`guest_quiz_${state.quizId}`)
          if (guestResultStr) {
            try {
              const guestResult = JSON.parse(guestResultStr)
              if (guestResult && guestResult.answers && guestResult.answers.length > 0) {
                // Mark that we have a guest result
                dispatch(setHasGuestResult(true))

                // For certain quiz types, require authentication to see results
                if (state.quizType === "mcq" || state.quizType === "blanks") {
                  dispatch(setRequiresAuth(true))
                } else {
                  // For other quiz types, show results directly
                  dispatch(
                    completeQuizAction({
                      score: guestResult.score,
                      answers: guestResult.answers,
                    }),
                  )
                  dispatch(setResultsReady(true))
                }

                dispatch(setLoadingResults(false))
                return true
              }
            } catch (e) {
              console.error("Error parsing guest result:", e)
            }
          }
        }
      }

      dispatch(setLoadingResults(false))
      return false
    } catch (error) {
      console.error("Error fetching quiz results:", error)
      dispatch(setError("Failed to fetch quiz results. Please try again."))
      dispatch(setLoadingResults(false))
      return false
    }
  }

  // Handle returning from authentication
  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if we're returning from authentication
    const urlParams = new URLSearchParams(window.location.search)
    const fromAuth = urlParams.get("fromAuth") === "true"

    if (fromAuth && authIsAuthenticated) {
      dispatch(setLoading(true))

      // Process pending data
      const pendingDataStr = localStorage.getItem("pendingQuizData")
      if (pendingDataStr) {
        try {
          const pendingData = JSON.parse(pendingDataStr)

          // If we have a guest result, submit it to the server
          const guestResultStr = localStorage.getItem(`guest_quiz_${state.quizId}`)
          if (guestResultStr) {
            try {
              const guestResult = JSON.parse(guestResultStr)
              if (guestResult && guestResult.answers && guestResult.answers.length > 0) {
                quizApi
                  .submitQuizResult({
                    quizId: guestResult.quizId,
                    slug: guestResult.slug,
                    type: guestResult.type,
                    score: guestResult.score,
                    answers: guestResult.answers,
                    totalTime: guestResult.totalTime,
                    totalQuestions: guestResult.totalQuestions,
                  })
                  .then(() => {
                    // Clear guest result after successful submission
                    localStorage.removeItem(`guest_quiz_${state.quizId}`)

                    // Fetch quiz results
                    fetchQuizResults().then(() => {
                      dispatch(setLoading(false))
                      cleanupUrlIfNeeded()
                    })
                  })
                  .catch((error) => {
                    console.error("Error submitting guest result:", error)
                    dispatch(setLoading(false))
                    cleanupUrlIfNeeded()
                  })
              } else {
                fetchQuizResults().then(() => {
                  dispatch(setLoading(false))
                  cleanupUrlIfNeeded()
                })
              }
            } catch (e) {
              console.error("Error parsing guest result:", e)
              fetchQuizResults().then(() => {
                dispatch(setLoading(false))
                cleanupUrlIfNeeded()
              })
            }
          } else {
            fetchQuizResults().then(() => {
              dispatch(setLoading(false))
              cleanupUrlIfNeeded()
            })
          }
        } catch (e) {
          console.error("Error processing pending data:", e)
          dispatch(setLoading(false))
          cleanupUrlIfNeeded()
        }

        // Clear pending data
        localStorage.removeItem("pendingQuizData")
        localStorage.removeItem("quizAuthRedirect")
        localStorage.removeItem("inAuthFlow")
      } else {
        fetchQuizResults().then(() => {
          dispatch(setLoading(false))
          cleanupUrlIfNeeded()
        })
      }
    }
  }, [authIsAuthenticated, dispatch, state.quizId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up when component unmounts if the quiz is completed
      if (state.isCompleted && state.quizId) {
        clearQuizData()
      }
    }
  }, [state.isCompleted, state.quizId])

  return (
    <QuizContext.Provider
      value={{
        state,
        isAuthenticated: authIsAuthenticated,
        nextQuestion,
        prevQuestion,
        submitAnswer,
        completeQuiz: handleCompleteQuiz,
        restartQuiz,
        getTimeSpentOnCurrentQuestion,
        fetchQuizResults,
        clearQuizData,
        retryLoadingResults,
        onAuthRequired,
        handleAuthenticationRequired,
        clearGuestResults,
        dispatch,
      }}
    >
      {children}
    </QuizContext.Provider>
  )
}

export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext)
  if (!context) throw new Error("useQuiz must be used within a QuizProvider")
  return context
}
