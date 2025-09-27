"use client"

import type React from "react"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/useDebounce"
import { useInView } from "react-intersection-observer"
import { ErrorBoundary } from "react-error-boundary"
import { AlertCircle, RefreshCw, Search } from "lucide-react"
import type { QuizType } from "@/app/types/quiz-types"
import type { QuizListItem } from "@/app/actions/getQuizes"
import { getQuizzes } from "@/app/actions/getQuizes"
import { QuizSidebar } from "./QuizSidebar"
import { QuizList } from "./QuizList"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface QuizzesClientProps {
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

function QuizzesClientComponent({ initialQuizzesData, userId }: QuizzesClientProps) {
  const router = useRouter()

  // State
  const [search, setSearch] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<QuizType[]>([])
  const [questionCountRange, setQuestionCountRange] = useState<[number, number]>([0, 50])
  const [showPublicOnly, setShowPublicOnly] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const debouncedSearch = useDebounce(search, 300)
  const { ref, inView } = useInView({ threshold: 0.1 })

  // Restore persisted preferences
  useEffect(() => {
    try {
      const savedTab = localStorage.getItem("quiz_active_tab")
      const savedView = localStorage.getItem("quiz_view_mode") as "grid" | "list" | null
      const savedSearch = localStorage.getItem("quiz_search")
      const savedTypes = localStorage.getItem("quiz_types")
      if (savedTab) setActiveTab(savedTab)
      if (savedView === "grid" || savedView === "list") {
        setViewMode(savedView)
      }
      if (typeof savedSearch === "string") setSearch(savedSearch)
      if (savedTypes) {
        const arr = savedTypes.split(",").filter(Boolean) as QuizType[]
        if (arr.length > 0) setSelectedTypes(arr)
      }
    } catch {}
  }, [])

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem("quiz_active_tab", activeTab)
    } catch {}
  }, [activeTab])
  useEffect(() => {
    try {
      localStorage.setItem("quiz_view_mode", viewMode)
    } catch {}
  }, [viewMode])
  useEffect(() => {
    try {
      localStorage.setItem("quiz_search", search)
    } catch {}
  }, [search])
  useEffect(() => {
    try {
      localStorage.setItem("quiz_types", selectedTypes.join(","))
    } catch {}
  }, [selectedTypes])

  const queryKey = useMemo(
    () => [
      "quizzes",
      debouncedSearch,
      selectedTypes.join(","),
      userId,
      questionCountRange.join("-"),
      showPublicOnly,
      activeTab,
    ],
    [debouncedSearch, selectedTypes, userId, questionCountRange, showPublicOnly, activeTab],
  )

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1, signal }) => {
      if (signal?.aborted) {
        throw new Error("Query was cancelled")
      }

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
      return failureCount < 1
    },
  })

  const dedupeById = useCallback((items: QuizListItem[]) => {
    const seen = new Set<string>()
    const result: QuizListItem[] = []
    for (const q of items || []) {
      const key = String(q.id || q.slug || "")
      if (!key) continue
      if (!seen.has(key)) {
        seen.add(key)
        result.push(q)
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
    activeTab !== "all"

  // Load more when in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isLoading && !isError && !noResults && quizzes.length > 0) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage, isError, noResults, quizzes.length])

  // Event Handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearch("")
    setSelectedTypes([])
    setQuestionCountRange([0, 50])
    setShowPublicOnly(false)
    setActiveTab("all")
  }, [])

  const toggleQuizType = useCallback((type: QuizType) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }, [])

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value || "all")
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

  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    if (mode) setViewMode(mode)
  }, [])

  const quizCounts = useMemo(() => {
    const counts = {
      all: quizzes.length,
      mcq: 0,
      openended: 0,
      code: 0,
      blanks: 0,
      flashcard: 0,
    }

    for (const q of quizzes) {
      if (q.quizType === "mcq") counts.mcq++
      else if (q.quizType === "openended") counts.openended++
      else if (q.quizType === "code") counts.code++
      else if (q.quizType === "blanks") counts.blanks++
      else if (q.quizType === "flashcard") counts.flashcard++
    }

    return counts
  }, [quizzes])

  // Error fallback component
  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="font-semibold text-lg mb-2">Something went wrong</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {error.message || "We encountered an unexpected error. Please try again."}
        </p>
        <Button onClick={resetErrorBoundary} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold gradient-text text-balance">Find your Quiz</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Jumpstart your learning journey with interactive quizzes from CourseAI and our community.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search quizzes..."
              value={search}
              onChange={handleSearchChange}
              className="pl-12 h-14 text-lg bg-card border-border/50 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <ErrorBoundary fallbackRender={ErrorFallback} onReset={handleRetry} resetKeys={[queryKey.join("")]}>
          <div className="lg:w-80 lg:flex-shrink-0">
            <QuizSidebar
              search={search}
              onSearchChange={handleSearchChange}
              onClearSearch={handleClearSearch}
              isSearching={isSearching}
              selectedTypes={selectedTypes}
              toggleQuizType={toggleQuizType}
              questionCountRange={questionCountRange}
              onQuestionCountChange={setQuestionCountRange}
              showPublicOnly={showPublicOnly}
              onPublicOnlyChange={setShowPublicOnly}
            />
          </div>
        </ErrorBoundary>

        <div className="flex-1 min-w-0">
          <ErrorBoundary fallbackRender={ErrorFallback} onReset={handleRetry} resetKeys={[queryKey.join("")]}>
            {isLoading ? (
              <QuizzesSkeleton />
            ) : (
              <>
                <QuizList
                  quizzes={quizzes}
                  isLoading={false}
                  isError={isError}
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={!!hasNextPage}
                  isSearching={isSearching}
                  onCreateQuiz={handleCreateQuiz}
                  activeFilter={activeTab}
                  onFilterChange={handleTabChange}
                  onRetry={handleRetry}
                  quizCounts={quizCounts}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  currentUserId={userId}
                  showActions={true}
                  onQuizDeleted={handleQuizDeleted}
                />
                <div ref={ref} className="h-20 flex items-center justify-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin" />
                      Loading more quizzes...
                    </div>
                  )}
                </div>
              </>
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}

export const QuizzesClient = QuizzesClientComponent
export default QuizzesClient
