"use client"

import { useState, useCallback, useMemo } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { PublicQuizzes } from "./PublicQuizzes"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDebounce } from "@/hooks/useDebounce"
import { getQuizzes } from "@/app/actions/getQuizes"
import { Search, X, FileQuestion, AlignJustify, PenTool, Code, Loader2 } from "lucide-react"
import type { QuizListItem, QuizType } from "@/app/types/types"

interface QuizzesClientProps {
  initialQuizzesData: {
    quizzes: QuizListItem[]
    hasMore: boolean
  }
  userId?: string
}

const quizTypes = [
  { id: "mcq" as const, label: "Multiple Choice", icon: FileQuestion, color: "blue" },
  { id: "openended" as const, label: "Open Ended", icon: AlignJustify, color: "green" },
  { id: "fill-blanks" as const, label: "Fill in the Blanks", icon: PenTool, color: "yellow" },
  { id: "code" as const, label: "Code", icon: Code, color: "purple" },
]

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
      {/* Sidebar */}
      <div className="lg:w-1/4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search quizzes..."
            value={search}
            onChange={handleSearchChange}
            className="pl-10 w-full"
          />
          {isSearching && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selected Types Indicator */}
        {selectedTypes.length > 0 && (
          <div className="text-sm font-medium text-muted-foreground mb-2">
            {selectedTypes.length} {selectedTypes.length === 1 ? "type" : "types"} selected
          </div>
        )}

        {/* Quiz Types */}
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-2">
            {quizTypes.map((type) => (
              <Button
                key={type.id}
                variant={selectedTypes.includes(type.id) ? "default" : "outline"}
                size="sm"
                className={`w-full justify-start transition-all duration-200 ${
                  selectedTypes.includes(type.id)
                    ? `bg-${type.color}-500 hover:bg-${type.color}-600 text-white`
                    : `hover:bg-${type.color}-100`
                }`}
                onClick={() => toggleQuizType(type.id)}
              >
                <type.icon
                  className={`mr-2 h-4 w-4 ${selectedTypes.includes(type.id) ? "text-white" : `text-${type.color}-500`}`}
                />
                {type.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="lg:w-3/4 space-y-8">
        {isFetching && !isFetchingNextPage ? (
          <div className="flex justify-center items-center h-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : isLoading ? (
          <QuizzesSkeleton />
        ) : isError ? (
          <div className="text-center text-red-500">Error loading quizzes. Please try again later.</div>
        ) : quizzes.length === 0 ? (
          <div className="text-center text-muted-foreground">
            {isSearching ? "No quizzes found matching your search." : "No quizzes available."}
          </div>
        ) : (
          <>
            <PublicQuizzes quizzes={quizzes} />
            {hasNextPage && (
              <div className="mt-6 flex justify-center">
                <Button onClick={loadMore} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? "Loading more..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

