"use client"
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
import { cn, getColorClasses } from "@/lib/utils"

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
  const { buttonPrimary, buttonSecondary, cardSecondary } = getColorClasses()
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<QuizType[]>([])
  const [questionCountRange, setQuestionCountRange] = useState<[number, number]>([0, 50])
  const [showPublicOnly, setShowPublicOnly] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("default")
  const [difficulty, setDifficulty] = useState<string[]>([])
  const [duration, setDuration] = useState<string[]>([])
  const [category, setCategory] = useState<string>("")

  const debouncedSearch = useDebounce(search, 300)
  const { ref, inView } = useInView({ threshold: 0.1 })

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const preferences = {
        tab: localStorage.getItem("quiz_active_tab"),
        view: localStorage.getItem("quiz_view_mode") as "grid" | "list" | null,
        search: localStorage.getItem("quiz_search"),
        types: localStorage.getItem("quiz_types"),
        sort: localStorage.getItem("quiz_sort"),
        difficulty: localStorage.getItem("quiz_difficulty"),
        duration: localStorage.getItem("quiz_duration"),
        category: localStorage.getItem("quiz_category"),
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

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const preferences = {
        quiz_active_tab: activeTab,
        quiz_view_mode: viewMode,
        quiz_search: search,
        quiz_types: selectedTypes.join(","),
        quiz_sort: sortBy,
        quiz_difficulty: difficulty.join(","),
        quiz_duration: duration.join(","),
        quiz_category: category,
      }

      Object.entries(preferences).forEach(([key, value]) => {
        localStorage.setItem(key, value)
      })
    } catch (error) {
      console.warn("Failed to save quiz preferences:", error)
    }
  }, [activeTab, viewMode, search, selectedTypes, sortBy, difficulty, duration, category])

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
      category,
    ],
    [
      debouncedSearch,
      selectedTypes,
      userId,
      questionCountRange,
      showPublicOnly,
      activeTab,
      sortBy,
      difficulty,
      duration,
      category,
    ],
  )

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery(
    {
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
          })

          if (result.error) throw new Error(result.error)

          return {
            quizzes: result?.quizzes || [],
            nextCursor: result?.nextCursor ?? null,
          }
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            console.error("Failed to fetch quizzes:", err)
          }
          throw err
        }
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: 1,
      initialData: initialQuizzesData ? { pages: [initialQuizzesData], pageParams: [1] } : undefined,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.name === "AbortError" || error?.message?.includes("cancelled")) {
          return false
        }
        return failureCount < 2
      },
    },
  )

  const { data: quizCountsData } = useQuery({
    queryKey: ["quiz-counts", userId],
    queryFn: () => getQuizCountsByType(userId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

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
        })
      }
    }
    return result
  }, [])

  const rawQuizzes = extractQuizzes(data)
  const quizzes = useMemo(() => dedupeById(rawQuizzes), [rawQuizzes, dedupeById])

  const noResults = !isLoading && !isError && quizzes.length === 0
  const isSearching =
    debouncedSearch.trim() !== "" ||
    selectedTypes.length > 0 ||
    questionCountRange[0] > 0 ||
    questionCountRange[1] < 50 ||
    showPublicOnly ||
    activeTab !== "all" ||
    difficulty.length > 0 ||
    duration.length > 0 ||
    category !== ""

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isLoading && !isError && !noResults && quizzes.length > 0) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage, isError, noResults, quizzes.length])

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

  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
      <Card className={cn(cardSecondary, "border-destructive/50 bg-destructive/5 rounded-xl")}>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <div
            className={cn(
              "w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mb-6 border-3 border-border neo-shadow",
            )}
          >
            <AlertCircle className="h-10 w-10 text-destructive" strokeWidth={3} />
          </div>
          <h3 className="font-black text-2xl mb-3">Oops! Something went wrong</h3>
          <p className="text-sm text-muted-foreground font-bold mb-8 max-w-sm">
            {error.message || "We encountered an unexpected error while loading quizzes. Please try again."}
          </p>
          <div className="flex gap-4">
            <Button onClick={resetErrorBoundary} className={cn(buttonSecondary, "rounded-xl")}>
              <RefreshCw className="mr-2 h-5 w-5" strokeWidth={2.5} />
              Try Again
            </Button>
            <Button onClick={handleCreateQuiz} className={cn(buttonPrimary, "rounded-xl")}>
              <Sparkles className="mr-2 h-5 w-5" strokeWidth={2.5} />
              Create Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <ErrorBoundary fallbackRender={ErrorFallback} onReset={handleRetry} resetKeys={[queryKey.join("")]}>
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

          <div ref={ref} className="h-20" />
        </ErrorBoundary>

        {/* Quick action FAB for mobile */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
          className="fixed bottom-6 right-6 z-50 lg:hidden"
        >
          <Button onClick={handleCreateQuiz} size="lg" className={cn(buttonPrimary, "w-16 h-16 rounded-2xl")}>
            <Zap className="h-7 w-7" strokeWidth={3} />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

const EnhancedQuizzesClient = EnhancedQuizzesClientComponent
export default EnhancedQuizzesClient
