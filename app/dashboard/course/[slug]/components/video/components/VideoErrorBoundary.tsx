import React, { Component, ErrorInfo, ReactNode } from 'react';
import VideoErrorState from './VideoErrorState';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class VideoErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Video player error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <VideoErrorState 
          onReload={() => window.location.reload()}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}

export default VideoErrorBoundary;
