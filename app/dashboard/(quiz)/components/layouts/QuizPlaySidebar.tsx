"use client"

import { memo, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { QuizActions } from "../QuizActions"
import { RandomQuiz } from "./RandomQuiz"

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
  <Card className="w-full animate-pulse">
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-48 w-full" />
    </CardContent>
  </Card>
)

export const QuizPlaySidebar = memo<QuizPlaySidebarProps>(
  ({
    isOpen,
    isMobile,
    isTablet,
    quizSlug,
    quizData,
    isFavorite,
    isPublic,
    isOwner,
    randomQuizStats,
    progressPercentage,
    timeSpent,
    questionNumber,
    totalQuestions,
    difficulty,
    diffConfig,
    onClose,
    formatTime,
  }) => {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Overlay */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                onClick={onClose}
              />
            )}

            {/* Sidebar */}
            <motion.aside
              initial={isMobile ? { x: "100%" } : { width: 0 }}
              animate={isMobile ? { x: 0 } : { width: isTablet ? 288 : 320 }}
              exit={isMobile ? { x: "100%" } : { width: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={cn(
                "shrink-0 border-l border-border/20 bg-background/95 backdrop-blur-xl z-40",
                isMobile ? "fixed inset-y-0 right-0 w-80 shadow-2xl" : "relative h-full",
              )}
            >
              <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent p-4">
                {/* Mobile Close Button */}
                {isMobile && (
                  <div className="flex justify-end mb-4">
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-lg">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <Suspense fallback={<QuizSkeleton />}>
                  <div className="space-y-4">
                    {/* Quiz Actions */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl shadow-sm"
                    >
                      <QuizActions
                        quizSlug={quizSlug}
                        quizData={quizData}
                        initialIsFavorite={isFavorite}
                        initialIsPublic={isPublic}
                        isOwner={isOwner}
                      />
                    </motion.div>

                  

                    {/* Random Quiz Discovery */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl shadow-sm"
                    >
                      <RandomQuiz stats={randomQuizStats} isVisible={true} showHeader={true} showShuffle={true} />
                    </motion.div>

                    {/* Keyboard Shortcuts */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-4 shadow-sm"
                    >
                      <h3 className="font-semibold text-sm mb-3">Keyboard Shortcuts</h3>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Toggle Sidebar</span>
                          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+B</kbd>
                        </div>
                        <div className="flex justify-between">
                          <span>Fullscreen</span>
                          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+F</kbd>
                        </div>
                        <div className="flex justify-between">
                          <span>Pause/Resume</span>
                          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+Space</kbd>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </Suspense>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    )
  },
)

QuizPlaySidebar.displayName = "QuizPlaySidebar"
