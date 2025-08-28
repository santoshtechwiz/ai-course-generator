"use client"

import { cn } from "@/lib/utils"

interface ModuleLayoutProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "contained"
}

/**
 * Simplified Module Layout Component
 *
 * Provides consistent spacing for module pages.
 * - variant="default": Standard responsive padding
 * - variant="contained": Compact layout with border
 */
export function ModuleLayout({
  children,
  className,
  variant = "default"
}: ModuleLayoutProps) {
  return (
    <div
      className={cn(
        "w-full min-h-screen",
        variant === "default" && "px-4 sm:px-6 lg:px-8 py-6",
        variant === "contained" && "px-4 sm:px-6 lg:px-8 py-6 border rounded-lg shadow-sm max-w-7xl mx-auto",
        variant === "default" && "max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  )
}
