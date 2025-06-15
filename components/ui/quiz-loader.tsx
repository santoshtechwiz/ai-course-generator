"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Logo from "@/components/layout/navigation/Logo";
import { Sparkles, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizLoaderProps {
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
}

export function QuizLoader({
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
}: QuizLoaderProps) {
  const [progress, setProgress] = useState(displayProgress ?? 0);
  const [time, setTime] = useState(0);

  useEffect(() => {
    // Only run progress animation if displayProgress isn't explicitly provided
    if (displayProgress === undefined) {
      // Simulate loading progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          // Slow down as we get closer to 100%
          const increment = (100 - prev) * 0.08;
          const newProgress = prev + increment;
          return newProgress > 98 ? 98 : newProgress;
        });
      }, 300);

      return () => clearInterval(interval);
    } else {
      // If displayProgress is provided, use that value
      setProgress(displayProgress);
    }
  }, [displayProgress]);

  // Track elapsed time separately
  useEffect(() => {
    // Track elapsed time
    if (showTiming) {
      const timer = setInterval(() => {
        setTime((prev) => prev + 0.1);
      }, 100);

      return () => {
        clearInterval(timer);
      };
    }
  }, [showTiming]);

  const loaderSize = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }[size];

  const layoutClass = full
    ? "fixed inset-0 flex flex-col items-center justify-center bg-background z-50"
    : "w-full flex flex-col items-center justify-center py-6";

  // Minimal skeleton if loading
  if (isLoading) {
    return (
      <div className={cn(layoutClass, className)}>
        <div className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse mb-4" />
          <div className="h-6 w-2/3 rounded bg-muted animate-pulse mb-2" />
          <div className="h-4 w-1/2 rounded bg-muted animate-pulse mb-2" />
          <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(layoutClass, className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Spinner/Icon Animation */}
      {showSpinner && (
        <motion.div
          className={cn(
            "mb-6 flex flex-col items-center justify-center",
            loaderSize
          )}
          initial={{ scale: 0.8, opacity: 0.7 }}
          animate={{
            scale: [0.8, 1.1, 1],
            opacity: [0.7, 1, 0.9, 1],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          <Logo
            size={
              size === "sm"
                ? "small"
                : size === "lg"
                ? "large"
                : "medium"
            }
            variant="minimal"
          />
          <motion.div
            className="absolute"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.7, 1] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: 0.2,
            }}
          >
            <Sparkles className="w-7 h-7 text-primary/70 animate-pulse" />
          </motion.div>
        </motion.div>
      )}

      {/* Message */}
      <motion.h2
        className="text-center text-xl md:text-2xl font-semibold text-foreground mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.h2>

      {/* Sub Message */}
      {subMessage && (
        <motion.p
          className="text-center text-sm text-muted-foreground mb-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {subMessage}
        </motion.p>
      )}

      {/* Progress Bar */}
      {(displayProgress !== undefined || progress > 0) && (
        <motion.div
          className="mt-6 w-full max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{Math.round(progress)}% complete</span>
          </div>
        </motion.div>
      )}

      {/* Steps */}
      {steps && steps.length > 0 && (
        <motion.div
          className="w-full max-w-md px-4 space-y-2 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.label}
              className="flex items-center gap-3"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              {step.status === "completed" ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : step.status === "loading" ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Loader2 className="w-5 h-5 text-blue-500" />
                </motion.div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-muted-foreground/40" />
              )}
              <span
                className={cn(
                  "text-sm",
                  step.status === "completed"
                    ? "text-green-600 dark:text-green-400"
                    : step.status === "loading"
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Subtle Timing Dots */}
      {showTiming && (
        <motion.div
          className="flex mt-4 space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary/40"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
          {time > 0 && (
            <motion.span
              className="ml-2 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {time.toFixed(1)}s
            </motion.span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
