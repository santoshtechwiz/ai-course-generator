import type React from "react"

/**
 * Quiz Module Layout
 * 
 * This layout wraps all quiz-related pages and provides:
 * - Consistent spacing and styling for quiz components
 * - Proper height management without fixed vh units
 * - Optimized for all quiz types (MCQ, Code, Blanks, Open-ended, Flashcards)
 */
export default function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 flex flex-col">
      {children}
    </div>
  )
}
