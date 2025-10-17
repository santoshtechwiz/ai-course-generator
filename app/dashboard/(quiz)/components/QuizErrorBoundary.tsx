"use client"

import { ReactNode } from "react"
import { EnhancedErrorBoundary } from "@/components/error-boundary"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Home } from "lucide-react"

interface QuizErrorBoundaryProps {
  children: ReactNode
}

/**
 * Quiz Error Boundary Wrapper
 * 
 * COMMIT: Wraps all quiz routes in ErrorBoundary for graceful failure recovery
 * - Catches rendering errors in quiz components
 * - Provides retry functionality
 * - Allows navigation back to dashboard
 */
export function QuizErrorBoundary({ children }: QuizErrorBoundaryProps) {
  return (
    <EnhancedErrorBoundary
      fallback={(error, reset) => (
        <div className="container max-w-2xl mx-auto py-20 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-4">
            Oops! Something went wrong with the quiz
          </h2>
          
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {error.message || "An unexpected error occurred while loading the quiz. Don't worry, your progress is saved."}
          </p>
          
          {/* COMMIT: Show error details in development mode */}
          {process.env.NODE_ENV === "development" && error.stack && (
            <details className="mb-6 text-left bg-muted p-4 rounded-lg max-w-lg mx-auto">
              <summary className="cursor-pointer font-semibold mb-2">
                Error Details (Dev Only)
              </summary>
              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button onClick={reset} size="lg" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              onClick={() => window.location.href = "/dashboard"} 
              size="lg"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-8">
            If the problem persists, please contact support or try refreshing the page.
          </p>
        </div>
      )}
      onError={(error, errorInfo) => {
        // COMMIT: Log errors for debugging and monitoring
        console.error("[QuizErrorBoundary] Caught error:", error)
        console.error("[QuizErrorBoundary] Error info:", errorInfo)
        
        // TODO: Send to error tracking service (Sentry, etc.)
        // trackError(error, { context: 'quiz', errorInfo })
      }}
      maxRetries={3}
    >
      {children}
    </EnhancedErrorBoundary>
  )
}
