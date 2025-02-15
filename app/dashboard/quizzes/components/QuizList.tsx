"use client"

import { memo, useEffect } from "react"
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
  isFetchingNextPage: boolean
  hasNextPage: boolean | undefined
  isSearching: boolean
}

function QuizList({ quizzes, isLoading, isError, isFetchingNextPage, hasNextPage, isSearching }: QuizListProps) {
  useEffect(() => {
    if (isFetchingNextPage) {
      NProgress.start()
    } else {
      NProgress.done()
    }

    return () => {
      NProgress.done()
    }
  }, [isFetchingNextPage])

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
      {isFetchingNextPage && <QuizzesSkeleton />}
      {!hasNextPage && <div className="text-center mt-4">No more quizzes to load.</div>}
    </>
  )
}

export default memo(QuizList)

