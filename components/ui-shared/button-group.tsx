import type React from "react"
import { cn } from "@/lib/utils"

interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right" | "between"
}

export const ButtonGroup = ({ children, className, align = "left" }: ButtonGroupProps) => {
  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  }

  return <div className={cn("flex flex-wrap gap-3 mt-6", alignmentClasses[align], className)}>{children}</div>
}

