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
    try {
      // Get document title with better fallback
      const pageTitle = document?.title || "Interactive Programming Quiz"

      // Get description from meta tag with better error handling
      const metaDescription =
        document?.querySelector('meta[name="description"]')?.getAttribute("content") ||
        document?.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
        "Test your programming knowledge with this interactive quiz"

      // Extract quiz type from URL if not provided in props
      const urlSegments = pathname.split("/").filter(Boolean)
      const typeFromUrl = urlSegments[1] || quizType
      const slugFromUrl = urlSegments[2] || quizSlug

      // Update quiz metadata state
      setQuizMeta({
        title: pageTitle,
        description: metaDescription,
        type: typeFromUrl as any,
      })

      // Improve title formatting with better fallbacks
      if (slugFromUrl && !pageTitle.toLowerCase().includes("quiz")) {
        const formattedTitle = `${slugFromUrl
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")} Quiz`

        try {
          if (document) {
            document.title = formattedTitle
          }
        } catch (titleError) {
          console.warn("Failed to update document title:", titleError)
        }
      }
    } catch (error) {
      console.warn("Failed to update quiz metadata:", error)
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
    <div className="container mx-auto py-4 px-3 md:px-4 lg:px-6">
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

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 xl:gap-8">
        {/* Main quiz content area */}
        <div className="flex-1 min-w-0 max-w-none">{children}</div>

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
