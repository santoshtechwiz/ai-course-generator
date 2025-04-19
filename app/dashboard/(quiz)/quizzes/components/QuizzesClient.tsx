"use client"

import type React from "react"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/useDebounce"
import { useInView } from "react-intersection-observer"

import type { QuizListItem } from "@/app/types/types"
import type { QuizType } from "./QuizSidebar"

import { getQuizzes } from "@/app/actions/getQuizes"
import { QuizSidebar } from "./QuizSidebar"
import { QuizList } from "./QuizList"
import { ErrorBoundary } from "react-error-boundary"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import { AlertCircle, RefreshCw } from "lucide-react"
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
  return data.pages.reduce((acc: QuizListItem[], page: { quizzes: any }) => {
    if (page?.quizzes) {
      return [...acc, ...page.quizzes]
    }
    return acc
  }, [])
}

export function QuizzesClient({ initialQuizzesData, userId }: QuizzesClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<QuizType[]>([])
  const [questionCountRange, setQuestionCountRange] = useState<[number, number]>([0, 50])
  const [showPublicOnly, setShowPublicOnly] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const debouncedSearch = useDebounce(search, 500)
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  // Memoize query key to prevent unnecessary refetches
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
      queryFn: async ({ pageParam }) => {
        try {
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

          // Transform the result to match QuizListItem type
          const quizzes = result?.quizzes?.map((quiz: any) => ({
            ...quiz,
            questions: quiz.questions || [],
            tags: quiz.tags || [],
          })) || []

          return {
            quizzes,
            nextCursor: result?.nextCursor ?? null,
          }

          // Check if there was an error in the server action
          if (result.error) {
            throw new Error(result.error)
          }

          return {
            quizzes: result?.quizzes || [],
            nextCursor: result?.nextCursor ?? null,
          }
        } catch (error) {
          console.error("Error fetching quizzes:", error)
          throw error // Re-throw to trigger error state
        }
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: 1,
      initialData: () => {
        if (search === "" && selectedTypes.length === 0 && activeTab === "all") {
          return {
            pages: [initialQuizzesData],
            pageParams: [1],
          }
        }
        return undefined
      },
      staleTime: 1000 * 60 * 5, // 5 minutes stale time
      retry: 2, // Retry failed requests twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    })

  // Load more quizzes when scrolling to the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isError) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, isError])

  // Handlers for search and filters
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

  const quizzes = extractQuizzes(data)
  const isSearching =
    debouncedSearch.trim() !== "" ||
    selectedTypes.length > 0 ||
    questionCountRange[0] > 0 ||
    questionCountRange[1] < 50 ||
    showPublicOnly ||
    activeTab !== "all"

  // Calculate quiz counts by type
  const quizCounts = useMemo(() => {
    return {
      all: quizzes.length,
      mcq: quizzes.filter((q) => q.quizType === "mcq").length,
      openended: quizzes.filter((q) => q.quizType === "openended").length,
      code: quizzes.filter((q) => q.quizType === "code").length,
      "fill-blanks": quizzes.filter((q) => q.quizType === "fill-blanks").length,
    }
  }, [quizzes])

  // Error state content
  const renderErrorState = () => (
    <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-800 flex flex-col items-center">
      <AlertCircle className="w-10 h-10 mb-3 text-red-500 dark:text-red-400" />
      <h3 className="font-semibold text-xl mb-2">Error loading quizzes</h3>
      <p className="text-sm text-red-600 dark:text-red-400 mb-4">
        We couldn't load your quizzes. Please try again later.
      </p>
      <Button
        onClick={handleRetry}
        variant="outline"
        className="mt-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
        disabled={isRefetching}
      >
        {isRefetching ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Retrying...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </>
        )}
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[50vh]">
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

      <motion.div
        className="lg:w-3/4 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ErrorBoundary fallback={renderErrorState()} onReset={handleRetry} resetKeys={[queryKey.join("")]}>
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
                  <div className="animate-pulse text-muted-foreground text-sm">Loading more quizzes...</div>
                )}
              </div>
            </>
          )}
        </ErrorBoundary>
      </motion.div>
    </div>
  )
}
