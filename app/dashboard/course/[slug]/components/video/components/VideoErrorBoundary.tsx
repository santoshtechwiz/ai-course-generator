"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoErrorBoundaryProps {
  children: ReactNode;
}

interface VideoErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class VideoErrorBoundary extends Component<VideoErrorBoundaryProps, VideoErrorBoundaryState> {
  constructor(props: VideoErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): VideoErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error("Video player error boundary caught error:", error, errorInfo);
    
    // If you have analytics, log the error
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as any).gtag;
      if (typeof gtag === 'function') {
        gtag('event', 'error', {
          'event_category': 'video_player',
          'event_label': error.message,
          'non_interaction': true
        });
      }
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-background/90 rounded-lg border border-muted p-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Video Player Error</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {this.state.error?.message || "Something went wrong with the video player. Please try again."}
          </p>
          <Button 
            onClick={this.handleRetry}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default VideoErrorBoundary;
