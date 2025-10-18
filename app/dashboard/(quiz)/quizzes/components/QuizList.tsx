"use client"

import { memo, useMemo, useState, useCallback, useEffect, startTransition } from "react"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import { useInView } from "react-intersection-observer"
import {
  AlertCircle,
  FileQuestion,
  Search,
  Plus,
  RefreshCw,
  Grid3X3,
  List,
  Sparkles,
  Target,
  Brain,
  X,
  SlidersHorizontal,
  ChevronDown,
  Star,
  BookOpen,
  TrendingUp,
} from "lucide-react"
import { QuizCard } from "./QuizCard"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { QuizListItem } from "@/app/actions/getQuizes"
import type { QuizType } from "@/app/types/quiz-types"
import { QUIZ_TYPE_CONFIG } from "./quizTypeConfig"
import { Card, CardContent } from "@/components/ui/card"
import { useDeleteQuiz } from "@/hooks/use-delete-quiz"
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog"
import { BaseListLayout } from "@/components/shared/BaseListLayout"
import { NeobrutalistCard } from "@/components/shared/NeobrutalistCard"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// SVG Background Component (commented out as it's not part of the updates)
// const BackgroundSVG = () => (
//   <div className="absolute inset-0 overflow-hidden pointer-events-none">
//     <svg
//       className="absolute top-0 left-0 w-full h-full opacity-[0.02] dark:opacity-[0.05]"
//       viewBox="0 0 100 100"
//       xmlns="http://www.w3.org/2000/svg"
//     >
//       <defs>
//         <pattern id="quiz-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
//           <circle cx="10" cy="10" r="1.5" fill="currentColor" />
//           <rect x="5" y="5" width="2" height="2" fill="currentColor" opacity="0.3" />
//           <rect x="13" y="13" width="2" height="2" fill="currentColor" opacity="0.3" />
//         </pattern>
//       </defs>
//       <rect width="100" height="100" fill="url(#quiz-pattern)" />
//     </svg>

//     {/* Floating geometric shapes */}
//     <div className="absolute top-20 left-1/4 w-2 h-2 bg-blue-200 dark:bg-blue-900 rounded-full animate-pulse" />
//     <div className="absolute top-40 right-1/3 w-3 h-3 bg-purple-200 dark:bg-purple-900 rounded-sm animate-pulse delay-1000" />
//     <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-green-200 dark:bg-green-900 rounded-full animate-pulse delay-2000" />
//     <div className="absolute bottom-20 right-1/4 w-3 h-3 bg-orange-200 dark:bg-orange-900 rounded-sm animate-pulse delay-3000" />
//   </div>
// )

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
  quizCounts?: {
    all: number
    mcq: number
    openended: number
    code: number
    blanks: number
    flashcard: number
  }
  viewMode?: "grid" | "list"
  onViewModeChange?: (mode: "grid" | "list") => void
  currentUserId?: string
  showActions?: boolean
  onQuizDeleted?: () => void
  onTypeClick?: (type: QuizType) => void
  search?: string
  selectedTypes?: QuizType[]
  showPublicOnly?: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
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
  quizCounts,
  viewMode = "grid",
  onViewModeChange,
  currentUserId,
  showActions = false,
  onQuizDeleted,
  onTypeClick,
  search = "",
  selectedTypes = [],
  showPublicOnly = false,
}: QuizListProps) {
  const [endMessageRef, endMessageInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Delete quiz state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quizToDelete, setQuizToDelete] = useState<{ slug: string; title: string; quizType: QuizType } | null>(null)

  // Local filter state (when external state is not provided)
  const [localSearch, setLocalSearch] = useState("")
  const [localSelectedTypes, setLocalSelectedTypes] = useState<QuizType[]>([])
  // Local sort (limited to title for now to avoid relying on non-existent fields)
  const [sortBy, setSortBy] = useState<"title" | "default">("default")
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Quiz type configurations for filters
  // Using shared QUIZ_TYPE_CONFIG imported above

  // Debounce search input - use startTransition to prevent UI blocking
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(localSearch)
      })
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [localSearch])

  // Use external state if provided, otherwise use local state
  const currentSearch = search || debouncedSearch
  const currentSelectedTypes = selectedTypes.length > 0 ? selectedTypes : localSelectedTypes

  // Filter handlers - Optimized to prevent UI freeze
  const handleSearchChange = useCallback((value: string) => {
    // Use startTransition to prevent blocking UI
    setLocalSearch(value)
  }, [])

  const toggleQuizType = useCallback(
    (type: QuizType) => {
      setLocalSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
      onTypeClick?.(type)
    },
    [onTypeClick],
  )

  const clearFilters = useCallback(() => {
    setLocalSearch("")
    setLocalSelectedTypes([])
    setSortBy("default")
  }, [])

  const deleteQuizMutation = useDeleteQuiz({
    onSuccess: () => {
      setDeleteDialogOpen(false)
      setQuizToDelete(null)
      onQuizDeleted?.()
    },
    onError: (error) => {
      console.error("Failed to delete quiz:", error)
    },
  })

  const getEstimatedTime = (questionCount: number): string => {
    const minutes = Math.max(Math.ceil(questionCount * 0.5), 1)
    return `${minutes} min`
  }

  // Optimized filtering with proper memoization to prevent UI freeze
  const filteredQuizzes = useMemo(() => {
    // Early return if no quizzes
    if (!quizzes || quizzes.length === 0) return []
    
    let list = [...quizzes] // Create a copy to avoid mutations

    // Search term filter - optimized
    if (currentSearch && currentSearch.trim() !== "") {
      const term = currentSearch.trim().toLowerCase()
      list = list.filter((quiz) => {
        const title = quiz.title?.toLowerCase() || ""
        const description = (quiz as any).description?.toLowerCase() || ""
        return title.includes(term) || description.includes(term)
      })
    }

    // Type filter - use current selected types
    if (currentSelectedTypes && currentSelectedTypes.length > 0) {
      list = list.filter((quiz) => currentSelectedTypes.includes(quiz.quizType as QuizType))
    }

    // Public only filter
    if (showPublicOnly) {
      list = list.filter((quiz) => quiz.isPublic)
    }

    // Active tab filter (keeps compatibility with tab-based filtering)
    if (activeFilter && activeFilter !== "all") {
      list = list.filter((quiz) => quiz.quizType?.toLowerCase() === activeFilter.toLowerCase())
    }

    // Sort the results
    if (sortBy === "title") {
      list.sort((a, b) => a.title.localeCompare(b.title))
    }

    return list
  }, [quizzes, currentSelectedTypes, currentSearch, showPublicOnly, activeFilter, sortBy])

  const handleDeleteQuiz = (slug: string, quizType: QuizType) => {
    const quiz = quizzes.find((q) => q.slug === slug)
    if (quiz) {
      setQuizToDelete({ slug, title: quiz.title, quizType })
      setDeleteDialogOpen(true)
    }
  }

  const confirmDelete = () => {
    if (quizToDelete) {
      deleteQuizMutation.mutate({
        slug: quizToDelete.slug,
        quizType: quizToDelete.quizType,
      })
    }
  }

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
        className="min-h-[500px] flex items-center justify-center"
      >
        <Card className="border-2 border-dashed border-border/50 relative overflow-hidden shadow-xl max-w-2xl w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-purple-400/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
          
          <CardContent className="flex flex-col items-center justify-center p-16 text-center relative z-10">
            {isSearching ? (
              <>
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-2xl animate-pulse" />
                  <div className="relative w-28 h-28 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border-4 border-border/50 shadow-2xl">
                    <Search className="h-14 w-14 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="font-black text-3xl mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  No quizzes found
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md text-lg leading-relaxed">
                  Try adjusting your search terms or filters to discover more quizzes.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()} size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all rounded-xl px-8">
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-2xl animate-pulse" />
                  <div className="relative w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center border-4 border-border/50 shadow-2xl">
                    <Sparkles className="h-16 w-16 text-primary animate-pulse" />
                  </div>
                </div>
                <h3 className="font-black text-4xl mb-3 bg-gradient-to-r from-primary via-purple-600 to-secondary bg-clip-text text-transparent">
                  Ready to start learning?
                </h3>
                <p className="text-muted-foreground mb-10 max-w-lg text-lg leading-relaxed">
                  Create your first quiz and begin your journey of knowledge discovery with AI-powered learning.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                    <Button
                      onClick={onCreateQuiz}
                      size="lg"
                      className="relative gap-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-xl hover:shadow-2xl transition-all px-8 py-6 text-base font-bold rounded-xl"
                    >
                      <Plus className="h-5 w-5" />
                      Create Your First Quiz
                    </Button>
                  </div>
                  <Button variant="outline" onClick={() => window.location.reload()} size="lg" className="gap-3 shadow-lg hover:shadow-xl transition-all px-8 py-6 text-base font-semibold rounded-xl border-2">
                    <TrendingUp className="h-5 w-5" />
                    Explore Quizzes
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <>
      <BaseListLayout
      title="Browse Quizzes"
      description="Master any topic with AI-powered interactive quizzes"
      icon={<Brain className="h-6 w-6 text-[hsl(var(--primary-foreground))]" />}
      searchValue={localSearch}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search quizzes by title, topic, or difficulty..."
      resultCount={filteredQuizzes.length}
      onCreateClick={onCreateQuiz}
      createButtonText="Create Quiz"
      filterSidebar={
        <div className="space-y-6">
          {/* Quiz Type Filters */}
          <div>
            <h4 className="text-lg font-black text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-[hsl(var(--primary))]" />
              Quiz Types
            </h4>
            <TooltipProvider>
              <div className="space-y-3">
                {Object.entries(QUIZ_TYPE_CONFIG).map(([type, config]) => {
                  const IconComponent = config.icon
                  const normalizedType = type as QuizType
                  const isSelected = currentSelectedTypes.includes(normalizedType)
                  const count = quizCounts ? (quizCounts as any)[type] : undefined
                  return (
                    <Tooltip key={type}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => toggleQuizType(normalizedType)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-2xl border-4 px-4 py-3 text-sm font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 hover:scale-105 shadow-[4px_4px_0_0_rgba(0,0,0,0.9)]",
                            isSelected
                              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary-foreground))]"
                              : "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]"
                          )}
                          aria-pressed={isSelected}
                        >
                          <div className={cn(
                            "p-2 rounded-xl",
                            isSelected ? "bg-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--muted))]"
                          )}>
                            <IconComponent className={cn("h-5 w-5", isSelected ? config.color : "text-[hsl(var(--muted-foreground))]")} />
                          </div>
                          <div className="flex-1 text-left">
                            <span>{config.label}</span>
                            {typeof count === "number" && (
                              <span className="ml-2 text-xs bg-[hsl(var(--muted))] px-2 py-1 rounded-lg">
                                {count}
                              </span>
                            )}
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{config.label} Quizzes</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </TooltipProvider>
          </div>

          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div>
              <h4 className="text-lg font-black text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-[hsl(var(--primary))]" />
                View Mode
              </h4>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onViewModeChange("grid")}
                  className="flex-1 border-2 shadow-[2px_2px_0_0_rgba(0,0,0,0.9)]"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onViewModeChange("list")}
                  className="flex-1 border-2 shadow-[2px_2px_0_0_rgba(0,0,0,0.9)]"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
          )}
        </div>
      }
      contentGrid={
        <div className="space-y-8">
          {/* Sort & Clear - Modern Design */}
          <div className="flex items-center gap-3 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default" className="gap-2 h-11 px-5 text-sm font-semibold bg-background/90 backdrop-blur-sm border-2 border-border hover:border-primary/50 shadow-md hover:shadow-lg transition-all rounded-xl">
                  <SlidersHorizontal className="h-4 w-4" />
                  Sort
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl border-2 shadow-xl">
                <DropdownMenuItem
                  onClick={() => setSortBy("default")}
                  className={cn(sortBy === "default" && "bg-primary/10 text-primary", "text-sm font-medium rounded-lg")}
                >
                  <Star className="mr-3 h-4 w-4" />
                  Default Order
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("title")}
                  className={cn(sortBy === "title" && "bg-primary/10 text-primary", "text-sm font-medium rounded-lg")}
                >
                  <BookOpen className="mr-3 h-4 w-4" />
                  Alphabetical (A-Z)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            {(currentSearch || currentSelectedTypes.length > 0 || sortBy !== "default") && (
              <Button variant="ghost" size="default" onClick={clearFilters} className="gap-2 h-11 px-5 text-sm font-semibold hover:bg-destructive/10 hover:text-destructive transition-all rounded-xl shadow-md">
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* Quiz Grid - Enhanced Spacing */}
          <div
            className={cn(
              "grid gap-8 md:gap-10",
              viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 max-w-4xl mx-auto",
            )}
          >
            {/* Removed LayoutGroup, AnimatePresence, and motion.div for individual items for performance */}
            {filteredQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                title={quiz.title}
                description={quiz.title}
                questionCount={quiz.questionCount || 0}
                isPublic={quiz.isPublic}
                slug={quiz.slug}
                quizType={quiz.quizType as QuizType}
                estimatedTime={getEstimatedTime(quiz.questionCount || 0)}
                completionRate={Math.min(Math.max(quiz.bestScore || 0, 0), 100)}
                compact={viewMode === "list"}
                userId={quiz.userId}
                currentUserId={currentUserId}
                showActions={showActions}
                onDelete={handleDeleteQuiz}
                onTypeClick={onTypeClick}
                selectedTypes={selectedTypes}
                activeFilter={activeFilter}
              />
            ))}
          </div>

          {/* Loading more - Enhanced */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-12">
              <div className="flex items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-border/50 shadow-lg backdrop-blur-sm">
                <div className="relative">
                  <div className="w-6 h-6 border-3 border-primary border-r-transparent rounded-full animate-spin" aria-hidden="true" />
                  <div className="absolute inset-0 w-6 h-6 border-3 border-primary/20 border-r-transparent rounded-full animate-ping" aria-hidden="true" />
                </div>
                <span className="text-base font-semibold text-foreground">Loading more quizzes...</span>
              </div>
            </div>
          )}

          {/* End message - Enhanced */}
          {!hasNextPage && quizzes.length > 0 && (
            <div ref={endMessageRef} className="text-center py-12">
              <div className="relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl border-2 border-border/50 shadow-xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 group-hover:opacity-80 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Sparkles className="relative h-5 w-5 text-primary animate-pulse" />
                <span className="relative text-base font-bold text-foreground">You've seen them all! 🎉</span>
              </div>
            </div>
          )}
        </div>
      }
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Quiz"
        description={
          quizToDelete ? (
            <>
              Are you sure you want to delete <strong>{quizToDelete.title}</strong>? This action cannot be undone.
            </>
          ) : (
            "Are you sure you want to delete this quiz?"
          )
        }
        confirmLabel="Delete Quiz"
        isLoading={deleteQuizMutation.isPending}
      />
    </>
  )
}

export const QuizList = memo(QuizListComponent)
