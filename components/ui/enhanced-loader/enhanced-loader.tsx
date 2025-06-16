"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export interface EnhancedLoaderProps {
  /** Whether the loader is currently active */
  isLoading: boolean;
  /** Main message to display during loading */
  message?: string;
  /** Secondary message below the main message */
  subMessage?: string;
  /** Whether to show the loader in fullscreen mode */
  fullscreen?: boolean;
  /** Animation variant style */
  variant?: "shimmer" | "pulse" | "progress" | "dots" | "glow";
  /** Show progress percentage */
  showProgress?: boolean;
  /** Custom progress value (0-100) */
  progress?: number;
  /** Animation speed (ms) */
  speed?: "slow" | "normal" | "fast";
  /** Theme override */
  theme?: "light" | "dark" | "system";
  /** Optional CSS class for customization */
  className?: string;
  /** Optional logo at the top of the loader */
  showLogo?: boolean;
  /** Optional custom content to show in the loader */
  children?: React.ReactNode;
}

export function EnhancedLoader({
  isLoading = false,
  message = "Loading...",
  subMessage,
  fullscreen = false,
  variant = "shimmer",
  showProgress = false,
  progress: externalProgress,
  speed = "normal",
  className,
  showLogo = false,
  children,
}: EnhancedLoaderProps) {
  const [progress, setProgress] = useState(externalProgress ?? 0);
  const [mounted, setMounted] = useState(false);

  // Initialize and track progress if needed
  useEffect(() => {
    setMounted(true);

    if (isLoading && showProgress && externalProgress === undefined) {
      // Simulate progress if not externally controlled
      const interval = setInterval(() => {
        setProgress((prev) => {
          // Slow down as we approach 100% for a more natural feel
          const remaining = 100 - prev;
          const increment = Math.max(0.1, remaining * 0.03);
          const newProgress = prev + increment;
          return newProgress >= 98 ? 98 : newProgress;
        });
      }, speed === "fast" ? 100 : speed === "slow" ? 300 : 200);

      return () => clearInterval(interval);
    } else if (externalProgress !== undefined) {
      // Use external progress if provided
      setProgress(externalProgress);
    }

    return () => {};
  }, [isLoading, showProgress, externalProgress, speed]);

  // Update progress when external progress changes
  useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress);
    }
  }, [externalProgress]);

  // Reset progress when loading stops
  useEffect(() => {
    if (!isLoading) {
      // Small delay before resetting progress when loading stops
      const timeout = setTimeout(() => {
        setProgress(0);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  // Don't render anything server-side to avoid hydration issues
  if (!mounted) return null;

  // If not loading and not fullscreen, render nothing
  if (!isLoading && !fullscreen) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4, 
        delay: 0.1,
        ease: "easeOut"
      } 
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      transition: { duration: 0.2 } 
    },
  };

  const renderVariant = () => {
    switch (variant) {
      case "shimmer":
        return (
          <div className="relative overflow-hidden rounded-lg bg-primary/10 w-24 h-1.5 my-4">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-shimmer" />
          </div>
        );
      
      case "pulse":
        return (
          <div className="flex gap-2 my-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full bg-primary animate-pulse",
                  i === 1 ? "opacity-30" : i === 2 ? "opacity-60" : "opacity-90",
                  i === 1 ? "animate-delay-0" : i === 2 ? "animate-delay-150" : "animate-delay-300"
                )}
              />
            ))}
          </div>
        );
        
      case "progress":
        return (
          <div className="w-48 h-1.5 bg-primary/20 rounded-full overflow-hidden my-4">
            <motion.div 
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        );
        
      case "dots":
        return (
          <div className="flex space-x-2 my-4">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-primary rounded-full"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 1.5,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        );
        
      case "glow":
        return (
          <motion.div 
            className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center my-4"
            animate={{ 
              boxShadow: ["0 0 0 0 rgba(var(--primary), 0.2)", "0 0 0 10px rgba(var(--primary), 0)"] 
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-6 h-6 text-primary" />
          </motion.div>
        );
        
      default:
        return (
          <div className="w-32 h-1.5 bg-primary/20 rounded-full overflow-hidden my-4">
            <div className="h-full w-1/3 bg-primary rounded-full animate-pulse" />
          </div>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "flex items-center justify-center",
            fullscreen ? 
              "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" : 
              "w-full py-8",
            className
          )}
        >
          <motion.div
            variants={contentVariants}
            className={cn(
              "flex flex-col items-center justify-center p-6 rounded-xl",
              fullscreen ? "bg-background/40 shadow-lg backdrop-blur-sm" : ""
            )}
          >
            {showLogo && (
              <div className="mb-4 opacity-90">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
            )}
            
            {renderVariant()}
            
            {message && (
              <motion.h3 
                className="text-base font-medium text-foreground mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {message}
              </motion.h3>
            )}
            
            {subMessage && (
              <motion.p 
                className="text-sm text-muted-foreground mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {subMessage}
              </motion.p>
            )}
            
            {showProgress && (
              <motion.p 
                className="text-xs text-muted-foreground/70 mt-2 tabular-nums"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {Math.round(progress)}%
              </motion.p>
            )}
            
            {children && (
              <motion.div 
                className="mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {children}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
