"use client"

import { cn } from "@/lib/utils"
import { Suspense } from "react"

interface ModuleLayoutProps {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
  variant?: "default" | "contained" | "flush" 
  suspense?: boolean
}

/**
 * Unified Module Layout Component
 * 
 * This component provides a consistent layout structure for quiz, course, and landing page modules.
 * - variant="default": Standard padding with max-width
 * - variant="contained": More compact with box shadow and border
 * - variant="flush": No padding, useful for full-bleed content
 * - fullWidth: When true, removes max-width constraints
 * - suspense: When true, wraps children in Suspense boundary
 */
export function ModuleLayout({
  children,
  className,
  fullWidth = false,
  variant = "default",
  suspense = false
}: ModuleLayoutProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col w-full min-h-screen",
        variant === "default" && "px-4 sm:px-6 lg:px-8 py-6",
        variant === "contained" && "px-4 sm:px-6 lg:px-8 py-6 border rounded-lg shadow-sm max-w-7xl mx-auto",
        variant === "flush" && "p-0",
        !fullWidth && variant !== "contained" && "max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  )
  
  return suspense ? (
    <Suspense fallback={<div className="text-sm text-muted-foreground p-6 text-center">Loading...</div>}>
      {content}
    </Suspense>
  ) : content
}
