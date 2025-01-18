"use client";

import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { usePathname } from "next/navigation";
import { motion, useSpring, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import CourseAILoader from "@/app/dashboard/course/components/CourseAILoader";


interface RouteMessages {
  [key: string]: string;
}

const routeMessages: RouteMessages = {
  '/dashboard': 'Loading Dashboard...',
  '/dashboard/quizzes': 'Preparing Quizzes...',
  '/dashboard/courses': 'Loading Courses...',
};

interface ProgressBarProps {
  value: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  const width = useSpring(value, { stiffness: 300, damping: 30 });

  return (
    <motion.div
      className="h-1 bg-gradient-to-r from-primary via-secondary to-accent fixed top-0 left-0 right-0"
      style={{ width }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  );
};

interface LoadingHookResult {
  isLoading: boolean;
  progress: number;
  startLoading: () => void;
  stopLoading: () => void;
}

const useLoading = (): LoadingHookResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setProgress(0);
  }, []);

  const stopLoading = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 500); // Give some time for the progress bar to reach 100% before hiding it
  }, []);

  useEffect(() => {
    if (isLoading && progress < 90) {
      const timer = setTimeout(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, progress]);

  return { isLoading, progress, startLoading, stopLoading };
};

export function GlobalLoading(): JSX.Element {
  const pathname = usePathname();
  const { isLoading, progress, startLoading, stopLoading } = useLoading();

  const loadingMessage = useMemo(() => {
    const path = pathname || '';
    return routeMessages[path] || 'Loading...';
  }, [pathname]);

  useEffect(() => {
    startLoading(); // Start loading when the component mounts
    const timeout = setTimeout(() => stopLoading(), 1000); // Stop loading after a delay (simulate data loading)

    return () => clearTimeout(timeout);
  }, [pathname, startLoading, stopLoading]);

  return (
    <AnimatePresence>
      {(isLoading || progress > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-[9999]",
            "bg-background/80 dark:bg-background/90",
            "backdrop-blur-sm"
          )}
        >
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <ProgressBar value={progress} />
            <div
              className={cn(
                "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                "flex flex-col items-center gap-4",
                "transition-opacity duration-300",
                isLoading ? "opacity-100" : "opacity-0"
              )}
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <CourseAILoader />
                </motion.div>
                <div className="mt-4 text-center">
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-sm font-medium text-muted-foreground"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {loadingMessage}
                  </motion.p>
                </div>
              </div>
            </div>
          </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
