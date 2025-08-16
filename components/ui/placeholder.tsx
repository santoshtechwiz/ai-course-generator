"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface PlaceholderProps {
  text?: string
  width?: number
  height?: number
  className?: string
  variant?: "default" | "avatar" | "course" | "user"
}

const Placeholder: React.FC<PlaceholderProps> = ({
  text = "CA",
  width = 100,
  height = 100,
  className,
  variant = "default"
}) => {
  const getInitials = (text: string) => {
    if (variant === "user") {
      return text
        .split(" ")
        .map(word => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return text.slice(0, 2).toUpperCase()
  }

  const getBackgroundColor = (text: string) => {
    const colors = [
      "bg-gradient-to-br from-blue-500 to-blue-600",
      "bg-gradient-to-br from-purple-500 to-purple-600",
      "bg-gradient-to-br from-green-500 to-green-600",
      "bg-gradient-to-br from-orange-500 to-orange-600",
      "bg-gradient-to-br from-red-500 to-red-600",
      "bg-gradient-to-br from-indigo-500 to-indigo-600",
      "bg-gradient-to-br from-pink-500 to-pink-600",
      "bg-gradient-to-br from-teal-500 to-teal-600",
    ]
    
    // Generate consistent color based on text
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const getIcon = () => {
    switch (variant) {
      case "course":
        return (
          <svg className="w-1/2 h-1/2 text-white/90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zM12 20c-4.42 0-8-3.58-8-8V9l8-4 8 4v3c0 4.42-3.58 8-8 8z"/>
            <path d="M12 6l-6 3v3c0 3.31 2.69 6 6 6s6-2.69 6-6V9l-6-3z"/>
          </svg>
        )
      case "user":
        return (
          <svg className="w-1/2 h-1/2 text-white/90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        )
      default:
        return (
          <svg className="w-1/2 h-1/2 text-white/90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        )
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg text-white font-semibold text-sm overflow-hidden",
        getBackgroundColor(text),
        className
      )}
      style={{ width, height }}
    >
      {variant === "avatar" ? (
        <span className="text-lg font-bold">{getInitials(text)}</span>
      ) : (
        getIcon()
      )}
    </div>
  )
}

export default Placeholder