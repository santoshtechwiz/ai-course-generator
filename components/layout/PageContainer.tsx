/**
 * Standard Page Container
 * Provides consistent padding and max-width for dashboard pages
 */

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface PageContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  noPadding?: boolean
}

const maxWidthClasses = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-full"
}

export function PageContainer({ 
  children, 
  className,
  maxWidth = "2xl",
  noPadding = false
}: PageContainerProps) {
  return (
    <div className={cn(
      "w-full mx-auto",
      !noPadding && "px-4 sm:px-6 lg:px-8 py-6 sm:py-8",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  )
}
