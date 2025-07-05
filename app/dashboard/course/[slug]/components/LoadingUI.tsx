"use client";

import React, { useEffect } from "react";
import { useGlobalLoading } from "@/store/slices/global-loading-slice";

interface LoadingUIProps {
  error?: string;
}

const LoadingUI: React.FC<LoadingUIProps> = ({ error }) => {
  const { showLoading, hideLoading } = useGlobalLoading()

  useEffect(() => {
    const loaderId = showLoading({
      message: error || "Loading your lesson...",
      variant: 'spinner',
      theme: 'primary',
      isBlocking: false,
      priority: 1,
      progress: 50
    })

    return () => {
      hideLoading(loaderId)
    }
  }, [error, showLoading, hideLoading])

  return (
    <div className="flex flex-col w-full h-full aspect-video bg-muted animate-pulse">
      <div className="flex-1 flex items-center justify-center">
        {/* Loading handled by GlobalLoader */}
      </div>
    </div>
  );
};

export default LoadingUI;
