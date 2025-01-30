"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react'
import { PublicQuizCardListing } from "./PublicQuizCardListing"
import type { QuizListItem } from "@/app/types"
import { useInView } from "react-intersection-observer"
import { CreateQuizCard } from "@/app/components/CreateQuizCard"
import { useInfiniteQuery } from "@tanstack/react-query"
import { getQuizzes } from "@/app/actions/getQuizes"
import { Button } from "@/components/ui/button"

interface PublicQuizzesProps {
  initialQuizzesData: {
    quizzes: QuizListItem[]
    hasMore: boolean
  }
}

export function PublicQuizzes({ initialQuizzesData }: PublicQuizzesProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreatePrompt, setShowCreatePrompt] = useState(false)

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['quizzes', searchTerm],
    queryFn: ({ pageParam = 1 }) => getQuizzes(pageParam, 10, searchTerm),
    getNextPageParam: (lastPage, allPages) => lastPage.hasMore ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    initialData: {
      pages: [initialQuizzesData],
      pageParams: [1],
    },
  })

  const { ref: loadMoreRef, inView: loadMoreInView } = useInView()

  useEffect(() => {
    if (loadMoreInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [loadMoreInView, hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    if (inView) {
      setShowCreatePrompt(true)
    }
  }, [inView])

  const filteredQuizzes = data?.pages.flatMap(page => page.quizzes) || []

  const debouncedSearch = useCallback(
    debounce((value: string) => setSearchTerm(value), 300),
    []
  )

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-4 pb-2 border-b">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center max-w-7xl mx-auto px-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search quizzes..."
              className="pl-10 w-full"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <CreateQuizCard compact title="Quick Create" animationDuration={2.0} />
        </div>
      </div>

      <AnimatePresence>
        {filteredQuizzes.length === 0 && status !== 'loading' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8 px-4"
          >
            <p className="text-xl text-muted-foreground mb-4">No quizzes found. Why not create your own?</p>
            <CreateQuizCard
              title="Start Fresh"
              description="Be the first to create a quiz on this topic! It's easy and fun."
              animationDuration={2.0}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {filteredQuizzes.map((quiz, index) => (
          <PublicQuizCardListing key={quiz.id} quiz={quiz} index={index} />
        ))}
      </div>

      <div ref={loadMoreRef} className="h-20 flex justify-center items-center">
        {isFetchingNextPage && <p>Loading more...</p>}
        {!isFetchingNextPage && hasNextPage && (
          <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            Load More
          </Button>
        )}
        {!hasNextPage && filteredQuizzes.length > 0 && <p>No more quizzes</p>}
      </div>

      <div ref={inViewRef} className="h-20" />

      <AnimatePresence>
        {showCreatePrompt && filteredQuizzes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-20"
          >
            <CreateQuizCard floating title="Create New Quiz" animationDuration={2.0} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, wait: number): F {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function(this: any, ...args: Parameters<F>) {
    const context = this
    if (timeout !== null) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(context, args), wait)
  } as F
}
