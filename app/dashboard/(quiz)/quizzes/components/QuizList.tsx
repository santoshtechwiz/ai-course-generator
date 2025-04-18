"use client"

import { memo, useEffect, useCallback, useState } from "react"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import NProgress from "nprogress"
import { useInView } from "react-intersection-observer"
import { AlertCircle, FileQuestion, Search, Plus, RefreshCw } from "lucide-react"
import { CreateCard } from "@/components/CreateCard"
import { QuizCard } from "@/components/shared/QuizCard"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import type { QuizListItem } from "@/app/types/types"

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
      damping: 30,
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
}: QuizListProps) {
  const [sortedQuizzes, setSortedQuizzes] = useState<QuizListItem[]>([])
  const [sortOption, setSortOption] = useState<string>("newest")

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

  const [endMessageRef, endMessageInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Helper functions moved from PublicQuizCardListing
  const getEstimatedTime = useCallback((questionCount: number): string => {
    const minutes = Math.max(Math.ceil(questionCount * 0.5), 1) // At least 1 minute
    return `${minutes} min`
  }, [])

  const getQuestionCount = useCallback(
    (quiz: {
      quizType: string
      questionCount: number
      openEndedCount?: number
      flashCardCount?: number
    }): number => {
      if (quiz.quizType === "mcq") {
        return quiz.questionCount
      }
      if (quiz.quizType === "openended") {
        return quiz.openEndedCount || 0
      }
      if (quiz.quizType === "fill-blanks") {
        return quiz.flashCardCount || 0
      }
      if (quiz.quizType === "code") {
        return quiz.questionCount
      }
      return 0
    },
    [],
  )

  // Sort quizzes based on selected option
  useEffect(() => {
    if (!quizzes.length) return

    let sorted = [...quizzes]

    switch (sortOption) {
      case "newest":
        sorted = sorted.sort((a, b) => new Date(b.timeStarted).getTime() - new Date(a.timeStarted).getTime())
        break
      case "oldest":
        sorted = sorted.sort((a, b) => new Date(a.timeStarted).getTime() - new Date(b.timeStarted).getTime())
        break
      case "a-z":
        sorted = sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "z-a":
        sorted = sorted.sort((a, b) => b.title.localeCompare(a.title))
        break
      case "most-questions":
        sorted = sorted.sort((a, b) => b.questionCount - a.questionCount)
        break
    }

    setSortedQuizzes(sorted)
  }, [quizzes, sortOption])

  if (isLoading) {
    return <QuizzesSkeleton />
  }

  if (isError) {
    return (
      <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-800 flex flex-col items-center">
        <AlertCircle className="w-10 h-10 mb-3 text-red-500 dark:text-red-400" />
        <h3 className="font-semibold text-xl mb-2">Error loading quizzes</h3>
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
          We couldn't load your quizzes. Please try again later.
        </p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="mt-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center p-10 bg-muted/30 rounded-lg border border-muted">
        {isSearching ? (
          <div className="max-w-md mx-auto">
            <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">No matching quizzes found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileQuestion className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">No quizzes available</h3>
            <p className="text-muted-foreground mb-6">Be the first to create a quiz and share your knowledge!</p>
            <CreateCard
              title="Start Fresh"
              description="Be the first to create a quiz on this topic! It's easy and fun."
              animationDuration={2.0}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {onFilterChange && (
          <Tabs value={activeFilter} onValueChange={onFilterChange} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-2 sm:flex sm:flex-row">
              <TabsTrigger value="all" className="flex items-center gap-1.5">
                All
                <Badge variant="secondary" className="ml-1 text-xs">
                  {quizzes.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="mcq" className="flex items-center gap-1.5">
                MCQ
                <Badge variant="secondary" className="ml-1 text-xs">
                  {quizzes.filter((q) => q.quizType === "mcq").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="openended" className="flex items-center gap-1.5">
                Open Ended
                <Badge variant="secondary" className="ml-1 text-xs">
                  {quizzes.filter((q) => q.quizType === "openended").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-1.5">
                Code
                <Badge variant="secondary" className="ml-1 text-xs">
                  {quizzes.filter((q) => q.quizType === "code").length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            className="bg-background border rounded-md px-3 py-1.5 text-sm"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="a-z">A-Z</option>
            <option value="z-a">Z-A</option>
            <option value="most-questions">Most Questions</option>
          </select>

          {onCreateQuiz && (
            <Button onClick={onCreateQuiz} className="whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          )}
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <LayoutGroup>
          <AnimatePresence mode="wait">
            {sortedQuizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                variants={itemVariants}
                layout
                className="h-full"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: 20 }}
              >
                <QuizCard
                  title={quiz.title}
                  description={quiz.title}
                  questionCount={getQuestionCount(quiz)}
                  isPublic={quiz.isPublic}
                  slug={quiz.slug}
                  quizType={quiz.quizType as "mcq" | "openended" | "fill-blanks" | "code"}
                  estimatedTime={getEstimatedTime(quiz.questionCount)}
                  completionRate={Math.min(Math.max(quiz.bestScore || 0, 0), 100)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>

      {isFetchingNextPage && <QuizzesSkeleton itemCount={3} />}

      {!hasNextPage && quizzes.length > 0 && (
        <div
          ref={endMessageRef}
          className={cn(
            "text-center mt-8 p-4 text-muted-foreground bg-muted/20 rounded-lg border border-muted/50 transition-opacity duration-500",
            endMessageInView ? "opacity-100" : "opacity-0",
          )}
        >
          <span className="font-medium">You've reached the end!</span> No more quizzes to load.
        </div>
      )}

      {/* Add the animation keyframes */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export const QuizList = memo(QuizListComponent)
