"use client"

import { memo, useMemo, useState, useCallback, useEffect } from "react"
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
  ChevronDown,
  SlidersHorizontal,
  Star,
  BookOpen,
  TrendingUp,
  X,
} from "lucide-react"
import { QuizCard } from "./QuizCard"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { QuizListItem } from "@/app/actions/getQuizes"
import type { QuizType } from "@/app/types/quiz-types"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { QUIZ_TYPE_CONFIG } from "./quiz-type-config"
import { Card, CardContent } from "@/components/ui/card"
import { useDeleteQuiz } from "@/hooks/use-delete-quiz"
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog"

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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localSearch)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [localSearch])

  // Use external state if provided, otherwise use local state
  const currentSearch = search || debouncedSearch
  const currentSelectedTypes = selectedTypes.length > 0 ? selectedTypes : localSelectedTypes

  // Filter handlers
  const handleSearchChange = useCallback((value: string) => {
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

  const filteredQuizzes = useMemo(() => {
    let list = quizzes || []

    // Search term filter
    if (currentSearch && currentSearch.trim() !== "") {
      const term = currentSearch.trim().toLowerCase()
      list = list.filter(
        (quiz) =>
          quiz.title.toLowerCase().includes(term) ||
          ((quiz as any).description && (quiz as any).description.toLowerCase().includes(term)),
      )
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
      >
        <Card className="border-dashed border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          <CardContent className="flex flex-col items-center justify-center p-12 text-center relative">
            {isSearching ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6"
                >
                  <Search className="h-10 w-10 text-muted-foreground" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-semibold text-xl mb-2"
                >
                  No quizzes found
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground mb-6 max-w-md"
                >
                  Try adjusting your search terms or filters to discover more quizzes.
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-6"
                >
                  <Sparkles className="h-12 w-12 text-primary" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-semibold text-2xl mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                >
                  Ready to start learning?
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground mb-8 max-w-md"
                >
                  Create your first quiz and begin your journey of knowledge discovery.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <Button
                    onClick={onCreateQuiz}
                    className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Quiz
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Explore Quizzes
                  </Button>
                </motion.div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="relative space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border border-border/50">
        <div className="relative px-4 py-6 md:px-6 md:py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Header Content */}
            <div className="space-y-2 flex-1">
              {/* Removed motion from here as animations are simplified */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                    Discover Quizzes
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Test your knowledge with interactive quizzes</p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                    <FileQuestion className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{filteredQuizzes.length}</div>
                    <div className="text-[10px] text-muted-foreground">Quizzes</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                    <Target className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{Object.keys(QUIZ_TYPE_CONFIG).length}</div>
                    <div className="text-[10px] text-muted-foreground">Types</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">AI-Powered</div>
                    <div className="text-[10px] text-muted-foreground">Learning</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {/* Removed motion from here as animations are simplified */}
            <div className="flex items-center gap-2">
              {onViewModeChange && (
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={onViewModeChange}
                  className="bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm"
                >
                  <ToggleGroupItem
                    value="grid"
                    aria-label="Grid view"
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-8 w-8"
                  >
                    <Grid3X3 className="h-3.5 w-3.5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="list"
                    aria-label="List view"
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-8 w-8"
                  >
                    <List className="h-3.5 w-3.5" />
                  </ToggleGroupItem>
                </ToggleGroup>
              )}

              {onCreateQuiz && (
                <Button
                  onClick={onCreateQuiz}
                  size="default"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-8 text-xs"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Quiz
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="space-y-4 md:space-y-5">
          {/* Search Bar with Enhanced Design */}
          <div className="relative">
            <div className="relative w-full">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                placeholder="Search quizzes by title or topic..."
                value={currentSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-12 md:h-14 pl-12 pr-20 text-base bg-background/80 backdrop-blur-sm border-border/50 shadow-sm focus:shadow-md transition-all duration-200 rounded-xl"
                aria-label="Search quizzes"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {currentSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSearchChange("")}
                    className="h-8 w-8 p-0 hover:bg-muted rounded-full"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Badge
                  variant="secondary"
                  className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-semibold"
                >
                  {filteredQuizzes.length}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Quiz Type Filters - Enhanced Size and Clarity */}
            <TooltipProvider>
              <div className="flex items-center gap-3 flex-wrap">
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
                            "flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 relative overflow-hidden hover:scale-105 active:scale-95",
                            config.pill,
                            isSelected
                              ? "ring-2 ring-primary shadow-md border-primary/50 bg-primary/10"
                              : "hover:bg-muted/60 hover:border-primary/30",
                          )}
                          aria-pressed={isSelected}
                        >
                          <div className="relative flex items-center gap-2">
                            <IconComponent className={cn("h-4 w-4", config.color)} />
                            <span className="whitespace-nowrap flex items-center gap-2">
                              {config.label}
                              {typeof count === "number" && (
                                <span
                                  className={cn(
                                    "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold border",
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-background/80 border-border/60",
                                  )}
                                >
                                  {count}
                                </span>
                              )}
                            </span>
                            {isSelected && (
                              <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="text-center">
                          <p className="font-medium text-sm">{config.label} Quizzes</p>
                          {typeof count === "number" && (
                            <p className="text-xs text-muted-foreground mt-1 font-semibold">{count} available</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </TooltipProvider>

            {/* Enhanced Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default" className="gap-2 h-10 text-sm bg-background/80 border-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Sort
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setSortBy("default")}
                  className={cn(sortBy === "default" && "bg-muted", "text-sm")}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Default Order
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("title")}
                  className={cn(sortBy === "title" && "bg-muted", "text-sm")}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Alphabetical (A-Z)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            {(currentSearch || currentSelectedTypes.length > 0 || sortBy !== "default") && (
              <Button variant="ghost" size="default" onClick={clearFilters} className="gap-2 h-10 text-sm">
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div
          className={cn(
            "grid gap-4 md:gap-5 mt-6",
            viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 max-w-4xl",
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

        {/* Loading more */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div
                className="w-5 h-5 border-2 border-primary border-r-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              <span>Loading more quizzes...</span>
            </div>
          </div>
        )}

        {/* End message */}
        {!hasNextPage && quizzes.length > 0 && (
          <div ref={endMessageRef} className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-full border border-border/50">
              <Sparkles className="h-4 w-4" />
              You've seen them all!
            </div>
          </div>
        )}
      </div>

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
    </div>
  )
}

export const QuizList = memo(QuizListComponent)
