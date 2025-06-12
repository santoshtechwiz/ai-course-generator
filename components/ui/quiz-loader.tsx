"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2, Check } from "lucide-react";
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
}: QuizLoaderProps) {
  const loaderSize = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }[size];

  const layoutClass = full
    ? "fixed inset-0 flex flex-col items-center justify-center bg-background z-50"
    : "w-full flex flex-col items-center justify-center py-6";

  return (
    <motion.div
      className={cn(layoutClass, className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Spinner */}
      {showSpinner && (
        <motion.div
          className={cn("mb-6 text-primary", loaderSize)}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className={cn("w-full h-full")} />
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
      {displayProgress !== undefined && (
        <motion.div
          className="w-full max-w-md px-4 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{displayProgress}%</span>
            {steps && (
              <span>
                {steps.filter((s) => s.status === "completed").length} of{" "}
                {steps.length}
              </span>
            )}
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
          className="flex gap-1 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
