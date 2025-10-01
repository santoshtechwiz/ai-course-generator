"use client"

import { memo, useMemo, useState } from "react"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import { useInView } from "react-intersection-observer"
import { AlertCircle, FileQuestion, Search, Plus, RefreshCw, Grid3X3, List, Sparkles, Loader2, Play, Filter, Target, Code2, Brain, FileText, ChevronDown, SlidersHorizontal, Calendar, Star, BookOpen, TrendingUp, X } from "lucide-react"
import { QuizCard } from "./QuizCard"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { QuizListItem } from "@/app/actions/getQuizes"
import type { QuizType } from "@/app/types/quiz-types"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card, CardContent } from "@/components/ui/card"
import { useDeleteQuiz } from "@/hooks/use-delete-quiz"
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog"

// SVG Background Component
const BackgroundSVG = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <svg 
      className="absolute top-0 left-0 w-full h-full opacity-[0.02] dark:opacity-[0.05]" 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="quiz-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1.5" fill="currentColor" />
          <rect x="5" y="5" width="2" height="2" fill="currentColor" opacity="0.3" />
          <rect x="13" y="13" width="2" height="2" fill="currentColor" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#quiz-pattern)" />
    </svg>
    
    {/* Floating geometric shapes */}
    <div className="absolute top-20 left-1/4 w-2 h-2 bg-blue-200 dark:bg-blue-900 rounded-full animate-pulse" />
    <div className="absolute top-40 right-1/3 w-3 h-3 bg-purple-200 dark:bg-purple-900 rounded-sm animate-pulse delay-1000" />
    <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-green-200 dark:bg-green-900 rounded-full animate-pulse delay-2000" />
    <div className="absolute bottom-20 right-1/4 w-3 h-3 bg-orange-200 dark:bg-orange-900 rounded-sm animate-pulse delay-3000" />
  </div>
)

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
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 25 },
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
  const [sortBy, setSortBy] = useState<'title' | 'default'>('default')

  // Quiz type configurations for filters
  const QUIZ_TYPE_CONFIG = {
    MCQ: {
      label: "Multiple Choice",
      icon: Target,
      color: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300",
    },
    CODE: {
      label: "Code Challenge", 
      icon: Code2,
      color: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300",
    },
    FLASHCARD: {
      label: "Flash Cards",
      icon: Brain,
      color: "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300",
    },
    OPEN_ENDED: {
      label: "Open Ended",
      icon: FileText,
      color: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300",
    },
  } as const

  // Use external state if provided, otherwise use local state
  const currentSearch = search || localSearch
  const currentSelectedTypes = selectedTypes.length > 0 ? selectedTypes : localSelectedTypes

  // Filter handlers
  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
  }

  const toggleQuizType = (type: QuizType) => {
    const newTypes = localSelectedTypes.includes(type)
      ? localSelectedTypes.filter(t => t !== type)
      : [...localSelectedTypes, type]
    setLocalSelectedTypes(newTypes)
    onTypeClick?.(type)
  }

  const clearFilters = () => {
    setLocalSearch("")
    setLocalSelectedTypes([])
  setSortBy('default')
  }

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
      list = list.filter((quiz) => 
        quiz.title.toLowerCase().includes(term) ||
        ((quiz as any).description && (quiz as any).description.toLowerCase().includes(term))
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
      list = list.filter((quiz) => quiz.quizType === activeFilter)
    }

    // Sort the results
    if (sortBy === 'title') {
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
        <Card className="border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            {isSearching ? (
              <>
                <Search className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-xl mb-2">No quizzes found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  No matches found. Try different keywords or filters.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-xl mb-2">Ready to start?</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Create your first quiz to test knowledge and skills.
                </p>
                <Button onClick={onCreateQuiz} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Quiz
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="relative space-y-8">
      {/* SVG Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg 
          className="absolute top-0 left-0 w-full h-full opacity-[0.02] dark:opacity-[0.05]" 
          viewBox="0 0 100 100" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="quiz-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1.5" fill="currentColor" />
              <rect x="5" y="5" width="2" height="2" fill="currentColor" opacity="0.3" />
              <rect x="13" y="13" width="2" height="2" fill="currentColor" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#quiz-pattern)" />
        </svg>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-blue-200 dark:bg-blue-900 rounded-full animate-pulse" />
        <div className="absolute top-40 right-1/3 w-3 h-3 bg-purple-200 dark:bg-purple-900 rounded-sm animate-pulse delay-1000" />
        <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-green-200 dark:bg-green-900 rounded-full animate-pulse delay-2000" />
        <div className="absolute bottom-20 right-1/4 w-3 h-3 bg-orange-200 dark:bg-orange-900 rounded-sm animate-pulse delay-3000" />
      </div>
      
      <div className="relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">
            Discover Quizzes
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredQuizzes.length} quizzes{filteredQuizzes.length !== 1 ? "s" : ""} available
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onViewModeChange && (
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={onViewModeChange}
              className="bg-card border border-border/50"
            >
              <ToggleGroupItem value="grid" aria-label="Grid view" className="data-[state=on]:bg-muted">
                <Grid3X3 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view" className="data-[state=on]:bg-muted">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          
          {onCreateQuiz && (
            <Button onClick={onCreateQuiz} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Filter Section */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            value={currentSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-background/50 backdrop-blur-sm"
          />
          {currentSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearchChange("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Quiz Type Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(QUIZ_TYPE_CONFIG).map(([type, config]) => {
            const IconComponent = config.icon
            const isSelected = currentSelectedTypes.includes(type as QuizType)
            return (
              <Button
                key={type}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => toggleQuizType(type as QuizType)}
                className={cn(
                  "transition-all",
                  isSelected && config.color
                )}
              >
                <IconComponent className="mr-2 h-4 w-4" />
                {config.label}
              </Button>
            )
          })}
        </div>

        {/* Simple sort toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortBy(prev => prev === 'title' ? 'default' : 'title')}
        >
          {sortBy === 'title' ? 'Clear Sort' : 'Sort A-Z'}
        </Button>

        {/* Clear Filters */}
        {(currentSearch || currentSelectedTypes.length > 0 || sortBy !== 'default') && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      <motion.div
        className={cn(
          "grid gap-6",
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 max-w-4xl",
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
              </motion.div>
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>

      {/* Loading more */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin" aria-hidden="true" />
            <span className="sr-only">Loading more quizzes</span>
          </div>
        </div>
      )}

      {/* End message */}
      {!hasNextPage && quizzes.length > 0 && (
        <motion.div
          ref={endMessageRef}
          initial={{ opacity: 0, y: 20 }}
          animate={endMessageInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-full border border-border/50">
            <Sparkles className="h-4 w-4" />
            You've seen them all!
          </div>
        </motion.div>
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
