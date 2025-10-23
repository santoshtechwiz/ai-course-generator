"use client"

import { memo, useMemo, useState, useCallback, useEffect, startTransition } from "react"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import { useInView } from "react-intersection-observer"
import {
  AlertCircle,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  X,
  SlidersHorizontal,
  ChevronDown,
  TrendingUp,
  Star,
  BookOpen,
} from "lucide-react"
import { QuizCard } from "./QuizCard"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn, getColorClasses } from "@/lib/utils"
import {
  cardVariants,
  staggerContainerVariants,
  staggerItemVariants,
  badgeVariants,
  fadeInUp
} from "@/utils/animation-utils"
import type { QuizListItem } from "@/app/actions/getQuizes"
import type { QuizType } from "@/app/types/quiz-types"
import { QuizSidebar } from "./QuizSidebar"
import { Card, CardContent } from "@/components/ui/card"
import { useDeleteQuiz } from "@/hooks/use-delete-quiz"
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { QuizTypeIcons } from "./quiz-type-icons"

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

const containerVariants = staggerContainerVariants
const itemVariants = staggerItemVariants

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
  const { buttonPrimary, buttonSecondary, buttonIcon, cardPrimary, cardSecondary } = getColorClasses()

  const [endMessageRef, endMessageInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quizToDelete, setQuizToDelete] = useState<{ slug: string; title: string; quizType: QuizType } | null>(null)

  const [localSearch, setLocalSearch] = useState("")
  const [localSelectedTypes, setLocalSelectedTypes] = useState<QuizType[]>([])
  const [sortBy, setSortBy] = useState<"title" | "default">("default")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(localSearch)
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch])

  const currentSearch = search || debouncedSearch
  const currentSelectedTypes = selectedTypes.length > 0 ? selectedTypes : localSelectedTypes

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
    if (!quizzes || quizzes.length === 0) return []

    let list = [...quizzes]

    if (currentSearch && currentSearch.trim() !== "") {
      const term = currentSearch.trim().toLowerCase()
      list = list.filter((quiz) => {
        const title = quiz.title?.toLowerCase() || ""
        const description = (quiz as any).description?.toLowerCase() || ""
        return title.includes(term) || description.includes(term)
      })
    }

    if (currentSelectedTypes && currentSelectedTypes.length > 0) {
      list = list.filter((quiz) => currentSelectedTypes.includes(quiz.quizType as QuizType))
    }

    if (showPublicOnly) {
      list = list.filter((quiz) => quiz.isPublic)
    }

    if (activeFilter && activeFilter !== "all") {
      list = list.filter((quiz) => quiz.quizType?.toLowerCase() === activeFilter.toLowerCase())
    }

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
      <Card className={cn(cardSecondary, "border-destructive/50 bg-destructive/5 rounded-xl")}>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <div
            className={cn(
              "h-16 w-16 mb-6 rounded-xl bg-destructive/10",
              "border-3 border-border neo-shadow",
              "flex items-center justify-center",
            )}
          >
            <AlertCircle className="h-8 w-8 text-destructive" strokeWidth={3} />
          </div>
          <h3 className="font-black text-2xl mb-3">Failed to load quizzes</h3>
          <p className="text-sm text-muted-foreground font-bold mb-6 max-w-md">
            We encountered an error while loading your quizzes. Please check your connection and try again.
          </p>
          {onRetry && (
            <Button onClick={onRetry} className={cn(buttonSecondary, "rounded-xl")}>
              <RefreshCw className="mr-2 h-5 w-5" strokeWidth={2.5} />
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
        transition={{ duration: 0.1 }}
        className="min-h-[500px] flex items-center justify-center"
      >
        <Card className={cn(cardSecondary, "border-3 border-dashed border-border max-w-2xl w-full rounded-2xl")}>
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            {isSearching ? (
              <>
                <div className="relative mb-10">
                  <div
                    className={cn(
                      "w-32 h-32 rounded-2xl bg-muted/50",
                      "flex items-center justify-center border-4 border-primary neo-shadow-primary",
                    )}
                  >
                    <Search className="h-16 w-16 text-primary" strokeWidth={3} />
                  </div>
                </div>
                <h3 className="font-black text-4xl mb-4 text-foreground">No quizzes found</h3>
                <p className="text-muted-foreground font-bold mb-10 max-w-md text-lg leading-relaxed">
                  Try adjusting your search terms or filters to discover more quizzes.
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  size="lg"
                  className={cn(buttonSecondary, "gap-2 px-10 py-6 text-base rounded-xl")}
                >
                  <RefreshCw className="mr-2 h-6 w-6" strokeWidth={2.5} />
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <div className="relative mb-10">
                  <div
                    className={cn(
                      "w-36 h-36 rounded-2xl bg-muted/50",
                      "flex items-center justify-center border-4 border-primary neo-shadow-primary",
                      "animate-bounce",
                    )}
                  >
                    <Sparkles className="h-20 w-20 text-primary" strokeWidth={3} />
                  </div>
                </div>
                <h3 className="font-black text-5xl mb-4 text-foreground">Ready to start learning?</h3>
                <p className="text-muted-foreground font-bold mb-12 max-w-lg text-xl leading-relaxed">
                  Create your first quiz and begin your journey of knowledge discovery with AI-powered learning.
                </p>
                <div className="flex flex-col sm:flex-row gap-5">
                  <Button
                    onClick={onCreateQuiz}
                    size="lg"
                    className={cn(buttonPrimary, "gap-3 px-10 py-7 text-lg rounded-xl")}
                  >
                    <Plus className="h-6 w-6" strokeWidth={3} />
                    Create Your First Quiz
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    size="lg"
                    className={cn(buttonSecondary, "gap-3 px-10 py-7 text-lg rounded-xl")}
                  >
                    <TrendingUp className="h-6 w-6" strokeWidth={2.5} />
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
    <div className="flex gap-6">
      {/* Sidebar */}
      <motion.div
        {...fadeInUp(0.1)}
        className="w-80 flex-shrink-0"
      >
        <div className="sticky top-6">
          <QuizSidebar
            search={localSearch}
            onSearchChange={(e) => handleSearchChange(e.target.value)}
            onClearSearch={() => setLocalSearch("")}
            isSearching={isSearching}
            selectedTypes={currentSelectedTypes}
            toggleQuizType={toggleQuizType}
          />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Quick Stats Overview */}
        <motion.div
          {...fadeInUp(0.1)}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="bg-[var(--color-card)] border-4 border-black p-6 rounded-lg shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[var(--color-text)]/70">Total Quizzes</p>
                <p className="text-3xl font-black text-[var(--color-text)]">{quizCounts?.all || 0}</p>
              </div>
              <QuizTypeIcons.total className="h-8 w-8 text-[var(--color-primary)]" />
            </div>
          </div>
          <div className="bg-[var(--color-card)] border-4 border-black p-6 rounded-lg shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[var(--color-text)]/70">MCQ Quizzes</p>
                <p className="text-3xl font-black text-[var(--color-text)]">{quizCounts?.mcq || 0}</p>
              </div>
              <QuizTypeIcons.mcq className="h-8 w-8 text-[var(--color-primary)]" />
            </div>
          </div>
          <div className="bg-[var(--color-card)] border-4 border-black p-6 rounded-lg shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[var(--color-text)]/70">Coding Challenges</p>
                <p className="text-3xl font-black text-[var(--color-text)]">{quizCounts?.code || 0}</p>
              </div>
              <QuizTypeIcons.code className="h-8 w-8 text-[var(--color-primary)]" />
            </div>
          </div>
        </motion.div>

        {/* Search and Controls (sticky) */}
        <motion.div
          {...fadeInUp(0.15)}
          className={cn(
            "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
            "sticky top-0 z-20 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80",
            "py-4"
          )}
        >
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text)]/50 pointer-events-none z-10"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search quizzes..."
              className={cn(
                "flex h-11 w-full rounded-lg border-4 border-black bg-[var(--color-bg)] px-11 py-3 text-sm font-bold shadow-[4px_4px_0_#000] transition-all placeholder:text-[var(--color-text)]/50 focus:shadow-[6px_6px_0_#000] focus:outline-none",
              )}
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search quizzes by title or description"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Sort & Clear */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="default"
                  className={cn("gap-2 h-11 px-6 text-sm font-bold border-4 border-black shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] bg-[var(--color-bg)] text-[var(--color-text)]")}
                >
                  <SlidersHorizontal className="h-5 w-5" strokeWidth={2.5} />
                  Sort
                  <ChevronDown className="h-5 w-5 ml-1" strokeWidth={2.5} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl border-4 border-black shadow-[4px_4px_0_#000] z-[100] bg-[var(--color-card)]">
                <DropdownMenuItem
                  onClick={() => setSortBy("default")}
                  className={cn(sortBy === "default" && "bg-[var(--color-accent)] text-white border-black font-black", "text-sm font-bold rounded-lg")}
                >
                  <Star className="mr-3 h-5 w-5" strokeWidth={2.5} />
                  Default Order
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("title")}
                  className={cn(sortBy === "title" && "bg-[var(--color-accent)] text-white border-black font-black", "text-sm font-bold rounded-lg")}
                >
                  <BookOpen className="mr-3 h-5 w-5" strokeWidth={2.5} />
                  Alphabetical (A-Z)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            {(currentSearch || currentSelectedTypes.length > 0 || sortBy !== "default") && (
              <Button
                variant="ghost"
                size="default"
                onClick={clearFilters}
                className={cn(
                  "gap-2 h-11 px-6 text-sm font-black hover:bg-[var(--color-destructive)] hover:text-white transition-all border-4 border-transparent hover:border-[var(--color-destructive)] shadow-[4px_4px_0_#000] bg-[var(--color-bg)] text-[var(--color-text)]",
                )}
              >
                <X className="h-5 w-5" strokeWidth={3} />
                Clear All
              </Button>
            )}
          </div>
        </motion.div>

        {/* Quiz Grid */}
        <motion.div
          {...fadeInUp(0.2)}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className={cn(
              "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 max-w-[1800px] mx-auto",
            )}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            role="grid"
            aria-label="Grid view of quizzes"
          >
            {filteredQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                variants={itemVariants}
                transition={{ delay: index * 0.02 }}
                role="gridcell"
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
                  compact={false}
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
          </motion.div>

          {/* Loading more */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-12">
              <div className="flex items-center gap-4 px-10 py-5 rounded-xl bg-[var(--color-bg)] border-4 border-black shadow-[4px_4px_0_#000]">
                <div className="relative">
                  <div className="w-7 h-7 border-4 border-black border-r-transparent rounded-full animate-spin" aria-hidden="true" />
                </div>
                <span className="text-base font-black text-[var(--color-text)]">Loading more quizzes...</span>
              </div>
            </div>
          )}

          {/* End message */}
          {!hasNextPage && quizzes.length > 0 && (
            <div ref={endMessageRef} className="text-center py-12">
              <div className="inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-[var(--color-success)] border-4 border-black shadow-[4px_4px_0_#000]">
                <Sparkles className="h-6 w-6 text-white animate-pulse" strokeWidth={3} />
                <span className="text-lg font-black text-white">You've seen them all! 🎉</span>
              </div>
            </div>
          )}
        </motion.div>
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
