"use client"

import { LoadingConfig, LoadingContextValue, LoadingState } from "@/app/types/types"
import type React from "react"
import { createContext, useContext, useReducer, useCallback, useEffect } from "react"


interface LoadingAction {
  type: "START_LOADING" | "STOP_LOADING" | "UPDATE_LOADING" | "CLEAR_ALL" | "SET_STATE"
  payload?: any
}

interface LoadingStateRecord extends LoadingConfig {
  state: LoadingState
  startTime: number
}

interface LoadingReducerState {
  loadingStates: Record<string, LoadingStateRecord>
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined)

function loadingReducer(state: LoadingReducerState, action: LoadingAction): LoadingReducerState {
  switch (action.type) {
    case "START_LOADING": {
      const config = action.payload as LoadingConfig
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [config.id]: {
            ...config,
            state: "loading",
            startTime: Date.now(),
          },
        },
      }
    }

    case "STOP_LOADING": {
      const id = action.payload as string
      const newState = { ...state }
      if (newState.loadingStates[id]) {
        newState.loadingStates[id] = {
          ...newState.loadingStates[id],
          state: "success",
        }

        // Remove non-persistent loading states after a brief delay
        if (!newState.loadingStates[id].persistent) {
          setTimeout(() => {
            delete newState.loadingStates[id]
          }, 100)
        }
      }
      return newState
    }

    case "UPDATE_LOADING": {
      const { id, updates } = action.payload
      if (!state.loadingStates[id]) return state

      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [id]: {
            ...state.loadingStates[id],
            ...updates,
          },
        },
      }
    }

    case "SET_STATE": {
      const { id, newState } = action.payload
      if (!state.loadingStates[id]) return state

      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [id]: {
            ...state.loadingStates[id],
            state: newState,
          },
        },
      }
    }

    case "CLEAR_ALL": {
      return {
        loadingStates: {},
      }
    }

    default:
      return state
  }
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(loadingReducer, {
    loadingStates: {},
  })

  // Auto-timeout handling
  useEffect(() => {
    const timeouts: Record<string, NodeJS.Timeout> = {}

    Object.entries(state.loadingStates).forEach(([id, loadingState]) => {
      if (loadingState.state === "loading" && loadingState.timeout) {
        timeouts[id] = setTimeout(() => {
          dispatch({
            type: "SET_STATE",
            payload: { id, newState: "error" },
          })
        }, loadingState.timeout)
      }
    })

    return () => {
      Object.values(timeouts).forEach(clearTimeout)
    }
  }, [state.loadingStates])

  const startLoading = useCallback((config: LoadingConfig) => {
    dispatch({ type: "START_LOADING", payload: config })
  }, [])

  const stopLoading = useCallback((id: string) => {
    dispatch({ type: "STOP_LOADING", payload: id })
  }, [])

  const updateLoading = useCallback((id: string, updates: Partial<LoadingConfig>) => {
    dispatch({ type: "UPDATE_LOADING", payload: { id, updates } })
  }, [])

  const clearAllLoading = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" })
  }, [])

  const isLoading = useCallback(
    (id?: string) => {
      if (id) {
        return state.loadingStates[id]?.state === "loading"
      }
      return Object.values(state.loadingStates).some((s) => s.state === "loading")
    },
    [state.loadingStates],
  )

  const getLoadingState = useCallback(
    (id: string) => {
      return state.loadingStates[id]?.state
    },
    [state.loadingStates],
  )

  const getLoadingMessage = useCallback(
    (id: string) => {
      return state.loadingStates[id]?.message
    },
    [state.loadingStates],
  )

  const globalLoading = Object.values(state.loadingStates).some((s) => s.state === "loading")

  const value: LoadingContextValue = {
    globalLoading,
    loadingStates: state.loadingStates,
    startLoading,
    stopLoading,
    updateLoading,
    clearAllLoading,
    isLoading,
    getLoadingState,
    getLoadingMessage,
  }

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider")
  }
  return context
}
