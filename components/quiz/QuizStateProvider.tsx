"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface QuizState {
  isSubmitting: boolean
  submitState: "idle" | "loading" | "success" | "error"
  nextState: "idle" | "loading" | "success" | "error"
  error: string | null
  success: string | null
}

interface QuizStateManager extends QuizState {
  handleNext: (onNext: () => void | Promise<void> | (() => void) | Promise<() => void>) => Promise<void>
  handleSubmit: (onSubmit: () => void | Promise<void>) => Promise<void>
  setError: (error: string) => void
  setSuccess: (message: string) => void
  clearMessages: () => void
}

const QuizStateContext = createContext<QuizStateManager | null>(null)

interface QuizStateProviderProps {
  children: ReactNode | ((stateManager: QuizStateManager) => ReactNode)
  onError?: (error: string) => void
  onSuccess?: (message: string) => void
  globalLoading?: boolean
}

export const QuizStateProvider = ({ children, onError, onSuccess, globalLoading = false }: QuizStateProviderProps) => {
  const [state, setState] = useState<QuizState>({
    isSubmitting: globalLoading,
    submitState: "idle",
    nextState: "idle",
    error: null,
    success: null,
  })

  const handleNext = useCallback(
    async (onNext: () => void | Promise<void> | (() => void) | Promise<() => void>) => {
      setState((prev) => ({ ...prev, nextState: "loading" }))
      try {
        // Allow onNext to optionally return a cleanup function which we will invoke after success
        const result = await onNext()
        setState((prev) => ({ ...prev, nextState: "success" }))
        try {
          if (typeof result === 'function') {
            // result is a cleanup function
            result()
          }
        } catch (cleanupErr) {
          // ignore cleanup errors
        }
        setTimeout(() => setState((prev) => ({ ...prev, nextState: "idle" })), 1000)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to proceed to next question"
        setState((prev) => ({ ...prev, nextState: "error", error: errorMessage }))
        onError?.(errorMessage)
      }
    },
    [onError],
  )

  const handleSubmit = useCallback(
    async (onSubmit: () => void | Promise<void>) => {
      setState((prev) => ({ ...prev, submitState: "loading", isSubmitting: true }))
      try {
        await onSubmit()
        setState((prev) => ({ ...prev, submitState: "success" }))
        setTimeout(() => setState((prev) => ({ ...prev, submitState: "idle", isSubmitting: false })), 1000)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to submit quiz"
        setState((prev) => ({ ...prev, submitState: "error", error: errorMessage, isSubmitting: false }))
        onError?.(errorMessage)
      }
    },
    [onError],
  )

  const setError = useCallback(
    (error: string) => {
      setState((prev) => ({ ...prev, error }))
      onError?.(error)
    },
    [onError],
  )

  const setSuccess = useCallback(
    (message: string) => {
      setState((prev) => ({ ...prev, success: message }))
      onSuccess?.(message)
    },
    [onSuccess],
  )

  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, error: null, success: null }))
  }, [])

  const stateManager: QuizStateManager = {
    ...state,
    handleNext,
    handleSubmit,
    setError,
    setSuccess,
    clearMessages,
  }

  if (typeof children === "function") {
    return <QuizStateContext.Provider value={stateManager}>{children(stateManager)}</QuizStateContext.Provider>
  }

  return <QuizStateContext.Provider value={stateManager}>{children}</QuizStateContext.Provider>
}

const useQuizState = () => {
  const context = useContext(QuizStateContext)
  if (!context) {
    throw new Error("useQuizState must be used within a QuizStateProvider")
  }
  return context
}

// Safe optional accessor: returns the state manager if present, otherwise null
export const useOptionalQuizState = () => {
  const context = useContext(QuizStateContext)
  return context
}
