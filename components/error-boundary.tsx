"use client"

import React, { Component, ReactNode, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, RefreshCw, Bug, Home } from 'lucide-react'

/**
 * EnhancedErrorBoundary - A robust error boundary with retry logic
 * 
 * FIXED: Removed ErrorFallback component that used hooks (useState, useCallback)
 * which caused "Rendered fewer hooks than expected" error.
 * 
 * Error boundaries are class components and cannot use hooks in their render output.
 * The fallback UI is now rendered directly in the render() method.
 */

interface EnhancedErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  maxRetries?: number
}

interface EnhancedErrorBoundaryState {
  hasError: boolean
  error: Error | null
  retryCount: number
}

export class EnhancedErrorBoundary extends Component<
  EnhancedErrorBoundaryProps,
  EnhancedErrorBoundaryState
> {
  private retryTimeouts: NodeJS.Timeout[] = []

  constructor(props: EnhancedErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('EnhancedErrorBoundary caught an error:', error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to external service (e.g., Sentry, LogRocket)
    this.logErrorToService(error, errorInfo)
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // This could be replaced with actual error logging service
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // In a real app, send this to your error tracking service
    console.log('Error logged:', errorDetails)
  }

  private resetError = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1
      }))
    } else {
      // Max retries reached, reset count and keep error state
      this.setState({
        retryCount: 0
      })
    }
  }

  render() {
    const { hasError, error, retryCount } = this.state
    const { children, fallback, maxRetries = 3 } = this.props

    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.resetError)
      }

      // Fixed: Removed ErrorFallback component with hooks
      // Render fallback UI directly in class component (no hooks!)
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-[400px] flex items-center justify-center p-4"
        >
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-lg">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {error.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>

              {retryCount > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Retry attempts: {retryCount}
                </p>
              )}

              {retryCount >= maxRetries && (
                <p className="text-sm text-destructive text-center font-medium">
                  Maximum retry attempts reached
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={this.resetError}
                  className="flex-1"
                  variant="outline"
                  disabled={retryCount >= maxRetries}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  variant="default"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )
    }

    return children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null)

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((err: Error) => {
    setError(err)
  }, [])

  return {
    error,
    resetError,
    handleError,
    hasError: error !== null
  }
}

// Higher-order component wrapper
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<EnhancedErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
