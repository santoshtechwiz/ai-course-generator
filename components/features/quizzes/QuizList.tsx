"use client"

import { memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PublicQuizzes } from "./PublicQuizzes"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import NProgress from "nprogress"
import { useInView } from "react-intersection-observer"
import { AlertCircle } from "lucide-react"

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
        className="text-center p-6 bg-red-50 rounded-lg text-red-500 shadow-sm border border-red-100 flex flex-col items-center"
      >
        <AlertCircle className="w-8 h-8 mb-2" />
        <h3 className="font-semibold text-lg mb-1">Error loading quizzes</h3>
        <p className="text-sm text-red-600">Please try again later or refresh the page.</p>
      </motion.div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center text-muted-foreground p-8 bg-muted/30 rounded-lg border border-muted"
      >
        {isSearching ? (
          <>
            <h3 className="text-xl font-semibold mb-2">No matching quizzes found</h3>
            <p>Try adjusting your search terms or filters to find what you're looking for.</p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold mb-2">No quizzes available</h3>
            <p>Be the first to create a quiz and share your knowledge!</p>
          </>
        )}
      </motion.div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="quiz-list"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PublicQuizzes quizzes={quizzes} />
        {isFetchingNextPage && <QuizzesSkeleton itemCount={3} />}
        {!hasNextPage && quizzes.length > 0 && (
          <motion.div
            ref={endMessageRef}
            initial={{ opacity: 0, y: 20 }}
            animate={endMessageInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-center mt-8 p-4 text-muted-foreground bg-muted/20 rounded-lg border border-muted/50"
          >
            <span className="font-medium">You've reached the end!</span> No more quizzes to load.
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default memo(QuizList)
