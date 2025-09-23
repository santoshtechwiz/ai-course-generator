'use client';

import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export type QuizState = 'idle' | 'submitting' | 'navigating' | 'success' | 'error';

export interface QuizTimeConfig {
  duration: number; 
  warningThreshold?: number;
  criticalThreshold?: number;
  autosaveInterval?: number;
}

export interface QuizStateManager {
  state: QuizState;
  submitState: 'idle' | 'loading' | 'success' | 'error';
  nextState: 'idle' | 'loading' | 'success' | 'error';
  isSubmitting: boolean;
  timeLeft?: number;
  handleSubmit: (submitFn: () => Promise<void> | void) => Promise<void>;
  handleNext: (nextFn: () => Promise<void> | void) => Promise<void>;
  resetState: () => void;
  setError: (error: string) => void;
  setSuccess: (message?: string) => void;
  handleTimeUpdate: (time: number) => void;
  handleTimeExpired: () => void;
  handleAutosave: () => Promise<void>;
}

interface QuizStateProviderProps {
  children: (manager: QuizStateManager) => React.ReactNode;
  onError?: (error: string) => void;
  onSuccess?: (message?: string) => void;
  onTimeExpired?: () => void;
  onAutosave?: () => Promise<void>;
  timeConfig?: QuizTimeConfig;
  globalLoading?: boolean;
}

export function QuizStateProvider({
  children,
  onError,
  onSuccess,
  onTimeExpired,
  onAutosave,
  timeConfig,
  globalLoading = false
}: QuizStateProviderProps) {
  const [state, setState] = useState<QuizState>('idle');
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [nextState, setNextState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [timeLeft, setTimeLeft] = useState<number | undefined>(timeConfig?.duration);

  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetState = useCallback(() => {
    setState('idle');
    setSubmitState('idle');
    setNextState('idle');
    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
  }, []);

  const setError = useCallback((error: string) => {
    setState('error');
    setSubmitState('error');
    
    if (globalLoading) {
      toast.error(error);
    } else {
      toast.error(error);
    }
    
    onError?.(error);
    
    submitTimeoutRef.current = setTimeout(() => {
      setSubmitState('idle');
      setState('idle');
    }, 3000);
  }, [globalLoading, onError]);

  const setSuccess = useCallback((message = 'Success!') => {
    setState('success');
    setSubmitState('success');
    
    if (globalLoading) {
      toast.success(message);
    } else {
      toast.success(message);
    }
    
    onSuccess?.(message);
    
    submitTimeoutRef.current = setTimeout(() => {
      setSubmitState('idle');
      setState('idle');
    }, 2000);
  }, [globalLoading, onSuccess]);

  const handleTimeUpdate = useCallback((time: number) => {
    setTimeLeft(time);
  }, []);

  const handleTimeExpired = useCallback(async () => {
    if (state === 'submitting') return;
    
    setState('submitting');
    setSubmitState('loading');
    
    toast.warning('Time is up! Saving your progress...', {
      duration: 4000
    });
    
    try {
      if (onAutosave) {
        await onAutosave();
      }
      
      onTimeExpired?.();
      
      setSubmitState('success');
      setState('idle');
    } catch (error) {
      console.error('[QuizStateProvider] Failed to save progress on timeout:', error);
      setSubmitState('error');
      setState('error');
      toast.error('Failed to save your progress', {
        duration: 4000,
        action: {
          label: 'Retry',
          onClick: handleTimeExpired
        }
      });
    }
  }, [state, onAutosave, onTimeExpired]);

  const handleAutosave = useCallback(async () => {
    if (!onAutosave || state === 'submitting') return;
    
    try {
      await onAutosave();
      console.log('[QuizStateProvider] Autosave successful');
    } catch (error) {
      console.error('[QuizStateProvider] Autosave failed:', error);
      toast.error('Failed to auto-save progress', {
        duration: 4000,
        action: {
          label: 'Retry',
          onClick: handleAutosave
        }
      });
    }
  }, [onAutosave, state]);

  const handleSubmit = useCallback(async (submitFn: () => Promise<void> | void) => {
    if (state === 'submitting') return;

    setState('submitting');
    setSubmitState('loading');
    
    try {
      const loadingToast = toast.loading('Saving your answer...', {
        duration: Infinity
      });

      const result = submitFn();
      
      if (result && typeof result === 'object' && 'then' in result) {
        await result;
      }
      
      toast.dismiss(loadingToast);
      toast.success('Answer saved successfully!', {
        duration: 2000,
        position: 'top-center'
      });
      
      setSubmitState('success');
      
      submitTimeoutRef.current = setTimeout(() => {
        setSubmitState('idle');
        setState('idle');
      }, 1000);
    } catch (error) {
      console.error('[QuizStateProvider] Quiz submission error:', error);
      
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : 'Failed to save answer';
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
        action: {
          label: 'Retry',
          onClick: () => handleSubmit(submitFn)
        }
      });
      
      setSubmitState('error');
      
      submitTimeoutRef.current = setTimeout(() => {
        setSubmitState('idle');
        setState('idle');
      }, 5000);
    }
  }, [state]);

  const handleNext = useCallback(async (nextFn: () => Promise<void> | void) => {
    if (state === 'navigating') return;

    setState('navigating');
    setNextState('loading');
    
    try {
      const loadingToast = toast.loading('Loading next question...', {
        duration: Infinity
      });

      const result = nextFn();
      
      if (result && typeof result === 'object' && 'then' in result) {
        await result;
      }
      
      toast.dismiss(loadingToast);
      
      setNextState('success');
      
      nextTimeoutRef.current = setTimeout(() => {
        setNextState('idle');
        setState('idle');
      }, 500);
    } catch (error) {
      console.error('[QuizStateProvider] Quiz navigation error:', error);
      
      toast.dismiss();
      toast.error('Failed to load next question', {
        duration: 4000,
        position: 'top-center',
        action: {
          label: 'Retry',
          onClick: () => handleNext(nextFn)
        }
      });
      
      setNextState('error');
      
      nextTimeoutRef.current = setTimeout(() => {
        setNextState('idle');
        setState('idle');
      }, 3000);
    }
  }, [state]);

  const manager: QuizStateManager = {
    state,
    submitState,
    nextState,
    isSubmitting: state === 'submitting',
    timeLeft,
    handleSubmit,
    handleNext,
    resetState,
    setError,
    setSuccess,
    handleTimeUpdate,
    handleTimeExpired,
    handleAutosave
  };

  return <>{children(manager)}</>;
}