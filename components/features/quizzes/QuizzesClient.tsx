"use client"

import React, { useState, useCallback } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/useDebounce"
import { motion } from "framer-motion"
import { QuizSidebar } from "./QuizSidebar"
import { useInView } from "react-intersection-observer"

import type { QuizListItem, QuizType } from "@/app/types/types"
import { ErrorBoundary } from "./ErrorBoundary"
import { getQuizzes } from "@/app/actions/getQuizes"
import { CreateCard } from "@/components/CreateCard"
import { QuizzesSkeleton } from "./QuizzesSkeleton"

const LazyQuizList = React.lazy(() => import("./QuizList"))

interface QuizzesClientProps {
  initialQuizzesData: {
    quizzes: QuizListItem[]
    nextCursor: number | null
  }
  userId?: string
}

// Safe function to extract quizzes from data
function extractQuizzes(data: any): QuizListItem[] {
  // If data is null or undefined, return empty array
  if (!data) {
    return []
  }

  // If pages doesn't exist or isn't an array, return empty array
  if (!data.pages || !Array.isArray(data.pages)) {
    return []
  }

  try {
    // Create a new array to hold all quizzes
    const allQuizzes: QuizListItem[] = []

    // Loop through each page
    for (let i = 0; i < data.pages.length; i++) {
      const page = data.pages[i]

      // Check if page exists
      if (!page) {
        continue
      }

      // Check if page.quizzes exists and is an array
      if (!page.quizzes || !Array.isArray(page.quizzes)) {
        continue
      }

      // Add quizzes from this page to our collection
      allQuizzes.push(...page.quizzes)
    }

    return allQuizzes
  } catch (error) {
    console.error("Error extracting quizzes:", error)
    return []
  }
}

export function QuizzesClient({ initialQuizzesData, userId }: QuizzesClientProps) {
  const [search, setSearch] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<QuizType[]>([])
  const debouncedSearch = useDebounce(search, 300)
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ["quizzes", debouncedSearch, userId, selectedTypes],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const result = await getQuizzes({
          page: pageParam,
          limit: 1,
          searchTerm: debouncedSearch,
          userId,
          quizTypes: selectedTypes.length > 0 ? selectedTypes : null,
        })
        // Ensure we always return a valid structure
        return {
          quizzes: Array.isArray(result?.quizzes) ? result.quizzes : [],
          nextCursor: result?.nextCursor ?? null,
        }
      } catch (error) {
        console.warn("Error fetching quizzes:", error)
        // Return a valid data structure even on error
        return { quizzes: [], nextCursor: null }
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || typeof lastPage !== "object" || !("nextCursor" in lastPage)) {
        return undefined // Safeguard to prevent errors
      }
      return lastPage.nextCursor
    },
    initialPageParam: 1,
    initialData: {
      pages: [initialQuizzesData],
      pageParams: [1],
    },
  })

  // Add additional safety checks before calling fetchNextPage
  React.useEffect(() => {
    // Only fetch next page if all conditions are met AND data is valid
    if (inView && hasNextPage && !isFetchingNextPage && data && data.pages) {
      try {
        fetchNextPage()
      } catch (error) {
        console.error("Error fetching next page:", error)
      }
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage, data])

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

  // Use the safe extraction function
  const quizzes = extractQuizzes(data)

  const isSearching = debouncedSearch.trim() !== "" || selectedTypes.length > 0
  const hasNoQuizzes = !isLoading && quizzes.length === 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col lg:flex-row gap-6 min-h-[50vh]"
    >
      <QuizSidebar
        search={search}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        isSearching={isSearching}
        selectedTypes={selectedTypes}
        toggleQuizType={toggleQuizType}
      />

      <div className="lg:w-3/4 space-y-6">
        <ErrorBoundary
          fallback={
            <div className="p-8 text-center bg-red-50 rounded-lg text-red-500">
              Error loading quizzes. Please try again later.
            </div>
          }
        >
          {hasNoQuizzes ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-8">
              {isSearching ? (
                <div className="text-center space-y-4 p-8 bg-muted/30 rounded-lg">
                  <h3 className="text-xl font-semibold">No quizzes found</h3>
                  <p className="text-muted-foreground">
                    We couldn't find any quizzes matching your search criteria. Try adjusting your filters or create a
                    new quiz.
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2 mt-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
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
            </motion.div>
          ) : (
            <React.Suspense fallback={<QuizzesSkeleton />}>
              <LazyQuizList
                quizzes={quizzes}
                isLoading={isLoading}
                isError={isError}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={!!hasNextPage}
                isSearching={isSearching}
              />
              <div ref={ref} className="h-20 flex items-center justify-center">
                {isFetchingNextPage && (
                  <div className="animate-pulse text-muted-foreground text-sm">Loading more quizzes...</div>
                )}
              </div>
            </React.Suspense>
          )}
        </ErrorBoundary>
      </div>
    </motion.div>
  )
}

