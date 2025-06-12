"use client"

import { useMediaQuery } from "@/hooks"
import type React from "react"
import { RandomQuiz } from "./layouts/RandomQuiz"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { ChevronRight } from "lucide-react"
import { QuizFooter } from "@/components/quiz/QuizFooter"

interface QuizPlayLayoutProps {
  children: React.ReactNode
  quizSlug?: string
  quizType?: "mcq" | "code" | "blanks" | "quiz" | "others"
}

/**
 * Common layout component for quiz play/take screens
 * Shows breadcrumb navigation and consistent sidebar with random quiz
 */
const QuizPlayLayout: React.FC<QuizPlayLayoutProps> = ({ 
  children,
  quizSlug = "",
  quizType = "quiz"
}) => {
  const isMobile = useMediaQuery("(max-width: 1024px)")

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex-1">
        <div className="container mx-auto py-6 px-4 md:px-6">
        
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main quiz content area */}
            <div className="flex-1 min-w-0">{children}</div>

            {/* Sidebar - hidden on mobile, shown as a column on desktop */}
            {!isMobile && (
              <div className="lg:w-80 xl:w-96 shrink-0">
                <div className="sticky top-24">
                  <RandomQuiz />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <QuizFooter />
    </div>
  )
}

export default QuizPlayLayout
