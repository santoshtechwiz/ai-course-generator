"use client"

import { useCallback, useEffect, useRef } from "react"
import { useLoading } from "./context"
import type { LoadingConfig } from "./types"

export function useLoadingState(id: string, config?: Partial<LoadingConfig>) {
  const { startLoading, stopLoading, isLoading, getLoadingState, getLoadingMessage } = useLoading()

  const start = useCallback(
    (message?: string, options?: Partial<LoadingConfig>) => {
      startLoading({
        id,
        message: message || config?.message || "Loading...",
        timeout: options?.timeout || config?.timeout || 10000,
        showProgress: options?.showProgress ?? config?.showProgress ?? false,
        showSpinner: options?.showSpinner ?? config?.showSpinner ?? true,
        overlay: options?.overlay ?? config?.overlay ?? false,
        persistent: options?.persistent ?? config?.persistent ?? false,
        ...options,
      })
    },
    [id, startLoading, config],
  )

  const stop = useCallback(() => {
    stopLoading(id)
  }, [id, stopLoading])

  return {
    isLoading: isLoading(id),
    state: getLoadingState(id),
    message: getLoadingMessage(id),
    start,
    stop,
  }
}

export function useAsyncLoading<T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  loadingId: string,
  options?: {
    message?: string
    onSuccess?: (result: R) => void
    onError?: (error: any) => void
    timeout?: number
  },
) {
  const { start, stop, isLoading, state } = useLoadingState(loadingId)
  const abortControllerRef = useRef<AbortController | null>(null)

  const execute = useCallback(
    async (...args: T): Promise<R | undefined> => {
      try {
        // Cancel any existing request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        abortControllerRef.current = new AbortController()

        start(options?.message, { timeout: options?.timeout })

        const result = await asyncFn(...args)

        stop()
        options?.onSuccess?.(result)
        return result
      } catch (error) {
        stop()
        options?.onError?.(error)
        throw error
      }
    },
    [asyncFn, start, stop, options],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      stop()
    }
  }, [stop])

  return {
    execute,
    isLoading,
    state,
  }
}

export function usePageLoading() {
  const { startLoading, stopLoading, isLoading } = useLoading()

  const startPageLoading = useCallback(
    (message = "Loading page...") => {
      startLoading({
        id: "page-transition",
        message,
        overlay: true,
        persistent: true,
        showSpinner: true,
      })
    },
    [startLoading],
  )

  const stopPageLoading = useCallback(() => {
    stopLoading("page-transition")
  }, [stopLoading])

  return {
    isPageLoading: isLoading("page-transition"),
    startPageLoading,
    stopPageLoading,
  }
}
