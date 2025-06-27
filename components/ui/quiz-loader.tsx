// Using the new loader implementation for backwards compatibility
"use client";

import React from 'react';
import { LoaderComponent as Loader } from '@/components/ui/loader/loader';
import type { LoaderProps } from '@/components/ui/loader/types';

export type QuizLoaderProps = {
  full?: boolean;
  message?: string;
  subMessage?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showTiming?: boolean;
  displayProgress?: number;
  showSpinner?: boolean;
  steps?: Array<{
    label: string;
    status: "loading" | "completed" | "pending";
  }>;
  isLoading?: boolean;
};

export function QuizLoader(props: QuizLoaderProps) {
  const {
    full = false,
    message = "Loading...",
    subMessage,
    className,
    size = "md",
    showTiming = false,
    displayProgress,
    showSpinner = true,
    steps,
    isLoading = false,
  } = props;

  // Convert QuizLoader props to LoaderProps
  const loaderProps: LoaderProps = {
    isLoading,
    message,
    subMessage,
    fullscreen: full,
    variant: showSpinner ? "clip" : "bar",
    showProgress: displayProgress !== undefined,
    progress: displayProgress,
    className,
    context: "quiz"  };  // Return the new Loader component with the mapped props
  return <Loader {...loaderProps} />;
}
