"use client"

import React, { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/useDebounce"
import { useInView } from "react-intersection-observer"
import { ErrorBoundary } from "react-error-boundary"
import { motion } from "framer-motion"
import { AlertCircle, RefreshCw } from "lucide-react"


import type { QuizType } from "@/app/types/quiz-types"
import type { GetQuizzesResult, QuizListItem } from "@/app/actions/getQuizes"

import { getQuizzes } from "@/app/actions/getQuizes"
import { QuizSidebar } from "./QuizSidebar"
import { QuizList } from "./QuizList"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import { Button } from "@/components/ui/button"

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

  // ----- Filters -----
  const [search, setSearch] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<QuizType[]>([])
  const [questionCountRange, setQuestionCountRange] = useState<[number, number]>([0, 50])
  const [showPublicOnly, setShowPublicOnly] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const debouncedSearch = useDebounce(search, 500)
  const { ref, inView } = useInView({ threshold: 0.1 })
  const queryKey = useMemo(() => [
    "quizzes",
    debouncedSearch,
    selectedTypes.join(","),
    userId,
    questionCountRange.join("-"),
    showPublicOnly,
    activeTab,
  ], [debouncedSearch, selectedTypes, userId, questionCountRange, showPublicOnly, activeTab])
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getQuizzes({
        page: pageParam as number,
        limit: 10,
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

  // ----- Event Handlers -----
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
    setSelectedTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type])
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
      flashcard: 0
    }
      for (const q of quizzes) {
      // Handle the mapping between API types and UI types
      if (q.quizType === "mcq") {
        counts.mcq++;
      } else if (q.quizType === "openended") {
        counts.openended++;
      } else if (q.quizType === "code") {
        counts.code++;
      } else if (q.quizType === "blanks") {
        counts.blanks++;
      } else if (q.quizType === "flashcard") {
        counts.flashcard++;
      }
    }
    
    return counts;
  }, [quizzes])
  // Error fallback component
  const ErrorFallback = ({ 
    error, 
    resetErrorBoundary 
  }: { 
    error: Error; 
    resetErrorBoundary: () => void 
  }) => (
    <motion.div 
      className="rounded-lg border bg-card p-6 shadow-sm flex flex-col items-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AlertCircle className="h-10 w-10 text-destructive mb-3" />
      <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
      <p className="text-sm text-muted-foreground text-center mb-4">
        {error.message || "We had trouble loading the quiz filters"}
      </p>
      <Button onClick={resetErrorBoundary} size="sm" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </motion.div>
  )

  const renderErrorState = () => (
    <div className="text-center p-6 bg-destructive/10 border border-destructive rounded-lg text-destructive flex flex-col items-center">
      <AlertCircle className="w-8 h-8 mb-2" />
      <h3 className="font-semibold text-lg">Error loading quizzes</h3>
      <p className="text-sm mb-4">Something went wrong. Please try again.</p>
      <Button
        onClick={handleRetry}
        variant="outline"
        className="flex items-center gap-2"
        disabled={isRefetching}
      >
        {isRefetching ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" /> Retrying...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" /> Try Again
          </>
        )}
      </Button>
    </div>
  )
  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[50vh]">      
      <ErrorBoundary 
        fallbackRender={ErrorFallback} 
        onReset={handleRetry} 
        resetKeys={[debouncedSearch]}
      >
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

      <motion.div
        className="lg:w-3/4 w-full space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ErrorBoundary fallbackRender={ErrorFallback} onReset={handleRetry} resetKeys={[queryKey.join("")]}>
          {isLoading ? (
            <QuizzesSkeleton />
          ) : isError ? (
            renderErrorState()
          ) : (
            <>
              <QuizList
                quizzes={quizzes}
                isLoading={false}
                isError={false}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={!!hasNextPage}
                isSearching={isSearching}
                onCreateQuiz={handleCreateQuiz}
                activeFilter={activeTab}
                onFilterChange={handleTabChange}
                onRetry={handleRetry}
                quizCounts={quizCounts}
              />
              <div ref={ref} className="h-20 flex items-center justify-center">
                {isFetchingNextPage && (
                  <div className="animate-pulse text-muted-foreground text-sm">
                    Loading more quizzes...
                  </div>
                )}
              </div>
            </>
          )}
        </ErrorBoundary>      </motion.div>
    </div>
  )
}

// Export the component with the correct name
export const QuizzesClient = QuizzesClientComponent;
