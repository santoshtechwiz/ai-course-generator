"use client"

import type React from "react"

import { motion } from "framer-motion"

const quizTypeColors = {
  blanks: {
    pattern: "text-blue-400",
  },
  flashcard: {
    pattern: "text-orange-400",
  },
  openended: {
    pattern: "text-purple-400",
  },
  code: {
    pattern: "text-green-400",
  },
  mcq: {
    pattern: "text-indigo-400",
  },
}

// Enhanced floating particles animation
const FloatingParticles: React.FC<{ quizType: string }> = ({ quizType }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-current opacity-20"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [-10, 10, -10],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  )
}

export const QuizBackgroundPattern: React.FC<{ quizType: string }> = ({ quizType }) => {
  const colorScheme = quizTypeColors[quizType as keyof typeof quizTypeColors] || quizTypeColors.mcq

  const patterns: Record<string, React.ReactNode> = {
    blanks: (
      <g>
        <defs>
          <linearGradient id="fillBlanksGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <rect x="10" y="15" width="30" height="3" rx="1.5" fill="url(#fillBlanksGrad)" />
        <rect x="45" y="15" width="20" height="3" rx="1.5" fill="currentColor" fillOpacity="0.2" />
        <rect x="70" y="15" width="25" height="3" rx="1.5" fill="url(#fillBlanksGrad)" />
      </g>
    ),
    flashcard: (
      <g>
        <rect x="15" y="15" width="25" height="18" rx="3" fill="currentColor" fillOpacity="0.12" />
        <rect x="45" y="20" width="25" height="18" rx="3" fill="currentColor" fillOpacity="0.12" />
        <rect x="75" y="25" width="25" height="18" rx="3" fill="currentColor" fillOpacity="0.12" />
      </g>
    ),
    openended: (
      <g>
        <path d="M15,20 Q30,15 45,20 T75,20" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" fill="none" />
        <path d="M15,30 Q35,25 55,30 T85,30" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" fill="none" />
        <path d="M15,40 Q25,35 35,40 T65,40" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" fill="none" />
      </g>
    ),
    code: (
      <g>
        <rect x="15" y="18" width="8" height="3" rx="1" fill="currentColor" fillOpacity="0.15" />
        <rect x="26" y="18" width="20" height="3" rx="1" fill="currentColor" fillOpacity="0.12" />
        <rect x="49" y="18" width="12" height="3" rx="1" fill="currentColor" fillOpacity="0.15" />
        <path d="M70,20 L75,25 L70,30" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5" fill="none" />
      </g>
    ),
    mcq: (
      <g>
        <circle cx="20" cy="20" r="3" fill="currentColor" fillOpacity="0.12" />
        <rect x="28" y="17" width="25" height="2" rx="1" fill="currentColor" fillOpacity="0.12" />
        <circle cx="20" cy="35" r="3" fill="currentColor" fillOpacity="0.12" />
        <rect x="28" y="32" width="30" height="2" rx="1" fill="currentColor" fillOpacity="0.12" />
      </g>
    ),
  }

  const defaultPattern = (
    <g>
      <circle cx="20" cy="20" r="4" fill="currentColor" fillOpacity="0.1" />
      <circle cx="50" cy="25" r="3" fill="currentColor" fillOpacity="0.15" />
      <circle cx="80" cy="30" r="5" fill="currentColor" fillOpacity="0.08" />
    </g>
  )

  const patternElement = patterns[quizType as keyof typeof patterns] || defaultPattern

  return (
    <div className="absolute inset-0 overflow-hidden">
      <FloatingParticles quizType={quizType} />
      <svg
        className={`absolute right-2 bottom-2 w-24 h-20 opacity-30 group-hover:opacity-50 transition-all duration-700 ${colorScheme.pattern}`}
        viewBox="0 0 100 70"
        preserveAspectRatio="xMinYMin slice"
      >
        {patternElement}
      </svg>
    </div>
  )
}
