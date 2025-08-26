"use client"

import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { startLoading, stopLoading, setError } from '@/store/slices/loadingSlice'
import type { AppDispatch, RootState } from '@/store'

export function useLoading(key: string) {
  const dispatch = useDispatch<AppDispatch>()
  const isLoading = useSelector((state: RootState) => 
    !!state.loading.loadingStates[key]
  )
  const error = useSelector((state: RootState) => 
    state.loading.errorStates[key] || null
  )

  const start = useCallback(() => {
    dispatch(startLoading(key))
  }, [dispatch, key])

  const stop = useCallback(() => {
    dispatch(stopLoading(key))
  }, [dispatch, key])

  const setErrorMessage = useCallback((error: string | null) => {
    dispatch(setError({ key, error }))
  }, [dispatch, key])

  // Wrapper for async operations
  const withLoading = useCallback(async <T,>(
    operation: () => Promise<T>
  ): Promise<T> => {
    start()
    try {
      const result = await operation()
      return result
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
      throw error
    } finally {
      stop()
    }
  }, [start, stop, setErrorMessage])

  return {
    isLoading,
    error,
    start,
    stop,
    setError: setErrorMessage,
    withLoading
  }
}
