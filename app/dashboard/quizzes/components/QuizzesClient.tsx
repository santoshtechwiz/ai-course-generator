"use client"

import { useState, useCallback, useMemo } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/useDebounce"
import { getQuizzes } from "@/app/actions/getQuizes"
import { QuizSidebar } from "./QuizSidebar"
import { QuizList } from "./QuizList"
import type { QuizListItem, QuizType } from "@/app/types/types"

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
  const debouncedSearch = useDebounce(search, 300)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch, isFetching } =
    useInfiniteQuery({
      queryKey: ["quizzes", debouncedSearch, userId, selectedTypes],
      queryFn: ({ pageParam = 1 }) =>
        getQuizzes(pageParam, 12, debouncedSearch, userId, selectedTypes.length > 0 ? selectedTypes : null),
      getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length + 1 : undefined),
      initialPageParam: 1,
      initialData: {
        pages: [initialQuizzesData],
        pageParams: [1],
      },
    })

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearch("")
    setSelectedTypes([])
    refetch()
  }, [refetch])

  const toggleQuizType = useCallback((type: QuizType) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }, [])

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const quizzes = useMemo(() => {
    return data?.pages.flatMap((page) => page.quizzes) || []
  }, [data?.pages])

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
        <QuizList
          quizzes={quizzes}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          loadMore={loadMore}
          isSearching={isSearching}
        />
      </div>
    </div>
  )
}

