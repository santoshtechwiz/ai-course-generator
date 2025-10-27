"use client"

import type React from "react"
import { Suspense } from "react"
import { QuizErrorBoundary } from "@/app/dashboard/(quiz)/components/QuizErrorBoundary"
import { GlobalLoader } from "@/components/ui/loader"
import { cn } from "@/lib/utils"

interface QuizShellProps {
  children: React.ReactNode
  className?: string
}

/**
 * QuizShell - Wrapper for quiz pages with error boundaries
 *
 * Provides quiz-specific error handling and loading states.
 * Wraps quiz content with appropriate error boundaries.
 */
export function QuizShell({ children, className }: QuizShellProps) {
  return (
    <QuizErrorBoundary>
      <Suspense fallback={<GlobalLoader message="Loading quiz..." />}>
        <div className={cn("min-h-screen", className)}>
          {children}
        </div>
      </Suspense>
    </QuizErrorBoundary>
  )
}