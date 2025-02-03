"use client"

import { useState, useCallback } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { PublicQuizzes } from "./PublicQuizzes"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/useDebounce"
import { getQuizzes } from "@/app/actions/getQuizes"
import { Search } from "lucide-react"
import type { QuizListItem } from "@/app/types/types"

interface QuizzesClientProps {
  initialQuizzesData: {
    quizzes: QuizListItem[]
    hasMore: boolean
  }
  userId?: string
}

export function QuizzesClient({ initialQuizzesData, userId }: QuizzesClientProps) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ["quizzes", debouncedSearch, userId],
    queryFn: ({ pageParam = 1 }) => getQuizzes(pageParam, 12, debouncedSearch, userId),
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

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const quizzes = data?.pages.flatMap((page) => page.quizzes) || []

  return (
    <div className="space-y-8">
      <div className="relative w-full max-w-2xl mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search quizzes..."
          value={search}
          onChange={handleSearchChange}
          className="pl-10 w-full text-lg py-2"
        />
      </div>
      {isLoading ? (
        <QuizzesSkeleton />
      ) : isError ? (
        <div className="text-center text-red-500">Error loading quizzes. Please try again later.</div>
      ) : (
        <>
          <PublicQuizzes quizzes={quizzes} />
          {hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Button onClick={loadMore} disabled={isFetchingNextPage} className="px-6 py-2 text-lg">
                {isFetchingNextPage ? "Loading more..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

