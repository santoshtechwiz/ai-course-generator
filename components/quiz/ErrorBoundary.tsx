"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  onRetry?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
  retryCount: number
}

export class QuizErrorBoundary extends Component<Props, State> {
  private readonly maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Quiz Error Boundary caught an error:", error, errorInfo)
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }))
      
      // Call the onRetry callback if provided
      this.props.onRetry?.()
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = "/dashboard"
  }

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }))
  }

  getErrorType = (error: Error): string => {
    if (error.name === "ChunkLoadError") return "Resource Loading Error"
    if (error.message.includes("network") || error.message.includes("fetch")) return "Network Error"
    if (error.message.includes("timeout")) return "Timeout Error"
    if (error.name === "TypeError") return "Data Processing Error"
    return "Application Error"
  }

  getErrorSuggestion = (error: Error): string => {
    const errorType = this.getErrorType(error)
    
    switch (errorType) {
      case "Resource Loading Error":
        return "This usually happens when the app was updated. Try refreshing the page."
      case "Network Error":
        return "Check your internet connection and try again."
      case "Timeout Error":
        return "The request took too long. Please try again or check your connection."
      case "Data Processing Error":
        return "There was an issue processing the quiz data. Try refreshing or contact support."
      default:
        return "An unexpected error occurred. Try refreshing the page or contact support if the problem persists."
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error } = this.state
      const errorType = error ? this.getErrorType(error) : "Unknown Error"
      const errorSuggestion = error ? this.getErrorSuggestion(error) : "Please try again."
      const canRetry = this.state.retryCount < this.maxRetries

      return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-destructive/20 bg-background shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-foreground">
                  Oops! Something went wrong
                </CardTitle>
                <p className="text-muted-foreground">
                  Don't worry, this happens sometimes. We're here to help you get back on track.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Badge variant="destructive" className="text-sm">
                  {errorType}
                </Badge>
                {this.state.retryCount > 0 && (
                  <Badge variant="outline" className="text-sm">
                    Attempt {this.state.retryCount + 1} of {this.maxRetries + 1}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error suggestion */}
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm text-foreground leading-relaxed">
                  {errorSuggestion}
                </p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="flex items-center gap-2"
                    variant="default"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                )}
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              {/* Technical details (collapsible) */}
              {(this.props.showDetails !== false && process.env.NODE_ENV === "development") && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-sm"
                      onClick={this.toggleDetails}
                    >
                      <span className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        Technical Details
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {this.state.showDetails ? "Hide" : "Show"}
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg border text-sm font-mono">
                      <div className="space-y-2">
                        <div>
                          <span className="font-semibold text-destructive">Error:</span>
                          <p className="mt-1 text-foreground break-all">
                            {error?.message || "Unknown error occurred"}
                          </p>
                        </div>
                        
                        {error?.stack && (
                          <div>
                            <span className="font-semibold text-destructive">Stack Trace:</span>
                            <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                        
                        {this.state.errorInfo?.componentStack && (
                          <div>
                            <span className="font-semibold text-destructive">Component Stack:</span>
                            <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Help text */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  If this problem continues, please contact support with the error details above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error("Quiz error occurred:", error)
    
    // You can add additional error handling logic here
    // such as sending to an error reporting service
  }

  return { handleError }
}

// Higher-order component for wrapping quiz components
export function withQuizErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) {
  const WrappedComponent = (props: P) => (
    <QuizErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </QuizErrorBoundary>
  )

  WrappedComponent.displayName = `withQuizErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}