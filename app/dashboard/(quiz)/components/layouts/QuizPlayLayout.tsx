"use client"

import { useMediaQuery } from "@/hooks"
import type React from "react"
import { RandomQuiz } from "./RandomQuiz"
import { Suspense, useMemo, useEffect, useState } from "react"
import { JsonLD } from "@/lib/seo-manager-new"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useGlobalLoading } from "@/store/slices/global-loading-slice"

export const dynamic = "force-dynamic"

interface QuizPlayLayoutProps {
  children: React.ReactNode
  quizSlug?: string
  quizType?: "mcq" | "code" | "blanks" | "quiz" | "openended" | "flashcard" | "others"
  quizId?: string
  isPublic?: boolean
  isFavorite?: boolean
}

const QuizPlayLayout: React.FC<QuizPlayLayoutProps> = ({ children, quizSlug = "", quizType = "quiz" }) => {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const pathname = usePathname()
  const [isLoaded, setIsLoaded] = useState(false)
  const { isLoading } = useGlobalLoading()

  const [quizMeta, setQuizMeta] = useState({
    title:
      typeof document !== "undefined"
        ? document.title || "Interactive Programming Quiz"
        : "Interactive Programming Quiz",
    description: "",
    type: quizType,
  })

  // Extract quiz information from document head for structured data
  useEffect(() => {
    try {
      if (typeof document === "undefined") return

      const pageTitle = document?.title || "Interactive Programming Quiz"
      const metaDescription =
        document?.querySelector('meta[name="description"]')?.getAttribute("content") ||
        document?.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
        "Test your programming knowledge with this interactive quiz"

      const urlSegments = pathname?.split("/").filter(Boolean) || []
      const typeFromUrl = urlSegments[1] || quizType
      const slugFromUrl = urlSegments[2] || quizSlug

      setQuizMeta({
        title: pageTitle,
        description: metaDescription,
        type: typeFromUrl as any,
      })

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

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.target.nodeName === "TITLE") {
            setQuizMeta((prev) => ({
              ...prev,
              title: document.title || "Interactive Programming Quiz",
            }))
          }
        })
      })

      const head = document.querySelector("head")
      if (head) {
        observer.observe(head, {
          subtree: true,
          childList: true,
          characterData: true,
        })
      }

      const timer = setTimeout(() => setIsLoaded(true), 100)
      return () => {
        observer.disconnect()
        clearTimeout(timer)
      }
    } catch (error) {
      console.warn("Failed to update quiz metadata:", error)
      setIsLoaded(true)
    }
  }, [pathname, quizType, quizSlug])



  const quizTypeLabel = getQuizTypeLabel(quizMeta.type)

  // Don't render layout content if global loader is active
  if (isLoading) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="flex flex-col lg:flex-row gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          layout
        >
          {/* Main Quiz Content */}
          <motion.main
            className="flex-1 min-w-0 max-w-none"
            layout
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              mass: 1,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="min-h-[70vh]"
            >
              {children}
            </motion.div>
          </motion.main>

          {/* Sidebar - Hidden on mobile */}
          {!isMobile && (
            <motion.aside
              className="w-full lg:w-80 xl:w-96 shrink-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isLoaded ? 1 : 0, x: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.3,
              }}
            >
              <div className="sticky top-8">
                <Suspense
                  fallback={
                    <div className="p-6 border border-border/50 rounded-xl bg-card/50 backdrop-blur-sm animate-pulse shadow-sm">
                      <div className="h-12 bg-muted/50 rounded-lg mb-4"></div>
                      <div className="h-48 bg-muted/50 rounded-lg mb-4"></div>
                      <div className="h-6 bg-muted/50 rounded-md w-3/4 mb-3"></div>
                      <div className="h-24 bg-muted/50 rounded-md"></div>
                      <div className="h-10 bg-muted/50 rounded-md w-1/2 mt-4"></div>
                    </div>
                  }
                >
                  <RandomQuiz />
                </Suspense>
              </div>
            </motion.aside>
          )}
        </motion.div>
      </div>
    </div>
  )
}

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
