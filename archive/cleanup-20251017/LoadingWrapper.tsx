"use client"

/**
 * LoadingWrapper component that integrates TanStack Query with the existing Loader
 * Provides consistent loading states across the application
 */

import React from "react"
import { Loader } from "@/components/loaders/loader"

interface LoadingWrapperProps {
  children: React.ReactNode
  isLoading: boolean
  error?: Error | null
  loadingMessage?: string
  showError?: boolean
  fallback?: React.ReactNode
}

/**
 * Wrapper component that handles loading and error states consistently
 * Integrates with the existing Loader component and TanStack Query
 */
export function LoadingWrapper({
  children,
  isLoading,
  error,
  loadingMessage = "Loading...",
  showError = true,
  fallback
}: LoadingWrapperProps) {
  // Show loading state
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center min-h-[200px] p-4">
        <Loader isLoading={true} />
        <div className="ml-4 text-sm text-muted-foreground">
          {loadingMessage}
        </div>
      </div>
    )
  }

  // Show error state
  if (error && showError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
        <div className="bg-destructive/10 rounded-full p-3 mb-4">
          <svg
            className="w-6 h-6 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
        <p className="text-muted-foreground max-w-md mb-4">
          {error.message || 'An error occurred while loading data'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Show children when not loading and no error
  return <>{children}</>
}

/**
 * Hook to create loading wrapper props from TanStack Query result
 */
export function useLoadingWrapperProps<TData, TError>(
  queryResult: {
    isLoading: boolean
    isError: boolean
    error: TError | null
    data?: TData
  },
  options: {
    loadingMessage?: string
    showError?: boolean
    fallback?: React.ReactNode
  } = {}
) {
  const { loadingMessage, showError = true, fallback } = options

  return {
    isLoading: queryResult.isLoading,
    error: queryResult.isError ? (queryResult.error as Error) : null,
    loadingMessage,
    showError,
    fallback
  }
}