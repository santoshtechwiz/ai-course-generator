"use client"

import { useMediaQuery } from "@/hooks"
import type React from "react"
import { RandomQuiz } from "./RandomQuiz"
import { Suspense, useEffect, useState } from "react"
import { JsonLD } from "@/lib/seo-manager-new"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useGlobalLoading } from "@/store/slices/global-loading-slice"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

interface QuizPlayLayoutProps {
  children: React.ReactNode
  quizSlug?: string
  quizType?: "mcq" | "code" | "blanks" | "quiz" | "openended" | "flashcard" | "others"
  quizId?: string
  isPublic?: boolean
  isFavorite?: boolean
}

// Enhanced loading skeleton component
const QuizSkeleton = () => (
  <Card className="w-full border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="flex justify-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-2 w-6 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </CardContent>
  </Card>
)

const QuizPlayLayout: React.FC<QuizPlayLayoutProps> = ({ children, quizSlug = "", quizType = "quiz" }) => {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")
  const pathname = usePathname()
  const [isLoaded, setIsLoaded] = useState(false)
  const { showLoading } = useGlobalLoading()

  const [quizMeta, setQuizMeta] = useState({
    title: "Interactive Programming Quiz",
    description: "",
    type: quizType,
  })

  useEffect(() => {
    try {
      if (typeof document === "undefined") return

      const urlSegments = pathname?.split("/").filter(Boolean) || []
      const typeFromUrl = urlSegments[1] || quizType
      const slugFromUrl = urlSegments[2] || quizSlug

      // Clean slug: remove ID like -43nn7u
      const cleanedSlug = slugFromUrl.replace(/-[a-z0-9]{4,}$/i, "")

      // Format title from cleaned slug
      const formattedTitle = `${cleanedSlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")} Quiz`

      // Force override <title>
      if (document) {
        document.title = formattedTitle
      }

      // Description fallback
      const metaDescription =
        document?.querySelector('meta[name="description"]')?.getAttribute("content") ||
        document?.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
        "Test your programming knowledge with this interactive quiz"

      setQuizMeta({
        title: formattedTitle,
        description: metaDescription,
        type: typeFromUrl as any,
      })

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.target.nodeName === "TITLE") {
            setQuizMeta((prev) => ({
              ...prev,
              title: document.title || formattedTitle,
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

  // Enhanced container variants for better animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        delay: 0.2,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <motion.div
          className={cn(
            "flex gap-4 sm:gap-6 lg:gap-8",
            isMobile ? "flex-col" : isTablet ? "flex-col xl:flex-row" : "flex-col lg:flex-row",
          )}
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
        >
          {/* Main Content Area */}
          <motion.main className={cn("flex-1 min-w-0 order-1", !isMobile && "lg:order-1")} variants={itemVariants}>
            <motion.div
              className="min-h-[70vh] w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {children}
            </motion.div>
          </motion.main>

          {/* Sidebar - RandomQuiz Component */}
          <motion.aside
            className={cn(
              "shrink-0 order-2",
              isMobile
                ? "w-full order-first"
                : isTablet
                  ? "w-full xl:w-80 xl:order-2"
                  : "w-full lg:w-80 xl:w-96 lg:order-2",
            )}
            variants={itemVariants}
          >
            <div className={cn("w-full", !isMobile && "lg:sticky lg:top-4 xl:top-8")}>
              <Suspense fallback={<QuizSkeleton />}>
                <div className="w-full">
                  <RandomQuiz />
                </div>
              </Suspense>
            </div>
          </motion.aside>
        </motion.div>
      </div>

      {/* Mobile-specific bottom spacing */}
      {isMobile && <div className="h-4" />}
    </div>
  )
}

function getQuizTypeLabel(quizType: string): string {
  const labels: Record<string, string> = {
    mcq: "Multiple Choice",
    code: "Coding Challenge",
    blanks: "Fill in the Blanks",
    openended: "Open-Ended",
    flashcard: "Flashcard",
    quiz: "Quiz",
    others: "Interactive Quiz",
  }

  return labels[quizType] || "Quiz"
}

export default QuizPlayLayout
