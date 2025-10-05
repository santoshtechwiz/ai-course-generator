"use client"

import React from "react"
import { motion } from "framer-motion"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  componentName?: string
  showDetails?: boolean
}

export function ErrorFallback({
  error,
  resetError,
  componentName,
  showDetails = process.env.NODE_ENV === 'development'
}: ErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto my-8"
    >
      <Card className="border-destructive/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg">Something went wrong</CardTitle>
              {componentName && (
                <CardDescription className="text-sm">
                  Error in {componentName}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-semibold">Error Details</AlertTitle>
            <AlertDescription className="mt-2">
              {error.message || "An unexpected error occurred"}
            </AlertDescription>
          </Alert>

          {showDetails && error.stack && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-auto max-h-32">
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={resetError}
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
  componentName?: string
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class EnhancedErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Filter out AbortErrors - these are expected and shouldn't be logged as errors
    const isAbortError = error?.name === 'AbortError' ||
                        error?.message?.includes('signal is aborted') ||
                        error?.message?.includes('aborted without reason')

    if (isAbortError) {
      // Just log AbortErrors as info, not errors
      console.info("ℹ️ Request cancelled (AbortError) in component:", {
        componentName: this.props.componentName,
        message: error.message,
        timestamp: new Date().toISOString()
      })
      return
    }

    // Enhanced error logging for actual errors
    console.error("🚨 Error Boundary caught an error:", {
      error: error.message,
      stack: error.stack,
      componentName: this.props.componentName,
      timestamp: new Date().toISOString(),
      errorInfo
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          componentName={this.props.componentName}
        />
      )
    }

    return this.props.children
  }
}

// Hook for using error boundary in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    // Filter out AbortErrors - these are expected and shouldn't be logged as errors
    const isAbortError = error?.name === 'AbortError' ||
                        error?.message?.includes('signal is aborted') ||
                        error?.message?.includes('aborted without reason')

    if (isAbortError) {
      // Just log AbortErrors as info, not errors
      console.info("ℹ️ Request cancelled (AbortError):", {
        message: error.message,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString()
      })
      return
    }

    console.error("🚨 Error Handler:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString()
    })

    // You could send this to an error reporting service
    // reportError(error, errorInfo)
  }
}
