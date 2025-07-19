"use client"

import type React from "react"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/useDebounce"
import { useInView } from "react-intersection-observer"
import { ErrorBoundary } from "react-error-boundary"
import { AlertCircle, RefreshCw } from "lucide-react"
import type { QuizType } from "@/app/types/quiz-types"
import type { QuizListItem } from "@/app/actions/getQuizes"
import { getQuizzes } from "@/app/actions/getQuizes"
import { QuizSidebar } from "./QuizSidebar"
import { QuizList } from "./QuizList"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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

  const debouncedSearch = useDebounce(search, 500)
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

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useInfiniteQuery({
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
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })

  // Load more when in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isError) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, isError])

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
    setActiveTab(value)
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

  const quizzes = extractQuizzes(data)

  const isSearching =
    debouncedSearch.trim() !== "" ||
    selectedTypes.length > 0 ||
    questionCountRange[0] > 0 ||
    questionCountRange[1] < 50 ||
    showPublicOnly ||
    activeTab !== "all"

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
      if (q.quizType === "mcq") {
        counts.mcq++
      } else if (q.quizType === "openended") {
        counts.openended++
      } else if (q.quizType === "code") {
        counts.code++
      } else if (q.quizType === "blanks") {
        counts.blanks++
      } else if (q.quizType === "flashcard") {
        counts.flashcard++
      }
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
      <div className="flex flex-col lg:flex-row gap-8">
        <ErrorBoundary fallbackRender={ErrorFallback} onReset={handleRetry} resetKeys={[debouncedSearch]}>
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
                />
                <div ref={ref} className="h-20 flex items-center justify-center">
                  {isFetchingNextPage && <div className="text-sm text-muted-foreground">Loading more quizzes...</div>}
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
