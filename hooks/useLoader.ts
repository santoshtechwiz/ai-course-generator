import { useCallback } from 'react'
import { useGlobalLoader } from '@/store/loaders/global-loader'
import type { LoaderOptions } from '@/components/loaders/types'

interface UseLoaderOptions {
  defaultMessage?: string
  defaultMinVisibleMs?: number
  defaultAutoDismissMs?: number
}

export function useLoader(options: UseLoaderOptions = {}) {
  const {
    defaultMessage = 'Loading...',
    defaultMinVisibleMs = 500,
    defaultAutoDismissMs = 2000
  } = options

  const {
    startLoading,
    stopLoading,
    setSuccess,
    setError,
    setProgress,
    reset,
    withLoading
  } = useGlobalLoader()

  const show = useCallback((message?: string, isBlocking = false) => {
    startLoading({
      message: message || defaultMessage,
      isBlocking,
      minVisibleMs: defaultMinVisibleMs,
      autoDismissMs: defaultAutoDismissMs
    })
  }, [startLoading, defaultMessage, defaultMinVisibleMs, defaultAutoDismissMs])

  const hide = useCallback(() => {
    stopLoading()
  }, [stopLoading])

  const success = useCallback((message?: string) => {
    setSuccess(message)
  }, [setSuccess])

  const error = useCallback((errorMessage: string) => {
    setError(errorMessage)
  }, [setError])

  const progress = useCallback((value: number) => {
    setProgress(value)
  }, [setProgress])

  const execute = useCallback(async <T>(
    promise: Promise<T>,
    options?: LoaderOptions & {
      onSuccess?: (result: T) => void
      onError?: (error: any) => void
    }
  ): Promise<T> => {
    return withLoading(promise, {
      message: options?.message || defaultMessage,
      minVisibleMs: options?.minVisibleMs || defaultMinVisibleMs,
      autoDismissMs: options?.autoDismissMs || defaultAutoDismissMs,
      ...options
    })
  }, [withLoading, defaultMessage, defaultMinVisibleMs, defaultAutoDismissMs])

  return {
    show,
    hide,
    success,
    error,
    progress,
    execute,
    reset
  }
}