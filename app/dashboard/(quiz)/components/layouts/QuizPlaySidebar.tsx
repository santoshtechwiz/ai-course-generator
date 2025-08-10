"use client"

import { memo, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { RandomQuiz } from "./RandomQuiz"
import { QuizActions } from "../QuizActions"

interface QuizPlaySidebarProps {
  isOpen: boolean
  isMobile: boolean
  isTablet: boolean
  quizSlug: string
  quizData: any
  isFavorite: boolean
  isPublic: boolean
  isOwner: boolean
  randomQuizStats: any
  progressPercentage: number
  timeSpent: number
  questionNumber: number
  totalQuestions: number
  difficulty: string
  diffConfig: {
    color: string
    label: string
  }
  onClose: () => void
  formatTime: (seconds: number) => string
}

const QuizSkeleton = () => (
  <Card className="w-full animate-pulse" role="status" aria-label="Loading quiz information">
    <CardContent className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24 sm:w-32" />
        <Skeleton className="h-6 w-12 sm:w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-32 sm:h-48 w-full" />
      <span className="sr-only">Loading quiz data...</span>
    </CardContent>
  </Card>
)

export const QuizPlaySidebar = memo<QuizPlaySidebarProps>((props) => {
  const {
    isOpen,
    isMobile,
    isTablet,
    onClose,
    quizSlug,
    quizData,
    isFavorite,
    isPublic,
    isOwner
  } = props

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
              onClick={onClose}
            />
          )}

          <motion.aside
            initial={isMobile ? { x: "100%" } : { width: 0 }}
            animate={
              isMobile 
                ? { x: 0 } 
                : { width: isTablet ? "clamp(260px,30%,340px)" : "clamp(280px,26%,360px)" }
            }
            exit={isMobile ? { x: "100%" } : { width: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
              "shrink-0 border-l border-border/20 bg-background/95 backdrop-blur-xl z-40",
              isMobile 
                ? "fixed inset-y-0 right-0 w-full max-w-[90%] sm:max-w-sm shadow-2xl" 
                : "relative h-full"
            )}
          >
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent p-4">
              {isMobile && (
                <div className="flex justify-end mb-4">
                  <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-lg">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <Suspense fallback={<QuizSkeleton />}>
                <div className="space-y-4 sm:space-y-6 w-full">
                  {/* Quiz Actions - Clean and accessible */}
                  {quizSlug ? (
                    <div className="w-full">
                      <QuizActions
                        quizSlug={quizSlug}
                        quizData={quizData || {}}
                        initialIsPublic={isPublic}
                        initialIsFavorite={isFavorite}
                        isOwner={isOwner}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Quiz actions unavailable
                    </div>
                  )}
                  
                  {/* Random Quiz Recommendations */}
                  <RandomQuiz />
                </div>
              </Suspense>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
})


QuizPlaySidebar.displayName = "QuizPlaySidebar"
