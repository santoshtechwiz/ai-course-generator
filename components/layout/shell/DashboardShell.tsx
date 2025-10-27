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
 * Handles responsive spacing and ensures proper content flow with neo-brutalism styling.
 */
export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    // Shell provides full-width background and top offset for fixed navbar.
    // Horizontal padding and max-width centering should be applied by individual pages/components
    // to avoid nested containers and inconsistent gaps.
    <div className={cn(
      "bg-[var(--color-bg)] dark:bg-[var(--color-bg)]",
      "pt-16 w-full",
      className
    )}>
      {children}
    </div>
  )
}