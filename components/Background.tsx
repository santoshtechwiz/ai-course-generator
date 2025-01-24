"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

const AnimatedBackground: React.FC = () => {
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDarkTheme = theme === "dark"

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="bg-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor={isDarkTheme ? "hsl(222, 47%, 10%)" : "hsl(210, 40%, 98%)"} />
            <stop offset="100%" stopColor={isDarkTheme ? "hsl(222, 47%, 5%)" : "hsl(210, 40%, 96%)"} />
          </radialGradient>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.05" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" mode="overlay" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-gradient)" />
        <rect width="100%" height="100%" filter="url(#noise)" />
        <g>
          {[...Array(20)].map((_, i) => (
            <circle
              key={i}
              cx={Math.random() * 1000}
              cy={Math.random() * 1000}
              r={Math.random() * 30 + 10}
              fill={isDarkTheme ? "hsl(210, 40%, 98%, 0.03)" : "hsl(222, 47%, 11%, 0.03)"}
            >
              <animate
                attributeName="cx"
                from={Math.random() * 1000}
                to={Math.random() * 1000}
                dur={`${Math.random() * 20 + 10}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                from={Math.random() * 1000}
                to={Math.random() * 1000}
                dur={`${Math.random() * 20 + 10}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      </svg>
    </div>
  )
}

export default AnimatedBackground

