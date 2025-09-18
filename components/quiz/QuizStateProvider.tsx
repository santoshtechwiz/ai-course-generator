"use client"

import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export type QuizState = 'idle' | 'submitting' | 'navigating' | 'success' | 'error'

interface QuizStateManager {
  state: QuizState
  submitState: 'idle' | 'loading' | 'success' | 'error'
  nextState: 'idle' | 'loading' | 'success' | 'error' 
  isSubmitting: boolean
  
  // Actions
  handleSubmit: (submitFn: () => Promise<void> | void) => Promise<void>
  handleNext: (nextFn: () => Promise<void> | void) => Promise<void>
  resetState: () => void
  setError: (error: string) => void
  setSuccess: (message?: string) => void
}

interface QuizStateProviderProps {
  children: (manager: QuizStateManager) => React.ReactNode
  onError?: (error: string) => void
  onSuccess?: (message?: string) => void
  globalLoading?: boolean // Whether to show global loader during operations
}

export function QuizStateProvider({ 
  children, 
  onError, 
  onSuccess,
  globalLoading = false 
}: QuizStateProviderProps) {
  const [state, setState] = useState<QuizState>('idle')
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [nextState, setNextState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  // Removed legacy global loader helpers
  const setGlobalError = (msg: string) => toast.error(msg)
  const setGlobalSuccess = (msg: string) => toast.success(msg)
  
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const nextTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetState = useCallback(() => {
    setState('idle')
    setSubmitState('idle')
    setNextState('idle')
    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current)
    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current)
  }, [])

  const setError = useCallback((error: string) => {
    setState('error')
    setSubmitState('error')
    
    if (globalLoading) {
      setGlobalError(error)
    } else {
      toast.error(error)
    }
    
    onError?.(error)
    
    // Auto-reset error state after 3 seconds
    submitTimeoutRef.current = setTimeout(() => {
      setSubmitState('idle')
      setState('idle')
    }, 3000)
  }, [globalLoading, setGlobalError, onError])

  const setSuccess = useCallback((message = 'Success!') => {
    setState('success')
    setSubmitState('success')
    
    if (globalLoading) {
      setGlobalSuccess(message)
    } else {
      toast.success(message)
    }
    
    onSuccess?.(message)
    
    // Auto-reset success state after 2 seconds
    submitTimeoutRef.current = setTimeout(() => {
      setSubmitState('idle')
      setState('idle')
    }, 2000)
  }, [globalLoading, setGlobalSuccess, onSuccess])

  const handleSubmit = useCallback(async (submitFn: () => Promise<void> | void) => {
    if (state === 'submitting') return

    setState('submitting')
    setSubmitState('loading')
    
    try {
      // Show loading toast for better user feedback
      const loadingToast = toast.loading('Saving your answer...', {
        duration: Infinity,
      })

      const result = submitFn()
      
      // Handle both sync and async functions
      if (result && typeof result === 'object' && 'then' in result) {
        await result
      }
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast)
      toast.success('Answer saved successfully!', {
        duration: 2000,
        position: 'top-center',
      })
      
      setSubmitState('success')
      
      // Auto-reset after successful submission
      submitTimeoutRef.current = setTimeout(() => {
        setSubmitState('idle')
        setState('idle')
      }, 1000)
      
    } catch (error) {
      console.error('Quiz submission error:', error)
      
      // Dismiss loading toast and show error
      toast.dismiss()
      const errorMessage = error instanceof Error ? error.message : 'Failed to save answer'
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
        action: {
          label: 'Retry',
          onClick: () => handleSubmit(submitFn),
        },
      })
      
      setSubmitState('error')
      
      // Auto-reset error state after longer delay
      submitTimeoutRef.current = setTimeout(() => {
        setSubmitState('idle')
        setState('idle')
      }, 5000)
    }
  }, [state])

  const handleNext = useCallback(async (nextFn: () => Promise<void> | void) => {
    if (state === 'navigating') return

    setState('navigating')
    setNextState('loading')
    
    try {
      // Show loading toast for navigation
      const loadingToast = toast.loading('Loading next question...', {
        duration: Infinity,
      })

      const result = nextFn()
      
      // Handle both sync and async functions
      if (result && typeof result === 'object' && 'then' in result) {
        await result
      }
      
      // Dismiss loading toast
      toast.dismiss(loadingToast)
      
      setNextState('success')
      
      // Auto-reset after successful navigation
      nextTimeoutRef.current = setTimeout(() => {
        setNextState('idle')
        setState('idle')
      }, 500)
      
    } catch (error) {
      console.error('Quiz navigation error:', error)
      
      // Dismiss loading toast and show error
      toast.dismiss()
      toast.error('Failed to load next question', {
        duration: 4000,
        position: 'top-center',
        action: {
          label: 'Retry',
          onClick: () => handleNext(nextFn),
        },
      })
      
      setNextState('error')
      
      // Auto-reset error state
      nextTimeoutRef.current = setTimeout(() => {
        setNextState('idle')
        setState('idle')
      }, 2000)
    }
  }, [state])

  const manager: QuizStateManager = {
    state,
    submitState,
    nextState,
    isSubmitting: state === 'submitting',
    handleSubmit,
    handleNext,
    resetState,
    setError,
    setSuccess,
  }

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current)
      if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current)
    }
  }, [])

  return <>{children(manager)}</>
}

// Hook for easier usage
export function useQuizState() {
  const [state, setState] = useState<QuizState>('idle')
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [nextState, setNextState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  
  const resetState = useCallback(() => {
    setState('idle')
    setSubmitState('idle')
    setNextState('idle')
  }, [])

  const setError = useCallback((error: string) => {
    setState('error')
    setSubmitState('error')
    toast.error(error)
    
    setTimeout(() => {
      setSubmitState('idle')
      setState('idle')
    }, 3000)
  }, [])

  const setSuccess = useCallback((message = 'Success!') => {
    setState('success')
    setSubmitState('success')
    toast.success(message)
    
    setTimeout(() => {
      setSubmitState('idle')
      setState('idle')
    }, 2000)
  }, [])

  return {
    state,
    submitState,
    nextState,
    isSubmitting: state === 'submitting',
    resetState,
    setError,
    setSuccess,
    setState,
    setSubmitState,
    setNextState,
  }
}
