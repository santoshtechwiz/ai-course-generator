import { Button } from "@/components/ui/button"
import { PublicQuizzes } from "./PublicQuizzes"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import { Loader2 } from "lucide-react"
import type { QuizListItem } from "@/app/types/types"

interface QuizListProps {
  quizzes: QuizListItem[]
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean | undefined
  loadMore: () => void
  isSearching: boolean
}

export function QuizList({
  quizzes,
  isLoading,
  isError,
  isFetching,
  isFetchingNextPage,
  hasNextPage,
  loadMore,
  isSearching,
}: QuizListProps) {
  if (isFetching && !isFetchingNextPage) {
    return (
      <div className="flex justify-center items-center h-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  if (isLoading) {
    return <QuizzesSkeleton />
  }

  if (isError) {
    return <div className="text-center text-red-500">Error loading quizzes. Please try again later.</div>
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        {isSearching ? "No quizzes found matching your search." : "No quizzes available."}
      </div>
    )
  }

  return (
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
  )
}

