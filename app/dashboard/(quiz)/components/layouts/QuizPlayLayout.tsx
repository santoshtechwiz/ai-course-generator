"use client"

import { useMediaQuery } from "@/hooks"
import type React from "react"
import { RandomQuiz } from "./RandomQuiz"
import { Suspense, useEffect, useState } from "react"
import { JsonLD } from "@/lib/seo-manager-new"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useGlobalLoading } from "@/store/slices/global-loading-slice"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { QuizActions } from "../QuizActions"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, ChevronLeft, ChevronRight, LayoutPanelLeft, Maximize, Minimize, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { selectQuizUserId } from "@/store/slices/quiz"

import { useDispatch, useSelector } from "react-redux"
export const dynamic = "force-dynamic"

interface QuizPlayLayoutProps {
  children: React.ReactNode
  quizSlug?: string
  quizType?: "mcq" | "code" | "blanks" | "quiz" | "openended" | "flashcard" | "others"
  quizId?: string
  isPublic?: boolean
  isFavorite?: boolean
  userId?: string
  ownerId?: string
  quizData?: any
}

const QuizSkeleton = () => (
  <Card className="w-full border-border/50 bg-card/50 backdrop-blur-sm shadow-sm rounded-xl">
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-4 w-full rounded-lg" />
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

const QuizPlayLayout: React.FC<QuizPlayLayoutProps> = ({
  children,
  quizSlug = "",
  quizType = "quiz",
  quizId,
  isPublic = false,
  isFavorite = false,
  userId = "",
  ownerId = "",
  quizData = null,
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")
  const pathname = usePathname()
  const [isLoaded, setIsLoaded] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { showLoading } = useGlobalLoading()
  const quizOwnerId = useSelector(selectQuizUserId) // Get the actual quiz owner ID


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

      const cleanedSlug = slugFromUrl.replace(/-[a-z0-9]{4,}$/i, "")
      const formattedTitle = `${cleanedSlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")} Quiz`

      if (document) {
        document.title = formattedTitle
      }

      const metaDescription =
        document?.querySelector('meta[name="description"]')?.getAttribute("content") ||
        document?.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
        "Test your programming knowledge with this interactive quiz"

      setQuizMeta({
        title: formattedTitle,
        description: metaDescription,
        type: typeFromUrl as any,
      })

      const timer = setTimeout(() => setIsLoaded(true), 100)

      return () => {
        clearTimeout(timer)
      }
    } catch (error) {
      console.warn("Failed to update quiz metadata:", error)
      setIsLoaded(true)
    }
  }, [pathname, quizType, quizSlug])

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true)
    }
  }, [isMobile])

  const quizTypeLabel = getQuizTypeLabel(quizMeta.type)

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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
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

      {/* Focus Mode Toggle - Sticky Header */}
      <motion.div
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-sm"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="flex md:hidden"
              >
                <LayoutPanelLeft className="h-5 w-5" />
              </Button>
              
              <h1 className="text-lg font-bold text-foreground truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                {quizMeta.title}
              </h1>
              
              
            </div>

            <div className="flex items-center gap-2">
              {/* Focus Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFocusMode(!focusMode)}
                className="flex items-center gap-1.5"
              >
                {focusMode ? (
                  <>
                    <Minimize className="h-4 w-4" />
                    <span className="hidden sm:inline">Exit Focus</span>
                  </>
                ) : (
                  <>
                    <Maximize className="h-4 w-4" />
                    <span className="hidden sm:inline">Focus Mode</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <motion.div
          className="flex gap-4 sm:gap-6 lg:gap-8 h-full"
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
        >
          {/* Main Quiz Content */}
          <motion.main
            className={cn(
              "flex-1 min-w-0 transition-all duration-300",
              focusMode && "mx-auto max-w-4xl",
              isMobile ? "w-full" : "min-w-[60%]",
            )}
            variants={itemVariants}
          >
            <motion.div
              className="min-h-[calc(100vh-12rem)] w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {children}
            </motion.div>
          </motion.main>

          {/* Sidebar - Hidden in focus mode */}
          <AnimatePresence>
            {!focusMode && (
              <motion.aside
                className={cn(
                  "shrink-0 transition-all duration-300",
                  isMobile
                    ? sidebarCollapsed
                      ? "w-0 overflow-hidden"
                      : "w-full fixed inset-y-0 right-0 z-40 bg-background border-l border-border shadow-xl"
                    : isTablet
                      ? sidebarCollapsed
                        ? "w-0 overflow-hidden"
                        : "w-80"
                      : "w-80 xl:w-96",
                )}
                initial={{ opacity: 0, x: 50 }}
                animate={{
                  opacity: sidebarCollapsed ? 0 : 1,
                  x: sidebarCollapsed ? 50 : 0,
                }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                variants={itemVariants}
              >
                {/* Mobile Overlay */}
                {isMobile && !sidebarCollapsed && (
                  <motion.div
                    className="fixed inset-0 bg-black/50 z-30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSidebarCollapsed(true)}
                  />
                )}

                <div className={cn("h-full space-y-4 relative z-40", isMobile ? "p-4 pt-16" : "sticky top-20")}>
                  {/* Mobile Close Button */}
                  {isMobile && !sidebarCollapsed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarCollapsed(true)}
                      className="absolute top-4 right-4 z-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}

                  <Suspense fallback={<QuizSkeleton />}>
                    <SidebarProvider>
                      <div className="space-y-4 w-full overflow-y-auto">
                        {/* Quiz Actions - Compact Design */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <QuizActions
                            quizSlug={quizSlug}
                            quizData={quizData}
                            initialIsFavorite={isFavorite}
                            initialIsPublic={isPublic}
                            ownerId={quizOwnerId}
                            userId={userId}
                            className="w-full"
                            quizId={quizId ?? ""}
                          />
                        </motion.div>

                        {/* Random Quiz - Collapsible */}
                        <motion.div
                          className="border-t border-border/50 pt-4"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <RandomQuiz />
                        </motion.div>
                      </div>
                    </SidebarProvider>
                  </Suspense>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Mobile spacing */}
      {isMobile && !sidebarCollapsed && <div className="h-4" />}
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