"use client"

/**
 * Enhanced Error Boundary with Retry for Dashboard Components
 * Prevents blank pages and provides consistent error handling
 */

import * as React from "react"
import { ErrorBoundary } from "react-error-boundary"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface DashboardErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
  errorInfo?: string
  componentName?: string
}

function DashboardErrorFallback({
  error,
  resetErrorBoundary,
  errorInfo,
  componentName
}: DashboardErrorFallbackProps) {
  const [retryCount, setRetryCount] = React.useState(0)
  const maxRetries = 3

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount((prev: number) => prev + 1)
      resetErrorBoundary()
    }
  }

  const handleReload = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className="max-w-md w-full bg-card rounded-lg border shadow-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="ml-3">
            <h2 className="text-lg font-semibold text-foreground">
              Something went wrong
            </h2>
            {componentName && (
              <p className="text-sm text-muted-foreground">
                Error in {componentName}
              </p>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-4">
          {error.message || 'An unexpected error occurred'}
        </div>

        {process.env.NODE_ENV === 'development' && errorInfo && (
          <details className="mb-4">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-32 bg-muted p-2 rounded text-left">
              {errorInfo}
            </pre>
          </details>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Button
              onClick={handleRetry}
              disabled={retryCount >= maxRetries}
              variant="default"
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleReload}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
            <Button
              onClick={handleGoHome}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </div>

        {retryCount >= maxRetries && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Maximum retry attempts reached. Please reload the page or contact support if the issue persists.
          </p>
        )}
      </div>
    </div>
  )
}

interface DashboardErrorBoundaryProps {
  children: React.ReactNode
  componentName?: string
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
  onError?: (error: Error, errorInfo: { componentStack: string }) => void
}

/**
 * Enhanced Error Boundary for Dashboard Components
 * Provides retry functionality and consistent error UI
 */
export function DashboardErrorBoundary({
  children,
  componentName,
  fallback: FallbackComponent,
  onError
}: DashboardErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: { componentStack: string }) => {
    // Log error for monitoring
    console.error(`Dashboard Error Boundary caught an error${componentName ? ` in ${componentName}` : ''}:`, error)

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToService(error, errorInfo, componentName)
    }
  }

  const CustomFallback = FallbackComponent || (({ error, resetErrorBoundary }) =>
    <DashboardErrorFallback
      error={error}
      resetErrorBoundary={resetErrorBoundary}
      componentName={componentName}
    />
  )

  return (
    <ErrorBoundary
      FallbackComponent={CustomFallback}
      onError={handleError}
      onReset={() => {
        // Clear any cached error state
        console.log(`Resetting error boundary${componentName ? ` for ${componentName}` : ''}`)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Specialized error boundary for course components
export function CourseErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <DashboardErrorBoundary componentName="Course Component">
      {children}
    </DashboardErrorBoundary>
  )
}

// Specialized error boundary for quiz components
export function QuizErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <DashboardErrorBoundary componentName="Quiz Component">
      {children}
    </DashboardErrorBoundary>
  )
}