import type React from "react"
import { cn } from "@/lib/utils"

interface CardContainerProps {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
  fullWidth?: boolean
  centered?: boolean
}

export const CardContainer = ({
  children,
  className,
  noPadding = false,
  fullWidth = false,
  centered = false,
}: CardContainerProps) => {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700",
        !noPadding && "p-6",
        fullWidth ? "w-full" : "max-w-3xl mx-auto",
        centered && "flex flex-col items-center justify-center",
        className,
      )}
    >
      {children}
    </div>
  )
}

