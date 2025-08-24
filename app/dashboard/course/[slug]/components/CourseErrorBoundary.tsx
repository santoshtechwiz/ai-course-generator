"use client"

import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface CourseErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

const CourseErrorFallback: React.FC<CourseErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  const handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-2">
            We encountered an error while loading the course.
          </p>
          <details className="text-left mb-6">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              Error details
            </summary>
            <pre className="text-xs mt-2 p-2 bg-muted rounded text-muted-foreground overflow-auto">
              {error.message}
            </pre>
          </details>
          <div className="space-y-3">
            <Button onClick={resetErrorBoundary} className="w-full" size="lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={handleRefresh} className="w-full">
              Refresh Page
            </Button>
            <Button variant="ghost" onClick={handleGoHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface CourseErrorBoundaryProps {
  children: React.ReactNode
}

export const CourseErrorBoundary: React.FC<CourseErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={CourseErrorFallback}
      onError={(error, errorInfo) => {
        // Log error for debugging
        console.error('Course Error Boundary caught an error:', error, errorInfo)
      }}
      onReset={() => {
        // Optional: Reset any global state
        window.location.reload()
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export default CourseErrorBoundary