"use client"

import type React from "react"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/useDebounce"
import { useInView } from "react-intersection-observer"
import { ErrorBoundary } from "react-error-boundary"
import { AlertCircle, RefreshCw, Sparkles, Zap } from "lucide-react"
import type { QuizType } from "@/app/types/quiz-types"
import type { QuizListItem } from "@/app/actions/getQuizes"
import { getQuizzes, getQuizCountsByType } from "@/app/actions/getQuizes"
import { QuizList } from "./QuizList"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

interface EnhancedQuizzesClientProps {
  initialQuizzesData: {
    quizzes: QuizListItem[]
    nextCursor: number | null
  }
  userId?: string
}

function extractQuizzes(data: any): QuizListItem[] {
  if (!data?.pages) return []
  return data.pages.flatMap((page: any) => page?.quizzes || [])
}

function EnhancedQuizzesClientComponent({ initialQuizzesData, userId }: EnhancedQuizzesClientProps) {
  const router = useRouter()

  // Enhanced state with better defaults
  const [search, setSearch] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<QuizType[]>([])
  const [questionCountRange, setQuestionCountRange] = useState<[number, number]>([0, 50])
  const [showPublicOnly, setShowPublicOnly] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  // Local-only sort preference placeholder (not sent to API)
  const [sortBy, setSortBy] = useState('default')
  const [difficulty, setDifficulty] = useState<string[]>([])
  const [duration, setDuration] = useState<string[]>([])
  const [category, setCategory] = useState<string>("")

  const debouncedSearch = useDebounce(search, 300)
  const { ref, inView } = useInView({ threshold: 0.1 })

  // Enhanced local storage with error handling
  useEffect(() => {
    // Skip localStorage access on server-side
    if (typeof window === 'undefined') return

    try {
      const preferences = {
        tab: localStorage.getItem("quiz_active_tab"),
        view: localStorage.getItem("quiz_view_mode") as "grid" | "list" | null,
        search: localStorage.getItem("quiz_search"),
        types: localStorage.getItem("quiz_types"),
        sort: localStorage.getItem("quiz_sort"),
        difficulty: localStorage.getItem("quiz_difficulty"),
        duration: localStorage.getItem("quiz_duration"),
        category: localStorage.getItem("quiz_category")
      }

      if (preferences.tab) setActiveTab(preferences.tab)
      if (preferences.view === "grid" || preferences.view === "list") setViewMode(preferences.view)
      if (typeof preferences.search === "string") setSearch(preferences.search)
      if (preferences.sort) setSortBy(preferences.sort)
      if (preferences.category) setCategory(preferences.category)
      
      if (preferences.types) {
        const types = preferences.types.split(",").filter(Boolean) as QuizType[]
        if (types.length > 0) setSelectedTypes(types)
      }
      
      if (preferences.difficulty) {
        const diff = preferences.difficulty.split(",").filter(Boolean)
        if (diff.length > 0) setDifficulty(diff)
      }
      
      if (preferences.duration) {
        const dur = preferences.duration.split(",").filter(Boolean)
        if (dur.length > 0) setDuration(dur)
      }
    } catch (error) {
      console.warn("Failed to load quiz preferences:", error)
    }
  }, [])

  // Enhanced preference persistence
  useEffect(() => {
    // Skip localStorage access on server-side
    if (typeof window === 'undefined') return

    try {
      const preferences = {
        "quiz_active_tab": activeTab,
        "quiz_view_mode": viewMode,
        "quiz_search": search,
        "quiz_types": selectedTypes.join(","),
        "quiz_sort": sortBy,
        "quiz_difficulty": difficulty.join(","),
        "quiz_duration": duration.join(","),
        "quiz_category": category
      }

      Object.entries(preferences).forEach(([key, value]) => {
        localStorage.setItem(key, value)
      })
    } catch (error) {
      console.warn("Failed to save quiz preferences:", error)
    }
  }, [activeTab, viewMode, search, selectedTypes, sortBy, difficulty, duration, category])

  // Enhanced query key with all filters
  const queryKey = useMemo(
    () => [
      "quizzes-enhanced",
      debouncedSearch,
      selectedTypes.join(","),
      userId,
      questionCountRange.join("-"),
      showPublicOnly,
      activeTab,
      sortBy,
      difficulty.join(","),
      duration.join(","),
      category
    ],
    [debouncedSearch, selectedTypes, userId, questionCountRange, showPublicOnly, activeTab, sortBy, difficulty, duration, category],
  )

  // Enhanced infinite query with better error handling
  const { 
    data, 
    isLoading, 
    isError, 
    error,
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    refetch 
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1, signal }) => {
      if (signal?.aborted) {
        throw new Error("Query was cancelled")
      }

      try {
        const result = await getQuizzes({
          page: pageParam as number,
          limit: 12,
          searchTerm: debouncedSearch,
          userId,
          quizTypes: selectedTypes.length > 0 ? selectedTypes : null,
          minQuestions: questionCountRange[0],
          maxQuestions: questionCountRange[1],
          publicOnly: showPublicOnly,
          tab: activeTab,
          // Additional filters (not yet supported server-side) are omitted from params to avoid TS errors
          // sortBy,
          // difficulty,
          // duration,
          // category
        })

        if (result.error) throw new Error(result.error)
        
        return {
          quizzes: result?.quizzes || [],
          nextCursor: result?.nextCursor ?? null,
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Failed to fetch quizzes:", err)
        }
        throw err
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 1,
    initialData: initialQuizzesData ? { pages: [initialQuizzesData], pageParams: [1] } : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error?.name === "AbortError" || error?.message?.includes("cancelled")) {
        return false
      }
      return failureCount < 2 // Retry up to 2 times
    },
  })

  // Query for total quiz counts by type
  const { data: quizCountsData } = useQuery({
    queryKey: ['quiz-counts', userId],
    queryFn: () => getQuizCountsByType(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  // Enhanced deduplication
  const dedupeById = useCallback((items: QuizListItem[]) => {
    const seen = new Set<string>()
    const result: QuizListItem[] = []
    
    for (const quiz of items || []) {
      const key = String(quiz.id || quiz.slug || "")
      if (!key) continue
      if (!seen.has(key)) {
        seen.add(key)
        result.push({
          ...quiz,
          // Augmented client-only fields intentionally omitted to satisfy strict typing
        })
      }
    }
    return result
  }, [])

  const rawQuizzes = extractQuizzes(data)
  const quizzes = useMemo(() => dedupeById(rawQuizzes), [rawQuizzes, dedupeById])

  const noResults = !isLoading && !isError && quizzes.length === 0
  const isSearching = debouncedSearch.trim() !== "" || selectedTypes.length > 0 || 
                     questionCountRange[0] > 0 || questionCountRange[1] < 50 || 
                     showPublicOnly || activeTab !== "all" || difficulty.length > 0 || 
                     duration.length > 0 || category !== ""

  // Auto-load more when in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isLoading && !isError && !noResults && quizzes.length > 0) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage, isError, noResults, quizzes.length])

  // Enhanced event handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearch("")
    setSelectedTypes([])
    setQuestionCountRange([0, 50])
    setShowPublicOnly(false)
    setActiveTab("all")
    setSortBy("popularity")
    setDifficulty([])
    setDuration([])
    setCategory("")
  }, [])

  const toggleQuizType = useCallback((type: QuizType) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }, [])

  const handleCreateQuiz = useCallback(() => {
    router.push("/dashboard/mcq")
  }, [router])

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  const handleQuizDeleted = useCallback(() => {
    refetch()
  }, [refetch])

  // Enhanced error fallback component
  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Oops! Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {error.message || "We encountered an unexpected error while loading quizzes. Please try again."}
          </p>
          <div className="flex gap-3">
            <Button onClick={resetErrorBoundary} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={handleCreateQuiz} className="bg-primary hover:bg-primary/90">
              <Sparkles className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <ErrorBoundary 
          fallbackRender={ErrorFallback} 
          onReset={handleRetry} 
          resetKeys={[queryKey.join("")]}
        >
          <QuizList
            quizzes={quizzes}
            isLoading={isLoading}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={!!hasNextPage}
            isSearching={isSearching}
            onRetry={handleRetry}
            onCreateQuiz={handleCreateQuiz}
            currentUserId={userId}
            onQuizDeleted={handleQuizDeleted}
            quizCounts={{
              all: quizCountsData ? Object.values(quizCountsData).reduce((sum, count) => sum + count, 0) : 0,
              mcq: quizCountsData?.mcq || 0,
              openended: quizCountsData?.openended || 0,
              code: quizCountsData?.code || 0,
              blanks: quizCountsData?.blanks || 0,
              flashcard: quizCountsData?.flashcard || 0,
            }}
          />
          
          {/* Load more trigger */}
          <div ref={ref} className="h-20 flex items-center justify-center">
            {isFetchingNextPage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-sm text-muted-foreground bg-white dark:bg-gray-900 px-4 py-2 rounded-full shadow-sm"
              >
                <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin" />
                <span>Loading more amazing quizzes...</span>
              </motion.div>
            )}
          </div>
        </ErrorBoundary>
        
        {/* Quick action FAB for mobile */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
          className="fixed bottom-6 right-6 z-50 lg:hidden"
        >
          <Button 
            onClick={handleCreateQuiz}
            size="lg"
            className="w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 hover:scale-110 transition-all"
          >
            <Zap className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

export const EnhancedQuizzesClient = EnhancedQuizzesClientComponent
export default EnhancedQuizzesClient
