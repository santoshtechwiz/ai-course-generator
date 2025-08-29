// DebugErrorBoundary.tsx
"use client"

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Eye, EyeOff, Copy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
  errorBoundaryStack?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  timestamp: Date
  retryCount: number
  isCollapsed: boolean
  showStackTrace: boolean
}

interface DebugErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  componentName?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showInProduction?: boolean
  maxRetries?: number
}

// Only show in development by default
const isDevelopment = process.env.NODE_ENV === 'development'

class DebugErrorBoundary extends Component<DebugErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: DebugErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      timestamp: new Date(),
      retryCount: 0,
      isCollapsed: false,
      showStackTrace: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId,
      timestamp: new Date()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, componentName } = this.props
    
    // Enhanced error logging
    const enhancedError = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      componentStack: errorInfo.componentStack,
      componentName: componentName || 'Unknown',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    }

    console.group(`🚨 React Error Boundary - ${componentName || 'Component'}`)
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Enhanced Error Details:', enhancedError)
    console.groupEnd()

    // Send to monitoring service in production
    if (!isDevelopment && typeof window !== 'undefined') {
      // Example: Send to monitoring service
      // analytics.track('react_error_boundary', enhancedError)
    }

    this.setState({ errorInfo })
    onError?.(error, errorInfo)
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props
    
    if (this.state.retryCount >= maxRetries) {
      console.warn('Max retries reached, not retrying')
      return
    }

    console.log(`Retrying component (attempt ${this.state.retryCount + 1}/${maxRetries})`)
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isCollapsed: false,
      showStackTrace: false
    }))
  }

  handleRefreshPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  copyErrorToClipboard = async () => {
    const { error, errorInfo, errorId, componentName } = this.state
    
    const errorReport = {
      errorId,
      componentName: this.props.componentName || 'Unknown',
      timestamp: this.state.timestamp.toISOString(),
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      },
      componentStack: errorInfo?.componentStack,
      retryCount: this.state.retryCount,
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR'
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      console.log('Error report copied to clipboard')
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  render() {
    const { children, fallback, showInProduction = false, maxRetries = 3 } = this.props
    
    // Don't show debug UI in production unless explicitly enabled
    if (!isDevelopment && !showInProduction) {
      if (this.state.hasError) {
        return fallback || <div>Something went wrong.</div>
      }
      return children
    }

    if (this.state.hasError && this.state.error) {
      const { error, errorInfo, errorId, timestamp, retryCount, showStackTrace } = this.state
      const canRetry = retryCount < maxRetries

      return (
        <Card className="border-destructive bg-destructive/5 m-4">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <CardTitle className="text-destructive text-lg">
                    Component Error - {this.props.componentName || 'Unknown'}
                  </CardTitle>
                  <CardDescription className="text-destructive/80">
                    Error ID: {errorId} | {timestamp.toLocaleString()}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="destructive" className="ml-2">
                DEV MODE
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Message */}
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="font-semibold text-destructive mb-1">Error Message:</p>
              <code className="text-sm">{error.message}</code>
            </div>

            {/* Error Type */}
            <div className="flex gap-2">
              <Badge variant="outline">{error.name}</Badge>
              {retryCount > 0 && (
                <Badge variant="secondary">Retry #{retryCount}</Badge>
              )}
            </div>

            {/* Component Stack (Collapsible) */}
            <Collapsible open={showStackTrace} onOpenChange={(open) => 
              this.setState({ showStackTrace: open })
            }>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-between"
                >
                  <span>Component Stack Trace</span>
                  {showStackTrace ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <ScrollArea className="h-48 w-full border rounded-md p-3 bg-muted/50">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {errorInfo?.componentStack || 'No component stack available'}
                  </pre>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>

            {/* Full Stack Trace (Collapsible) */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Full Stack Trace</span>
                  <Eye className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <ScrollArea className="h-64 w-full border rounded-md p-3 bg-muted/50">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {error.stack || 'No stack trace available'}
                  </pre>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>

          <CardFooter className="flex gap-2 pt-3">
            {canRetry && (
              <Button 
                onClick={this.handleRetry} 
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry ({maxRetries - retryCount} left)
              </Button>
            )}
            
            <Button 
              onClick={this.copyErrorToClipboard} 
              variant="outline" 
              size="sm"
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Error
            </Button>
            
            <Button 
              onClick={this.handleRefreshPage} 
              variant="destructive" 
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </CardFooter>
        </Card>
      )
    }

    return children
  }
}

// Hook version for functional components
export const useErrorHandler = (componentName?: string) => {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      console.error(`Error in ${componentName || 'Component'}:`, error)
      
      // Only show in development
      if (isDevelopment) {
        const errorDiv = document.createElement('div')
        errorDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          padding: 16px;
          border-radius: 8px;
          z-index: 9999;
          max-width: 400px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        `
        errorDiv.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="color: #dc2626; font-weight: bold;">⚠️ ${componentName || 'Component'} Error</span>
            <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
          </div>
          <div style="color: #991b1b; font-size: 14px; font-family: monospace;">
            ${error.message}
          </div>
        `
        document.body.appendChild(errorDiv)
        
        // Auto remove after 10 seconds
        setTimeout(() => {
          if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv)
          }
        }, 10000)
      }
      
      setError(null)
    }
  }, [error, componentName])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  return { captureError }
}

// Wrapper component for easy debugging
export const DebugWrapper: React.FC<{
  children: ReactNode
  name: string
  showProps?: boolean
  props?: any
}> = ({ children, name, showProps = false, props }) => {
  if (!isDevelopment) {
    return <>{children}</>
  }

  return (
    <DebugErrorBoundary componentName={name}>
      <div data-debug-component={name}>
        {showProps && (
          <details style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginBottom: '8px',
            border: '1px dashed #ccc',
            padding: '4px'
          }}>
            <summary>🐛 {name} Props</summary>
            <pre style={{ fontSize: '10px', margin: '4px 0' }}>
              {JSON.stringify(props, null, 2)}
            </pre>
          </details>
        )}
        {children}
      </div>
    </DebugErrorBoundary>
  )
}

export default DebugErrorBoundary