"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { reportError } from "@/lib/error-reporting"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo?: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportError(error, { componentStack: errorInfo.componentStack ?? undefined });
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div role="alert" aria-live="assertive" className="w-full max-w-md mx-auto">
          <Card className="border-destructive/50 bg-destructive/6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" id="error-title">
                <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                <span>Something went wrong</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4" aria-describedby="error-title">
                {this.state.error?.message || "An unexpected error occurred. Please try refreshing the page or contact support if the problem persists."}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <details className="mt-4">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    View error details (Development mode)
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          <CardFooter>
            <Button 
              onClick={() => this.setState({ hasError: false, error: null })} 
              className="w-full"
              aria-label="Try to recover from error"
            >
              Try again
            </Button>
          </CardFooter>
        </Card>
        </div>
      )
    }

    return this.props.children
  }
}


