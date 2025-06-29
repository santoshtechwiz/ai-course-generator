// components/QuizLoader.tsx (or wherever your QuizLoader is located)
"use client"; // This component also needs to be a client component as it uses Loader

import React from 'react';
import { ProgressBar } from './progress-bar';
import { Loader } from './loader';

export class LoaderProps {
  isLoading?: boolean;
  message?: string;
  subMessage?: string;
  fullscreen?: boolean;
  variant?: "clip" | "beat" | "pulse" | "bar" | "scale" | "ring" | "hash" | "grid" | "sync";
  showProgress?: boolean;
  progress?: number;
  speed?: "slow" | "normal" | "fast";
  className?: string;
  context?: "quiz" | "result" | "default"; // Added context for QuizLoader
  showLogo?: boolean; // Optional, if you want to show a logo in the loader
  children?: React.ReactNode; // Optional, if you want to render children inside the loader
}
export type QuizLoaderProps = {
  full?: boolean;
  message?: string;
  subMessage?: string;
  className?: string;
  size?: "sm" | "md" | "lg"; // Note: 'size' is not mapped to LoaderProps in this example
  showTiming?: boolean; // Note: 'showTiming' is not mapped to LoaderProps in this example
  displayProgress?: number; // This will control the progress bar
  showSpinner?: boolean; // This will control the spinner
  steps?: Array<{ // Note: 'steps' is not mapped to LoaderProps in this example
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
    // size = "md", // Not mapped to Loader
    // showTiming = false, // Not mapped to Loader
    displayProgress,
    showSpinner = true,
    // steps, // Not mapped to Loader
    isLoading = false,
  } = props;

  // Convert QuizLoader props to LoaderProps
  const loaderProps: LoaderProps = {
    isLoading,
    message,
    subMessage,
    fullscreen: full,
    variant: showSpinner ? "spinner" : "bar", // Choose 'spinner' or 'bar' based on showSpinner
    showProgress: displayProgress !== undefined, // Show progress if displayProgress is provided
    progress: displayProgress, // Pass the progress value
    className,
    context: "quiz"
  };

  // Return the new Loader component with the mapped props
  return <Loader/>;
}
