"use client"

import { memo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PublicQuizzes } from "./PublicQuizzes"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import NProgress from "nprogress"

import type { QuizListItem } from "@/app/types/types"

NProgress.configure({
  minimum: 0.3,
  easing: "ease",
  speed: 500,
  showSpinner: false,
})

interface QuizListProps {
  quizzes: QuizListItem[]
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  hasMore: boolean
  currentPage: number
  onPageChange: (page: number) => void
  isSearching: boolean
}

function QuizList({
  quizzes,
  isLoading,
  isError,
  isFetching,
  hasMore,
  currentPage,
  onPageChange,
  isSearching,
}: QuizListProps) {
  useEffect(() => {
    if (isFetching) {
      NProgress.start()
    } else {
      NProgress.done()
    }

    return () => {
      NProgress.done()
    }
  }, [isFetching])

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
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </Button>
        <Button onClick={() => onPageChange(currentPage + 1)} disabled={!hasMore}>
          Next
        </Button>
      </div>
    </>
  )
}

export default memo(QuizList)

