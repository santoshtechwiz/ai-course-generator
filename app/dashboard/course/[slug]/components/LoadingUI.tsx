"use client";

import React from "react";
import { GlobalLoader } from "@/components/ui/loader";

interface LoadingUIProps {
  error?: string;
}

const LoadingUI: React.FC<LoadingUIProps> = ({ error }) => {
  return (
    <div className="flex flex-col w-full h-full aspect-video bg-muted animate-pulse">
      <div className="flex-1 flex items-center justify-center">
        <GlobalLoader
          size="lg"
          text={error || "Loading your lesson..."}
          theme="primary"
          progress={50}
        />
      </div>
    </div>
  );
};

export default LoadingUI;
