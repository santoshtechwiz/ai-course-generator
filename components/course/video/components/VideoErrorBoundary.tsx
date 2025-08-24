"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error boundary specifically designed for video player components
 * Provides user-friendly error messages and recovery options
 */
class VideoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Video player error:', error, errorInfo)
    
    // In a real app, you might want to log this to an error reporting service
    // logErrorToService(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg border border-destructive/20">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Video Player Error</h3>
            
            <p className="text-muted-foreground text-sm mb-6">
              We're having trouble loading the video player. This might be due to a network issue or browser compatibility.
            </p>
            
            <div className="space-y-3">
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
            
            <details className="mt-4 text-left">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {this.state.error?.message || 'Unknown error'}
              </pre>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default VideoErrorBoundary
