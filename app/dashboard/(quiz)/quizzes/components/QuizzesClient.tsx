"use client"

import type React from "react"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/useDebounce"
import { useInView } from "react-intersection-observer"

import type { QuizListItem, QuizType } from "@/app/types/types"

import { getQuizzes } from "@/app/actions/getQuizes"
import { CreateCard } from "@/components/CreateCard"
import { QuizSidebar } from "./QuizSidebar"

import { QuizzesListSkeleton } from "@/components/ui/loading/loading-skeleton"
import { QuizList } from "./QuizList"
import { ErrorBoundary } from "react-error-boundary"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

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

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getQuizzes({
        page: pageParam,
        limit: 10,
        searchTerm: debouncedSearch,
        userId,
        quizTypes: selectedTypes.length > 0 ? selectedTypes : null,
        minQuestions: questionCountRange[0],
        maxQuestions: questionCountRange[1],
        publicOnly: showPublicOnly,
        tab: activeTab,
      })
      return {
        quizzes: result?.quizzes || [],
        nextCursor: result?.nextCursor ?? null,
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
  })

  // Load more quizzes when scrolling to the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

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

  const quizzes = extractQuizzes(data)
  const isSearching =
    debouncedSearch.trim() !== "" ||
    selectedTypes.length > 0 ||
    questionCountRange[0] > 0 ||
    questionCountRange[1] < 50 ||
    showPublicOnly ||
    activeTab !== "all"

  // Empty state content
  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <div className="text-center space-y-4 p-8 bg-muted/30 rounded-lg">
          <h3 className="text-xl font-semibold">No quizzes found</h3>
          <p className="text-muted-foreground">
            We couldn't find any quizzes matching your search criteria. Try adjusting your filters.
          </p>
          <button
            onClick={handleClearSearch}
            className="px-4 py-2 mt-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2">Get Started with Your First Quiz</h3>
          <p className="text-muted-foreground">
            You don't have any quizzes yet. Create your first quiz to start engaging your audience!
          </p>
        </div>
        <CreateCard
          title="Create Your First Quiz"
          description="Transform your knowledge into an engaging quiz in minutes! Start your journey now."
          createUrl="/dashboard/mcq"
        />
      </div>
    )
  }

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
        <ErrorBoundary
          fallback={
            <div className="p-8 text-center bg-red-50 rounded-lg text-red-500">
              Error loading quizzes. Please try again later.
            </div>
          }
        >
          {isLoading ? (
            <QuizzesListSkeleton />
          ) : isError ? (
            <QuizList
              quizzes={[]}
              isLoading={false}
              isError={true}
              isFetchingNextPage={false}
              hasNextPage={false}
              isSearching={isSearching}
              onRetry={refetch}
              onCreateQuiz={handleCreateQuiz}
              activeFilter={activeTab}
              onFilterChange={handleTabChange}
            />
          ) : quizzes.length === 0 ? (
            renderEmptyState()
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
