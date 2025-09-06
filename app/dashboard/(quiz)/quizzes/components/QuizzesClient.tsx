"use client"

import type React from "react"
import { useState, useCallback, useEffect, useMemo, useRef } from "react"
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
import RecommendedSection from "@/components/shared/RecommendedSection"
import AIQuizNoticeModal from "../../components/AIQuizNoticeModal"
import { useAIModal } from "@/hooks/useAIModal"

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

  // Refs to prevent infinite loops
  const lastSearchRef = useRef("")
  const lastFilterRef = useRef("")
  const lastTabRef = useRef("all")

  // AI Modal state with adaptive logic
  const {
    shouldShow: showAIModal,
    showModal: triggerAIModal,
    hideModal: hideAIModal,
    dismissModal: dismissAIModal,
    trackEngagement
  } = useAIModal({
    minTimeBetweenShows: 4 * 60 * 60 * 1000, // 4 hours
    maxShowsPerSession: 1,
    maxShowsPerDay: 2,
    triggerEvents: ['search', 'filter', 'browse']
  })

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

  // AI Modal trigger logic - prevent infinite loops with refs
  useEffect(() => {
    const currentSearch = debouncedSearch.trim()
    if (currentSearch.length > 2 && currentSearch !== lastSearchRef.current) {
      lastSearchRef.current = currentSearch
      trackEngagement('search')
      triggerAIModal('search')
    }
  }, [debouncedSearch, triggerAIModal, trackEngagement])

  // Filter change detection with ref to prevent loops
  const filterKey = useMemo(() =>
    `${selectedTypes.join(',')}-${questionCountRange.join('-')}-${showPublicOnly}`,
    [selectedTypes, questionCountRange, showPublicOnly]
  )

  useEffect(() => {
    if (filterKey !== lastFilterRef.current && filterKey !== '---false') {
      lastFilterRef.current = filterKey
      trackEngagement('filter')
      triggerAIModal('filter')
    }
  }, [filterKey, triggerAIModal, trackEngagement])

  // Tab change detection with ref to prevent loops
  useEffect(() => {
    if (activeTab !== lastTabRef.current && activeTab !== "all") {
      lastTabRef.current = activeTab
      trackEngagement('browse')
      const timer = setTimeout(() => {
        triggerAIModal('browse')
      }, 3000) // Wait 3 seconds to avoid showing immediately on page load
      return () => clearTimeout(timer)
    }
  }, [activeTab, triggerAIModal, trackEngagement])

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
      // Handle abort signal properly
      if (signal?.aborted) {
        throw new Error('Query was cancelled')
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
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      // Don't retry on AbortError or cancellation errors
      if (error?.name === 'AbortError' || error?.message?.includes('cancelled') || error?.message?.includes('Query was cancelled')) {
        return false
      }
      return failureCount < 1
    },
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

  // Load more when in view - prevent infinite loading by adding more conditions
  useEffect(() => {
    if (
      inView &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isLoading &&
      !isError &&
      !noResults &&
      quizzes.length > 0 // Additional guard to prevent fetching when no initial data
    ) {
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
    trackEngagement('create')
    router.push("/dashboard/mcq")
  }, [router, trackEngagement])

  const handleStartQuiz = useCallback(() => {
    trackEngagement('search') // Starting a quiz shows search/browse interest
    hideAIModal()
    // Could navigate to a random quiz or featured quiz
    router.push("/dashboard/quizzes")
  }, [router, hideAIModal, trackEngagement])

  const handleCreateQuizFromModal = useCallback(() => {
    trackEngagement('create')
    hideAIModal()
    router.push("/dashboard/mcq")
  }, [router, hideAIModal, trackEngagement])

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  const handleQuizDeleted = useCallback(() => {
    // Refetch the data to update the list after deletion
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

  // Enhanced Featured banner for engagement
  const FeaturedBanner = () => (
    <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-r from-violet-600/15 via-fuchsia-500/10 to-rose-500/10 backdrop-blur-sm">
      <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Crown className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">Unlock Premium Quizzes</h3>
            <p className="text-muted-foreground leading-relaxed">
              Get access to advanced question banks, code challenges, and AI insights to accelerate learning.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 px-3 py-1">Popular</Badge>
              <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5">
                <Flame className="h-3.5 w-3.5" /> Trending now
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
            Learn More
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-all duration-300 shadow-lg">
            Upgrade Now
          </Button>
        </div>
      </CardContent>
    </Card>
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
      <RecommendedSection
        title="Recommended for you"
        action={<Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveTab("all")}>View all</Button>}
      >
        <div className="-mx-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]" aria-label="Recommended quizzes">
          <style jsx>{`
            div::-webkit-scrollbar { display: none; }
          `}</style>
          <div className="flex items-stretch gap-4 px-2 pb-2 snap-x snap-mandatory">
            {recommended.map((q) => (
              <div key={q.id} className="min-w-[280px] max-w-[320px] snap-start transition-transform duration-200 hover:-translate-y-0.5">
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
      </RecommendedSection>
    )
  }

  return (
    <div className="space-y-8">
      {/* AI Learning Modal with adaptive display */}
      <AIQuizNoticeModal
        isOpen={showAIModal}
        onClose={() => dismissAIModal('less')}
        onStartQuiz={handleStartQuiz}
        onCreateQuiz={handleCreateQuizFromModal}
        onDismissWithPreference={dismissAIModal}
        quizType="quiz"
      />

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
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

        <div className="flex-1 min-w-0 space-y-8">
          <ErrorBoundary fallbackRender={ErrorFallback} onReset={handleRetry} resetKeys={[queryKey.join("")]}>
            {isLoading ? (
              <QuizzesSkeleton />
            ) : (
              <>
                <FeaturedBanner />

                {/* Enhanced Recommended Section */}
                <div className="bg-gradient-to-r from-accent/10 to-primary/5 rounded-xl p-6 border border-border/30">
                  <RecommendedRow />
                </div>

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
