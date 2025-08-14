"use client"

import type React from "react"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/useDebounce"
import { useInView } from "react-intersection-observer"
import { ErrorBoundary } from "react-error-boundary"
import { AlertCircle, RefreshCw, Crown, Rocket, Sparkles, Filter, Flame } from "lucide-react"
import type { QuizType } from "@/app/types/quiz-types"
import type { QuizListItem } from "@/app/actions/getQuizes"
import { getQuizzes } from "@/app/actions/getQuizes"
import { QuizSidebar } from "./QuizSidebar"
import { QuizList } from "./QuizList"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QuizCard } from "./QuizCard"
import { cn } from "@/lib/utils"

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
      } else {
        // Default to compact list on mobile when no saved preference
        if (typeof window !== 'undefined' && window.innerWidth < 640) {
          setViewMode("list")
        }
      }
      if (typeof savedSearch === 'string') setSearch(savedSearch)
      if (savedTypes) {
        const arr = savedTypes.split(",").filter(Boolean) as QuizType[]
        if (arr.length > 0) setSelectedTypes(arr)
      }
    } catch {}
  }, [])

  // Persist preferences
  useEffect(() => {
    try { localStorage.setItem("quiz_active_tab", activeTab) } catch {}
  }, [activeTab])
  useEffect(() => {
    try { localStorage.setItem("quiz_view_mode", viewMode) } catch {}
  }, [viewMode])
  useEffect(() => {
    try { localStorage.setItem("quiz_search", search) } catch {}
  }, [search])
  useEffect(() => {
    try { localStorage.setItem("quiz_types", selectedTypes.join(",")) } catch {}
  }, [selectedTypes])

  const debouncedSearch = useDebounce(search, 300)
  const { ref, inView } = useInView({ threshold: 0.1 })

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
    queryFn: async ({ pageParam = 1 }) => {
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
    initialData: () => {
      if (
        search === "" &&
        selectedTypes.length === 0 &&
        questionCountRange[0] === 0 &&
        questionCountRange[1] === 50 &&
        activeTab === "all"
      ) {
        return { pages: [initialQuizzesData], pageParams: [1] }
      }
      return undefined
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })

  // Dedupe helper
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

  // Avoid fetching next page when no results at all
  const noResults = !isLoading && !isError && quizzes.length === 0

  // Determine whether filters/search are active for empty state UX
  const isSearching = (
    debouncedSearch.trim() !== "" ||
    selectedTypes.length > 0 ||
    questionCountRange[0] > 0 ||
    questionCountRange[1] < 50 ||
    showPublicOnly ||
    activeTab !== "all"
  )

  // Load more when in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isError && !noResults) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, isError, noResults])

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

  // Featured banner for engagement
  const FeaturedBanner = () => (
    <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-violet-600/15 via-fuchsia-500/10 to-rose-500/10">
      <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-primary text-primary-foreground shadow">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Unlock Premium Quizzes</h3>
            <p className="text-sm text-muted-foreground">
              Get access to advanced question banks, code challenges, and AI insights to accelerate learning.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">Popular</Badge>
              <Badge variant="outline" className="gap-1"><Flame className="h-3 w-3" /> Trending now</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="hover:bg-primary/10">
            <a href="/dashboard/mcq" className="gap-2"><Sparkles className="h-4 w-4" /> Create Quiz</a>
          </Button>
          <Button asChild className="bg-gradient-to-r from-primary to-primary/80">
            <a href="/dashboard/subscription" className="gap-2"><Rocket className="h-4 w-4" /> Upgrade</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // Quick filter chips
  const QuickFilters = () => (
    <div className="flex items-center flex-wrap gap-2">
      {[
        { key: "all", label: "All" },
        { key: "mcq", label: "MCQ" },
        { key: "code", label: "Code" },
        { key: "openended", label: "Open Ended" },
        { key: "blanks", label: "Blanks" },
        { key: "flashcard", label: "Flashcards" },
      ].map(({ key, label }) => (
        <Button
          key={key}
          variant={activeTab === key ? "default" : "secondary"}
          size="sm"
          className={cn("h-8 px-3", activeTab === key ? "" : "bg-muted")}
          onClick={() => handleTabChange(key)}
        >
          {label}
          {key !== "all" && quizCounts[key as keyof typeof quizCounts] !== undefined && (
            <span className="ml-2 text-xs opacity-80">{quizCounts[key as keyof typeof quizCounts]}</span>
          )}
        </Button>
      ))}
    </div>
  )

  // Recommended row (horizontal scroll)
  const recommended = useMemo(() => {
    if (!quizzes?.length) return []
    return [...quizzes]
      .sort((a, b) => (b.questionCount || 0) - (a.questionCount || 0))
      .slice(0, 8)
  }, [quizzes])

  const filteredGridQuizzes = useMemo(() => {
    if (!recommended.length) return quizzes
    const recIds = new Set(recommended.map((q) => String(q.id || q.slug)))
    return quizzes.filter((q) => !recIds.has(String(q.id || q.slug)))
  }, [quizzes, recommended])

  const RecommendedRow = () => {
    if (!recommended.length) return null
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold">Recommended for you</h3>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveTab("all")}>View all</Button>
        </div>
        <div className="-mx-1 overflow-x-auto">
          <div className="flex items-stretch gap-3 px-1">
            {recommended.map((q) => (
              <div key={q.id} className="min-w-[280px] max-w-[320px]">
                <QuizCard
                  title={q.title}
                  description={q.title}
                  questionCount={q.questionCount || 0}
                  isPublic={q.isPublic}
                  slug={q.slug}
                  quizType={q.quizType as QuizType}
                  estimatedTime={`${Math.max(Math.ceil((q.questionCount || 0) * 0.5), 1)} min`}
                  completionRate={Math.min(Math.max(q.bestScore || 0, 0), 100)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <ErrorBoundary fallbackRender={ErrorFallback} onReset={handleRetry} resetKeys={[debouncedSearch]}>
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

        <div className="flex-1 min-w-0 space-y-6">
          <ErrorBoundary fallbackRender={ErrorFallback} onReset={handleRetry} resetKeys={[queryKey.join("")]}>
            {isLoading ? (
              <QuizzesSkeleton />
            ) : (
              <>
                <FeaturedBanner />

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <QuickFilters />
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCreateQuiz} className="gap-2 hover:bg-primary/10">
                      <Sparkles className="h-4 w-4" /> Create Quiz
                    </Button>
                    <Button asChild size="sm" className="bg-gradient-to-r from-primary to-primary/80">
                      <a href="/dashboard/subscription" className="gap-2"><Crown className="h-4 w-4" /> Upgrade</a>
                    </Button>
                  </div>
                </div>

                {/* Empty state when no results */}
                {noResults ? (
                  <div className="mt-6">
                    <QuizList
                      quizzes={[]}
                      isLoading={false}
                      isError={false}
                      isFetchingNextPage={false}
                      hasNextPage={false}
                      isSearching={isSearching}
                      onCreateQuiz={handleCreateQuiz}
                      activeFilter={activeTab}
                      onFilterChange={handleTabChange}
                      onRetry={handleRetry}
                      quizCounts={{ all: 0, mcq: 0, openended: 0, code: 0, blanks: 0, flashcard: 0 }}
                      viewMode={viewMode}
                      onViewModeChange={handleViewModeChange}
                    />
                  </div>
                ) : (
                  <>
                    <RecommendedRow />

                    <QuizList
                      quizzes={filteredGridQuizzes}
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
              </>
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}

export const QuizzesClient = QuizzesClientComponent
