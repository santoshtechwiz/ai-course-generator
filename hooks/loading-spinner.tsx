import React from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

// Configurable spinner with variants
const spinnerVariants = cva(
  "animate-spin text-primary inline-block",
  {
    variants: {
      size: {
        small: "h-4 w-4",
        default: "h-6 w-6",
        large: "h-10 w-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
}

export function LoadingSpinner({ size, className }: SpinnerProps) {
  return (
    <Loader2 className={`${spinnerVariants({ size })} ${className || ''}`} />
  );
}

// Skeleton loader for content
export function ContentSkeleton() {
  return (
    <div className="space-y-4 w-full animate-pulse">
      <div className="h-8 bg-gray-200 rounded-md w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded-md w-full"></div>
        <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded-md w-4/6"></div>
      </div>
      <div className="h-40 bg-gray-200 rounded-md w-full"></div>
      <div className="flex justify-end">
        <div className="h-10 bg-gray-200 rounded-md w-1/4"></div>
      </div>
    </div>
  );
}

// Quiz question skeleton
export function QuizQuestionSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      <div className="flex justify-between">
        <div className="h-5 bg-gray-200 rounded w-1/4"></div>
        <div className="h-5 bg-gray-200 rounded w-1/6"></div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full w-full"></div>
      <div className="h-8 bg-gray-200 rounded-md w-3/4"></div>
      <div className="h-5 bg-gray-200 rounded-md w-full"></div>
      <div className="h-40 bg-gray-200 rounded-md w-full"></div>
      <div className="flex justify-end">
        <div className="h-10 bg-gray-200 rounded-md w-1/4"></div>
      </div>
    </div>
  );
}

// Progress indicator with label
interface ProgressProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  size?: "small" | "default" | "large";
  className?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  showPercentage = true,
  size = "default",
  className,
}: ProgressProps) {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div className={`w-full ${className || ''}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm mb-1">
          {label && <span>{label}</span>}
          {showPercentage && <span>{percentage}%</span>}
        </div>
      )}
      <div 
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${
          size === "small" ? "h-1" : 
          size === "large" ? "h-3" : 
          "h-2"
        }`}
      >
        <div
          className="bg-primary h-full rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Loading overlay for async operations
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  message,
  children,
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm transition-all duration-200">
          <LoadingSpinner size="large" />
          {message && (
            <p className="mt-4 text-center text-gray-700 dark:text-gray-300 font-medium">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
