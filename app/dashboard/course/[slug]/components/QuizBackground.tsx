"use client"

import type React from "react"
import { useTheme } from "next-themes"

const QuizBackground: React.FC = () => {
  const { theme } = useTheme()

  const isDark = theme === "dark"

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <svg className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2" aria-hidden="true">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "hsl(var(--primary))" : "hsl(var(--secondary))"} stopOpacity="0.05" />
            <stop
              offset="100%"
              stopColor={isDark ? "hsl(var(--secondary))" : "hsl(var(--primary))"}
              stopOpacity="0.05"
            />
          </linearGradient>
          <pattern id="grid-pattern" width={40} height={40} patternUnits="userSpaceOnUse">
            <path
              d="M0 40L40 0M0 0L40 40"
              stroke={isDark ? "hsl(var(--muted))" : "hsl(var(--muted-foreground))"}
              strokeWidth="0.25"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gradient)" />
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="64"
          fontWeight="bold"
          fill={isDark ? "hsl(var(--primary))" : "hsl(var(--primary))"}
          opacity="0.05"
        >
          Course AI
        </text>
      </svg>
    </div>
  )
}

export default QuizBackground
