"use client"

import { memo, useEffect, useMemo } from "react"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import NProgress from "nprogress"
import { useInView } from "react-intersection-observer"
import { AlertCircle, FileQuestion, Search, Plus, RefreshCw, Trophy, Grid3X3, List } from "lucide-react"
import { CreateCard } from "@/components/CreateCard"
import { QuizCard } from "./QuizCard"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { QuizListItem } from "@/app/actions/getQuizes"
import type { QuizType } from "@/app/types/quiz-types"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card, CardContent } from "@/components/ui/card"

NProgress.configure({
  minimum: 0.3,
  easing: "ease",
  speed: 500,
  showSpinner: false,
})

interface QuizListProps {
  quizzes: QuizListItem[]
  isLoading: boolean
  isError: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean | undefined
  isSearching: boolean
  onRetry?: () => void
  onCreateQuiz?: () => void
  activeFilter?: string
  onFilterChange?: (filter: string) => void
  quizCounts: {
    all: number
    mcq: number
    openended: number
    code: number
    blanks: number
    flashcard: number
  }
  viewMode?: "grid" | "list"
  onViewModeChange?: (mode: "grid" | "list") => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
}

function QuizListComponent({
  quizzes,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  isSearching,
  onRetry,
  onCreateQuiz,
  activeFilter = "all",
  onFilterChange,
  quizCounts,
  viewMode = "grid",
  onViewModeChange,
}: QuizListProps) {
  const [endMessageRef, endMessageInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  useEffect(() => {
    if (isFetchingNextPage) {
      NProgress.start()
    } else {
      NProgress.done()
    }
    return () => {
      NProgress.done()
    }
  }, [isFetchingNextPage])

  const getEstimatedTime = (questionCount: number): string => {
    const minutes = Math.max(Math.ceil(questionCount * 0.5), 1)
    return `${minutes} min`
  }

  const getQuestionCount = (quiz: { questionCount: number }): number => quiz.questionCount || 0

  const filteredQuizzes = useMemo(
    () => (activeFilter === "all" ? quizzes : quizzes.filter((quiz) => quiz.quizType === activeFilter)),
    [quizzes, activeFilter],
  )

  if (isLoading) {
    return <QuizzesSkeleton />
  }

  if (isError) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="font-semibold text-lg mb-2">Failed to load quizzes</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            We encountered an error while loading your quizzes. Please check your connection and try again.
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (quizzes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            {isSearching ? (
              <>
                <Search className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-xl mb-2">No quizzes found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  We couldn't find any quizzes matching your search criteria. Try adjusting your filters or search
                  terms.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-xl mb-2">No quizzes yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Get started by creating your first quiz. It's quick and easy!
                </p>
                <CreateCard
                  title="Create Your First Quiz"
                  description="Start building engaging quizzes to test knowledge and skills."
                  animationDuration={2.0}
                />
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {activeFilter === "all" ? "All Quizzes" : `${activeFilter.toUpperCase()} Quizzes`}
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? "es" : ""} available
          </p>
        </div>

        {onViewModeChange && (
          <ToggleGroup type="single" value={viewMode} onValueChange={onViewModeChange}>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid3X3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>

      {/* Quiz Distribution Stats */}
      {quizzes.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Quiz Distribution</h3>
              <Badge variant="secondary">{quizzes.length} total</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(quizCounts)
                .filter(([key]) => key !== "all")
                .map(([type, count]) => (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="text-2xl font-bold text-primary">{count}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {type === "openended" ? "Open Ended" : type}
                    </div>
                  </motion.div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Grid */}
      <motion.div
        className={cn(
          "grid gap-6",
          viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 max-w-4xl mx-auto space-y-4",
        )}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            {filteredQuizzes.map((quiz, idx) => (
              <motion.div
                key={quiz.id}
                variants={itemVariants}
                layout
                className="h-full"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
                transition={{ delay: idx * 0.03 }}
              >
                <QuizCard
                  title={quiz.title}
                  description={quiz.title}
                  questionCount={getQuestionCount(quiz)}
                  isPublic={quiz.isPublic}
                  slug={quiz.slug}
                  quizType={quiz.quizType as QuizType}
                  estimatedTime={getEstimatedTime(quiz.questionCount)}
                  completionRate={Math.min(Math.max(quiz.bestScore || 0, 0), 100)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>

      {/* Loading More */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <QuizzesSkeleton itemCount={3} />
        </div>
      )}

      {/* End Message */}
      {!hasNextPage && quizzes.length > 0 && (
        <motion.div
          ref={endMessageRef}
          initial={{ opacity: 0, y: 20 }}
          animate={endMessageInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Trophy className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">You've seen them all!</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                You've explored all available quizzes. Ready to create something new?
              </p>
              {onCreateQuiz && (
                <Button onClick={onCreateQuiz} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Quiz
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export const QuizList = memo(QuizListComponent, (prevProps, nextProps) => {
  return (
    prevProps.quizzes.length === nextProps.quizzes.length &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isError === nextProps.isError &&
    prevProps.isFetchingNextPage === nextProps.isFetchingNextPage &&
    prevProps.hasNextPage === nextProps.hasNextPage &&
    prevProps.activeFilter === nextProps.activeFilter &&
    prevProps.viewMode === nextProps.viewMode
  )
})
