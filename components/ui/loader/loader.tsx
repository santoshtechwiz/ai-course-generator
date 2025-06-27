"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ClipLoader,
  BeatLoader,
  PulseLoader,
  BarLoader,
  ScaleLoader,
  RingLoader,
  HashLoader,
  GridLoader,
  SyncLoader
} from "react-spinners";
import { Brain, FileQuestion, Target, BookOpen, CheckCircle2, Sparkles, LoaderCircle, Zap, Clock } from "lucide-react";
import type { LoaderProps } from "./types";

export function LoaderComponent({
  isLoading = false,
  message = "Loading...",
  subMessage,
  fullscreen = false,
  variant = "clip",
  showProgress = false,
  progress: externalProgress,
  speed = "normal",
  className,
  showLogo = false,
  children,
  context = "loading",
}: LoaderProps) {
  const [progress, setProgress] = useState(externalProgress ?? 0);
  const [mounted, setMounted] = useState(false);
  const [currentIcon, setCurrentIcon] = useState(0);

  // Context-aware icons and messages
  const contextConfig = {
    quiz: {
      icons: [Brain, FileQuestion, Target, BookOpen],
      defaultMessage: "Loading quiz...",
      defaultSubMessage: "Preparing your questions",
    },
    result: {
      icons: [CheckCircle2, Target, Sparkles, Brain],
      defaultMessage: "Processing results...",
      defaultSubMessage: "Calculating your score",
    },
    loading: {
      icons: [LoaderCircle, Zap, Brain, Target],
      defaultMessage: "Loading...",
      defaultSubMessage: "Please wait",
    },
    submitting: {
      icons: [Clock, CheckCircle2, Zap, Target],
      defaultMessage: "Submitting answers...",
      defaultSubMessage: "Processing your responses",
    },
    processing: {
      icons: [Brain, Sparkles, Target, CheckCircle2],
      defaultMessage: "Processing...",
      defaultSubMessage: "Analyzing your performance",
    },
  };

  const config = contextConfig[context] || contextConfig.loading;
  const icons = config.icons;
  const contextMessage = message === "Loading..." ? config.defaultMessage : message;
  const contextSubMessage = subMessage || config.defaultSubMessage;

  // Map speed to actual numbers for the spinner
  const speedValues = {
    slow: 0.7,
    normal: 1,
    fast: 1.5,
  };

  const speedMultiplier = speedValues[speed];

  // Update progress if external prop changes
  useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress);
    }
  }, [externalProgress]);

  // Rotate icons for visual interest
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % icons.length);
    }, context === "result" ? 800 : 1200);

    return () => clearInterval(interval);
  }, [isLoading, icons.length, context]);

  // Track mount state for animations
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isLoading) return null;

  const CurrentIcon = icons[currentIcon];

  // Determine which spinner to use based on variant
  const renderSpinner = () => {
    const color = "currentColor";
    const size = fullscreen ? 40 : 30;

    switch (variant) {
      case "beat":
        return <BeatLoader color={color} size={size / 3} speedMultiplier={speedMultiplier} />;
      case "pulse":
        return <PulseLoader color={color} size={size / 3} speedMultiplier={speedMultiplier} />;
      case "bar":
        return <BarLoader color={color} width={100} height={4} speedMultiplier={speedMultiplier} />;
      case "scale":
        return <ScaleLoader color={color} height={size} width={4} speedMultiplier={speedMultiplier} />;
      case "ring":
        return <RingLoader color={color} size={size} speedMultiplier={speedMultiplier} />;
      case "hash":
        return <HashLoader color={color} size={size} speedMultiplier={speedMultiplier} />;
      case "grid":
        return <GridLoader color={color} size={size / 3} speedMultiplier={speedMultiplier} />;
      case "sync":
        return <SyncLoader color={color} size={size / 3} speedMultiplier={speedMultiplier} />;
      case "clip":
      default:
        return <ClipLoader color={color} size={size} speedMultiplier={speedMultiplier} />;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center transition-opacity",
        fullscreen && "fixed inset-0 z-50 bg-background/90 backdrop-blur-sm",
        !mounted ? "opacity-0" : "opacity-100",
        className
      )}
    >
      <div className="flex flex-col items-center gap-6 p-6 rounded-lg max-w-md">
        {showLogo && <div className="w-16 h-16 relative mb-2">{/* Your logo can be added here */}</div>}

        {/* Icon animation */}
        <div className="relative flex items-center justify-center mb-2">
          <CurrentIcon className="h-6 w-6 text-primary animate-bounce" />
        </div>

        {/* Spinner */}
        <div className="text-primary">{renderSpinner()}</div>

        {/* Message */}
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-foreground">{contextMessage}</h3>
          {contextSubMessage && <p className="text-sm text-muted-foreground">{contextSubMessage}</p>}
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="w-full max-w-xs">
            <div className="h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}%</p>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
