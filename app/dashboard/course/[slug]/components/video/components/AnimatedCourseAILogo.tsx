"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface AnimatedCourseAILogoProps {
  animated?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

export const AnimatedCourseAILogo: React.FC<AnimatedCourseAILogoProps> = ({
  animated = false,
  className,
  size = "md"
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  }

  return (
    <div className={cn(
      "flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600",
      sizeClasses[size],
      animated && "animate-pulse",
      className
    )}>
      <div className="text-white font-bold text-lg">
        AI
      </div>
    </div>
  )
}

export default AnimatedCourseAILogo
