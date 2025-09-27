"use client"

import * as React from "react"

interface QuizIconProps {
  className?: string
  size?: number
}

export const QuizIcon: React.FC<QuizIconProps> = ({
  className = "",
  size = 64
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="url(#quizGradient)"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.1"
      />

      {/* Quiz paper */}
      <rect
        x="16"
        y="18"
        width="32"
        height="28"
        rx="3"
        fill="currentColor"
        opacity="0.8"
      />

      {/* Paper content area */}
      <rect
        x="20"
        y="22"
        width="24"
        height="20"
        rx="1"
        fill="white"
        opacity="0.9"
      />

      {/* Question mark */}
      <text
        x="32"
        y="35"
        textAnchor="middle"
        fontSize="16"
        fontWeight="bold"
        fill="currentColor"
        opacity="0.8"
      >
        ?
      </text>

      {/* Multiple choice circles */}
      <circle cx="24" cy="26" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="24" cy="32" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="24" cy="38" r="2" fill="currentColor" opacity="0.6" />

      {/* Check mark for correct answer */}
      <path
        d="M22 26 L25 29 L30 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />

      {/* Trophy */}
      <path
        d="M28 14 L36 14 L34 18 L38 18 L32 22 L26 18 L30 18 Z"
        fill="currentColor"
        opacity="0.7"
      />
      <rect
        x="30"
        y="22"
        width="4"
        height="6"
        fill="currentColor"
        opacity="0.7"
      />

      {/* Brain icon elements */}
      <path
        d="M20 12 Q32 8 44 12 Q44 16 32 14 Q20 16 20 12"
        fill="currentColor"
        opacity="0.5"
      />

      {/* Gradient definition */}
      <defs>
        <radialGradient id="quizGradient" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </radialGradient>
      </defs>
    </svg>
  )
}

export default QuizIcon