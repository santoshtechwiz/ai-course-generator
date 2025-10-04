/**
 * Global error boundary for Redux-related errors
 * Prevents blank screens and provides fallback UI
 */

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
  errorInfo?: string
}

function ErrorFallback({ error, resetErrorBoundary, errorInfo }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mb-4">
          {error.message || 'An unexpected error occurred'}
        </div>
        
        {process.env.NODE_ENV === 'development' && errorInfo && (
          <details className="mb-4">
            <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
            <pre className="mt-2 text-xs text-gray-400 overflow-auto max-h-32 bg-gray-100 p-2 rounded">
              {errorInfo}
            </pre>
          </details>
        )}
        
        <div className="flex space-x-3">
          <button
            onClick={resetErrorBoundary}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  )
}

interface ReduxErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: { componentStack: string | null | undefined }) => void
}

export function ReduxErrorBoundary({ 
  children, 
  fallback: Fallback = ErrorFallback,
  onError 
}: ReduxErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={Fallback}
      onError={(error, errorInfo) => {
        // Enhanced error logging
        console.group('🚨 Error Boundary Caught Error');
        console.error('Error:', error);
        console.error('Error name:', error?.name);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        console.error('Component stack:', errorInfo?.componentStack);
        console.groupEnd();
        
        // Call custom error handler
        onError?.(error, { componentStack: errorInfo.componentStack || '' })
      }}
      onReset={() => {
        // Clear any request cache on reset
        if (typeof window !== 'undefined') {
          // Force a small delay to ensure any pending requests are cancelled
          setTimeout(() => {
            window.location.reload()
          }, 100)
        }
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Specialized error boundary for quiz/flashcard components
interface QuizErrorFallbackProps extends ErrorFallbackProps {
  quizType?: string
  slug?: string
}

function QuizErrorFallback({ error, resetErrorBoundary, quizType, slug }: QuizErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[200px] sm:min-h-[240px] md:min-h-[280px] bg-gray-50 rounded-lg p-4">
      <div className="text-center p-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
          </svg>
        </div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
          Failed to load {quizType || 'content'}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {error.message || 'Unable to load the quiz content. Please try again.'}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Retry Loading
        </button>
      </div>
    </div>
  )
}

export function QuizErrorBoundary({ 
  children, 
  quizType, 
  slug,
  onError 
}: {
  children: ReactNode
  quizType?: string
  slug?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}) {
  return (
    <ErrorBoundary
      FallbackComponent={(props) => (
        <QuizErrorFallback {...props} quizType={quizType} slug={slug} />
      )}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}