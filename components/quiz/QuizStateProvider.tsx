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
    
  // globalLoading pathway removed
    
    try {
      const result = submitFn()
      
      // Handle both sync and async functions
      if (result && typeof result === 'object' && 'then' in result) {
        await result
      }
      
      setSuccess('Quiz submitted successfully!')
      
    } catch (error) {
      console.error('Quiz submission error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit quiz'
      setError(errorMessage)
    } finally {
      // no global stop needed
    }
  }, [state, globalLoading, setError, setSuccess])

  const handleNext = useCallback(async (nextFn: () => Promise<void> | void) => {
    if (state === 'navigating') return

    setState('navigating')
    setNextState('loading')
    
    try {
      const result = nextFn()
      
      // Handle both sync and async functions
      if (result && typeof result === 'object' && 'then' in result) {
        await result
      }
      
      setNextState('success')
      
      // Auto-reset after successful navigation
      nextTimeoutRef.current = setTimeout(() => {
        setNextState('idle')
        setState('idle')
      }, 500)
      
    } catch (error) {
      console.error('Quiz navigation error:', error)
      setNextState('error')
      toast.error('Failed to proceed to next question')
      
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
