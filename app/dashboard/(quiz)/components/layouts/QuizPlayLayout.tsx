"use client"


import { useMediaQuery } from "@/hooks"
import type React from "react"
import { RandomQuiz } from "./RandomQuiz"

interface QuizPlayLayoutProps {
  children: React.ReactNode
}

/**
 * Layout component for all quiz play pages (mcq/[slug], code/[slug], blanks/[slug], openended/[slug])
 * Displays the quiz content on the left and a sidebar on the right
 */
const QuizPlayLayout: React.FC<QuizPlayLayoutProps> = ({ children }) => {
  const isMobile = useMediaQuery("(max-width: 1024px)")

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main quiz content area */}
        <div className="flex-1 min-w-0">{children}</div>

        {/* Sidebar - hidden on mobile, shown as a column on desktop */}
        {!isMobile && (
          <div className="lg:w-80 xl:w-96 shrink-0">
            <div className="sticky top-24">
             <RandomQuiz></RandomQuiz>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizPlayLayout
