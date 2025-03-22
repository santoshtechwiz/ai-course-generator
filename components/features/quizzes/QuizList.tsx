"use client"

import { memo, useEffect } from "react"
import { motion } from "framer-motion"
import { PublicQuizzes } from "./PublicQuizzes"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import NProgress from "nprogress"
import { useInView } from "react-intersection-observer"

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

  const [endMessageRef, endMessageInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  if (isLoading) {
    return <QuizzesSkeleton />
  }

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-4 bg-red-50 rounded-lg text-red-500"
      >
        Error loading quizzes. Please try again later.
      </motion.div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-muted-foreground"
      >
        {isSearching ? "No quizzes found matching your search." : "No quizzes available."}
      </motion.div>
    )
  }

  return (
    <>
      <PublicQuizzes quizzes={quizzes} />
      {isFetchingNextPage && <QuizzesSkeleton />}
      {!hasNextPage && quizzes.length > 0 && (
        <motion.div
          ref={endMessageRef}
          initial={{ opacity: 0, y: 20 }}
          animate={endMessageInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mt-8 p-4 text-muted-foreground bg-muted/20 rounded-lg"
        >
          You've reached the end! No more quizzes to load.
        </motion.div>
      )}
    </>
  )
}

export default memo(QuizList)

