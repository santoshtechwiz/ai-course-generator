import type React from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  noPadding?: boolean
}

export const PageContainer = ({ children, className, maxWidth = "xl", noPadding = false }: PageContainerProps) => {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  }

  return (
    <div className={cn("w-full mx-auto", maxWidthClasses[maxWidth], !noPadding && "px-4 sm:px-6 md:px-8", className)}>
      {children}
    </div>
  )
}

