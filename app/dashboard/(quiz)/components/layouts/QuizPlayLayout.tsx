"use client"

import { useMediaQuery } from "@/hooks"
import type React from "react"
import { RandomQuiz } from "./RandomQuiz"
import { Suspense, useMemo, useEffect, useState } from "react"
import { JsonLD } from "@/app/schema/components"
import { usePathname } from "next/navigation"

interface QuizPlayLayoutProps {
  children: React.ReactNode
  quizSlug?: string
  quizType?: "mcq" | "code" | "blanks" | "quiz" | "others"
}

/**
 * Layout component for all quiz play pages (mcq/[slug], code/[slug], blanks/[slug], openended/[slug])
 * Displays the quiz content on the left and a sidebar on the right
 */
const QuizPlayLayout: React.FC<QuizPlayLayoutProps> = ({ children, quizSlug = "", quizType = "quiz" }) => {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const pathname = usePathname()
  const [quizMeta, setQuizMeta] = useState({
    title: document.title || "Interactive Programming Quiz",
    description: "",
    type: quizType,
  })

  // Extract quiz information from document head for structured data
  useEffect(() => {
    // Get document title - defaults to a fallback if not set
    const pageTitle = document.title || "Interactive Programming Quiz"

    // Get description from meta tag
    const metaDescription =
      document.querySelector('meta[name="description"]')?.getAttribute("content") ||
      document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
      "Test your programming knowledge with this interactive quiz"

    // Extract quiz type from URL if not provided in props
    const urlSegments = pathname.split("/")
    const typeFromUrl = urlSegments[2] || quizType
    const slugFromUrl = urlSegments[3] || quizSlug

    // Update quiz metadata state
    setQuizMeta({
      title: pageTitle,
      description: metaDescription,
      type: typeFromUrl as any,
    })

    // Add an additional handler to properly set document title when not set correctly
    if (!document.title.includes("Quiz") && !document.title.includes("quiz") && slugFromUrl) {
      const formattedTitle = `${slugFromUrl
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")} Quiz | CourseAI`
      document.title = formattedTitle
    }
  }, [pathname, quizType, quizSlug])

  // Memoize sidebar content to prevent unnecessary re-renders
  const sidebarContent = useMemo(() => {
    if (isMobile) return null
    return (
      <div className="lg:w-80 xl:w-96 shrink-0">
        <div className="sticky top-24">
          <Suspense fallback={<div className="p-4 text-center">Loading recommendations...</div>}>
            <RandomQuiz />
          </Suspense>
        </div>
      </div>
    )
  }, [isMobile])

  // Quiz structured data for SEO
  const quizTypeLabel = getQuizTypeLabel(quizMeta.type)

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <JsonLD
        type="Quiz"
        data={{
          name: quizMeta.title,
          description: quizMeta.description,
          educationalAlignment: {
            "@type": "AlignmentObject",
            alignmentType: "educationalSubject",
            targetName: "Computer Programming",
          },
          learningResourceType: quizTypeLabel,
          about: {
            "@type": "Thing",
            name: quizMeta.title.split("|")[0].trim(),
          },
        }}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main quiz content area */}
        <div className="flex-1 min-w-0">{children}</div>

        {/* Sidebar - hidden on mobile, shown as a column on desktop */}
        {sidebarContent}
      </div>
    </div>
  )
}

// Helper function to get user-friendly quiz type labels
function getQuizTypeLabel(quizType: string): string {
  switch (quizType) {
    case "mcq":
      return "Multiple Choice"
    case "code":
      return "Coding Challenge"
    case "blanks":
      return "Fill in the Blanks"
    case "openended":
      return "Open-Ended"
    case "flashcard":
      return "Flashcard"
    default:
      return "Quiz"
  }
}

export default QuizPlayLayout
