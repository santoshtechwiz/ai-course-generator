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
    <div className="relative space-y-8">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border border-border/50 shadow-lg">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-400/30 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative px-6 py-8 md:px-8 md:py-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Header Content */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-50 animate-pulse" />
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                    <Brain className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                    Discover Quizzes
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">Master any topic with AI-powered interactive quizzes</p>
                </div>
              </div>

              {/* Stats Row - Redesigned */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl blur-md group-hover:blur-lg transition-all" />
                  <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <FileQuestion className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-foreground">{filteredQuizzes.length}</div>
                      <div className="text-xs text-muted-foreground font-semibold">Active Quizzes</div>
                    </div>
                  </div>
                </div>

                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl blur-md group-hover:blur-lg transition-all" />
                  <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-foreground">{Object.keys(QUIZ_TYPE_CONFIG).length}</div>
                      <div className="text-xs text-muted-foreground font-semibold">Quiz Types</div>
                    </div>
                  </div>
                </div>

                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl blur-md group-hover:blur-lg transition-all" />
                  <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-foreground">AI</div>
                      <div className="text-xs text-muted-foreground font-semibold">Powered</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Redesigned */}
            <div className="flex items-center gap-3">
              {onViewModeChange && (
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={onViewModeChange}
                  className="bg-background/90 backdrop-blur-sm border-2 border-border/50 shadow-lg rounded-xl p-1"
                >
                  <ToggleGroupItem
                    value="grid"
                    aria-label="Grid view"
                    className="data-[state=on]:bg-gradient-to-br data-[state=on]:from-primary data-[state=on]:to-primary/80 data-[state=on]:text-primary-foreground data-[state=on]:shadow-md h-10 w-10 rounded-lg transition-all hover:scale-105"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="list"
                    aria-label="List view"
                    className="data-[state=on]:bg-gradient-to-br data-[state=on]:from-primary data-[state=on]:to-primary/80 data-[state=on]:text-primary-foreground data-[state=on]:shadow-md h-10 w-10 rounded-lg transition-all hover:scale-105"
                  >
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              )}

              {onCreateQuiz && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                  <Button
                    onClick={onCreateQuiz}
                    size="default"
                    className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200 h-10 px-6 text-sm font-bold rounded-xl"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create Quiz
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="space-y-6">
          {/* Search Bar - Modern Redesign */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="absolute left-5 top-1/2 transform -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <Search className="h-5 w-5 text-primary" />
                </div>
              </div>
              <Input
                placeholder="Search quizzes by title, topic, or difficulty..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-16 pl-20 pr-24 text-base font-medium bg-background/90 backdrop-blur-md border-2 border-border/50 hover:border-primary/30 focus:border-primary/50 shadow-lg hover:shadow-xl focus:shadow-2xl transition-all duration-200 rounded-2xl"
                aria-label="Search quizzes"
                autoComplete="off"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {localSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSearchChange("")}
                    className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive rounded-full transition-all hover:scale-110"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Badge
                  variant="secondary"
                  className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm font-bold bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 shadow-md"
                >
                  <FileQuestion className="h-3.5 w-3.5 mr-1" />
                  {filteredQuizzes.length}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* Quiz Type Filters - Modern Pill Design */}
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
                            "group relative flex items-center gap-3 rounded-2xl border-2 px-5 py-3 text-sm font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 overflow-hidden hover:scale-105 hover:-translate-y-0.5 active:scale-95 shadow-md hover:shadow-xl",
                            config.pill,
                            isSelected
                              ? "ring-2 ring-primary shadow-lg border-primary/50 bg-gradient-to-br scale-105"
                              : "hover:bg-muted/60 hover:border-primary/40 bg-background/80 backdrop-blur-sm",
                          )}
                          aria-pressed={isSelected}
                        >
                          {/* Glow effect on hover */}
                          <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl", config.gradient || "bg-gradient-to-br from-primary/20 to-accent/20")} />
                          
                          <div className="relative flex items-center gap-3">
                            <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", isSelected ? config.bg : "bg-muted/50")}>
                              <IconComponent className={cn("h-5 w-5", config.color)} />
                            </div>
                            <span className="whitespace-nowrap flex items-center gap-2">
                              {config.label}
                              {typeof count === "number" && (
                                <span className={cn("inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-black border-2 shadow-sm transition-all", isSelected ? "bg-primary text-primary-foreground border-primary-foreground/20 scale-110" : "bg-background border-border/60")} aria-hidden>
                                  {count}
                                </span>
                              )}
                            </span>
                            {isSelected && (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shadow-lg animate-in zoom-in-50">
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
          </div>
        </div>

        {/* Quiz Grid - Enhanced Spacing */}
        <div
          className={cn(
            "grid gap-6 md:gap-7",
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 max-w-5xl mx-auto",
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
