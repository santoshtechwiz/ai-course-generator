"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  children: React.ReactNode
  className?: string
}

/**
 * DashboardShell - Responsive wrapper for dashboard pages
 *
 * Provides consistent padding and layout structure for all dashboard content.
 * Handles responsive spacing and ensures proper content flow.
 */
export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={cn(
      "min-h-screen bg-background",
      // Responsive padding that accounts for fixed navbar
      "pt-16 sm:pt-16 md:pt-20 lg:pt-20",
      // Main content container
      "px-4 sm:px-6 lg:px-8",
      className
    )}>
      <div className="mx-auto max-w-screen-2xl">
        {children}
      </div>
    </div>
  )
}