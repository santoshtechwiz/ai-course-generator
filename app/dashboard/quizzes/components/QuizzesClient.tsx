"use client"

import React, { useState, useCallback, useMemo, Suspense } from "react"
import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/useDebounce"
import { getQuizzes } from "@/app/actions/getQuizes"
import { QuizSidebar } from "./QuizSidebar"

import type { QuizListItem, QuizType } from "@/app/types/types"
import { ErrorBoundary } from "./ErrorBoundary"

const LazyQuizList = React.lazy(() => import("./QuizList"))

interface QuizzesClientProps {
  initialQuizzesData: {
    quizzes: QuizListItem[]
    hasMore: boolean
  }
  userId?: string
}

export function QuizzesClient({ initialQuizzesData, userId }: QuizzesClientProps) {
  const [search, setSearch] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<QuizType[]>([])
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["quizzes", debouncedSearch, userId, selectedTypes, page],
    queryFn: () => getQuizzes(page, 12, debouncedSearch, userId, selectedTypes.length > 0 ? selectedTypes : null),
    initialData: initialQuizzesData,
    keepPreviousData: true,
  })

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearch("")
    setSelectedTypes([])
    setPage(1)
    refetch()
  }, [refetch])

  const toggleQuizType = useCallback((type: QuizType) => {
    setSelectedTypes((prev) => {
      const newTypes = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
      setPage(1)
      return newTypes
    })
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const quizzes = useMemo(() => data?.quizzes || [], [data?.quizzes])

  const isSearching = debouncedSearch.trim() !== "" || selectedTypes.length > 0

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
          
            <LazyQuizList
              quizzes={quizzes}
              isLoading={isLoading}
              isError={isError}
              isFetching={isFetching}
              hasMore={data?.hasMore || false}
              currentPage={page}
              onPageChange={handlePageChange}
              isSearching={isSearching}
            />
         
        </ErrorBoundary>
      </div>
    </div>
  )
}

