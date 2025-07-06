"use client";

import React from "react";
import { ClipLoader } from "react-spinners";

interface LoadingUIProps {
  error?: string;
  message?: string;
}

/**
 * Simple LoadingUI component for course lessons
 * Doesn't interfere with global loader system
 */
const LoadingUI: React.FC<LoadingUIProps> = ({ 
  error, 
  message = "Loading your lesson..." 
}) => {
  return (
    <div className="flex flex-col w-full h-full aspect-video bg-muted animate-pulse">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <ClipLoader color="#3B82F6" size={40} />
          <p className="text-sm text-muted-foreground">
            {error || message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingUI;
