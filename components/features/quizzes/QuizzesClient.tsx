"use client"

import React, { useState, useCallback, useMemo } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/useDebounce"

import { QuizSidebar } from "./QuizSidebar"
import { useInView } from "react-intersection-observer"

import type { QuizListItem, QuizType } from "@/app/types/types"
import { ErrorBoundary } from "./ErrorBoundary"
import { getQuizzes } from "@/app/actions/getQuizes"
import { CreateCard } from "@/components/CreateCard"


const LazyQuizList = React.lazy(() => import("./QuizList"))

interface QuizzesClientProps {
  initialQuizzesData: {
    quizzes: QuizListItem[]
    nextCursor: number | null
  }
  userId?: string
}

export function QuizzesClient({ initialQuizzesData, userId }: QuizzesClientProps) {
  const [search, setSearch] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<QuizType[]>([])
  const debouncedSearch = useDebounce(search, 300)
  const { ref, inView } = useInView()

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ["quizzes", debouncedSearch, userId, selectedTypes],
    queryFn: ({ pageParam = 1 }) =>
      getQuizzes({
        page: pageParam,
        limit: 5,
        searchTerm: debouncedSearch,
        userId,
        quizTypes: selectedTypes.length > 0 ? selectedTypes : null,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 1,
    initialData: {
      pages: [initialQuizzesData],
      pageParams: [1],
    },
  })

  React.useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, fetchNextPage, hasNextPage])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearch("")
    setSelectedTypes([])
    refetch()
  }, [refetch])

  const toggleQuizType = useCallback((type: QuizType) => {
    setSelectedTypes((prev) => {
      const newTypes = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
      return newTypes
    })
  }, [])

  const quizzes = useMemo(() => data?.pages.flatMap((page) => page.quizzes) || [], [data?.pages])

  const isSearching = debouncedSearch.trim() !== "" || selectedTypes.length > 0

  // Check if there are no quizzes to display
  const hasNoQuizzes = !isLoading && quizzes.length === 0

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-screen">
      <QuizSidebar
        search={search}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        isSearching={isSearching}
        selectedTypes={selectedTypes}
        toggleQuizType={toggleQuizType}
      />
      <div className="lg:w-3/4 space-y-8">
        <ErrorBoundary fallback={<div>Error loading quizzes. Please try again later.</div>}>
          {hasNoQuizzes ? (
            <div className="py-8">
              {isSearching ? (
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-semibold">No quizzes found</h3>
                  <p className="text-muted-foreground">
                    We couldn't find any quizzes matching your search criteria. Try adjusting your filters or create a
                    new quiz.
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2 mt-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
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
              )}
            </div>
          ) : (
            <React.Suspense fallback={<div>Loading quizzes...</div>}>
              <LazyQuizList
                quizzes={quizzes}
                isLoading={isLoading}
                isError={isError}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                isSearching={isSearching}
              />
              <div ref={ref} className="h-10" />
            </React.Suspense>
          )}
        </ErrorBoundary>
      </div>
    </div>
  )
}

