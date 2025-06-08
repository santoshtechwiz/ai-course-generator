"use client"

import { useMediaQuery } from "@/hooks"
import type React from "react"
import { RandomQuiz } from "./RandomQuiz"
import { Suspense, useMemo } from "react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { ChevronRight } from "lucide-react"

interface QuizPlayLayoutProps {
  children: React.ReactNode
  quizSlug?: string
  quizType?: "mcq" | "code" | "blanks" | "quiz" | "others"
}

/**
 * Layout component for all quiz play pages (mcq/[slug], code/[slug], blanks/[slug], openended/[slug])
 * Displays the quiz content on the left and a sidebar on the right
 */
const QuizPlayLayout: React.FC<QuizPlayLayoutProps> = ({ 
  children,
  quizSlug = "",
  quizType = "quiz"
}) => {
  const isMobile = useMediaQuery("(max-width: 1024px)")
  
  // Memoize sidebar content to prevent unnecessary re-renders
  const sidebarContent = useMemo(() => {
    if (isMobile) return null;
    return (
      <div className="lg:w-80 xl:w-96 shrink-0">
        <div className="sticky top-24">
          <Suspense fallback={<div className="p-4 text-center">Loading recommendations...</div>}>
            <RandomQuiz />
          </Suspense>
        </div>
      </div>
    );
  }, [isMobile]);

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      {/* Breadcrumb navigation */}
      <Breadcrumb separator={<ChevronRight className="h-4 w-4" />} className="mb-4">
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/dashboard/${quizType}`}>{quizType.toUpperCase()}</BreadcrumbLink>
        </BreadcrumbItem>
        {quizSlug && (
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>{quizSlug.replace(/-/g, ' ')}</BreadcrumbLink>
          </BreadcrumbItem>
        )}
      </Breadcrumb>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main quiz content area */}
        <div className="flex-1 min-w-0">{children}</div>

        {/* Sidebar - hidden on mobile, shown as a column on desktop */}
        {sidebarContent}
      </div>
    </div>
  )
}

export default QuizPlayLayout
