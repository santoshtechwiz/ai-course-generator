"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { PublicQuizCardListing } from "./PublicQuizCardListing"
import type { QuizListItem } from "@/app/types"
import { CreateCard } from "@/app/components/CreateCard"
import { useInfiniteQuery } from "@tanstack/react-query"
import { getQuizzes } from "@/app/actions/getQuizes"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/useDebounce"
import { useSession } from "next-auth/react"

interface PublicQuizzesProps {
  initialQuizzesData: {
    quizzes: QuizListItem[]
    hasMore: boolean
  }
}

export function PublicQuizzes({ initialQuizzesData }: PublicQuizzesProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreatePrompt, setShowCreatePrompt] = useState(false)
  const userId = useSession().data?.user?.id

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ["quizzes", debouncedSearchTerm, userId],
    queryFn: ({ pageParam = 1 }) => getQuizzes(pageParam, 12, debouncedSearchTerm, userId),
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length + 1 : undefined),
    initialPageParam: 1,
    initialData: {
      pages: [initialQuizzesData],
      pageParams: [1],
    },
  })

  const observerTarget = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 1.0 },
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  const quizzes = data?.pages.flatMap((page) => page.quizzes) || []

  return (
    <div className="space-y-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-4 pb-2 border-b">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center max-w-7xl mx-auto px-4">
          {/* Search Input */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search quizzes..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Create Quiz Button */}
          <CreateCard compact title="Quick Create" animationDuration={2.0} />
        </div>
      </div>

      {/* Empty State */}
      <AnimatePresence>
        {quizzes.length === 0 && status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8 px-4"
          >
            <p className="text-xl text-muted-foreground mb-4">No quizzes found. Why not create your own?</p>
            <CreateCard
              title="Start Fresh"
              description="Be the first to create a quiz on this topic! It's easy and fun."
              animationDuration={2.0}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Flex Layout */}
      <div className="flex flex-wrap justify-start gap-6 px-4">
        {quizzes.map((quiz, index) => (
          <div
            key={quiz.id}
            className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] xl:w-[calc(20%-19.2px)]"
          >
            <PublicQuizCardListing quiz={quiz} index={index} />
          </div>
        ))}
      </div>

      {/* Load More */}
      <div ref={observerTarget} className="h-20 flex justify-center items-center">
        {isFetchingNextPage && <p>Loading more...</p>}
        {!isFetchingNextPage && hasNextPage && (
          <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            Load More
          </Button>
        )}
        {!hasNextPage && quizzes.length > 0 && <p>No more quizzes</p>}
      </div>

      {/* Floating Create Button */}
      <AnimatePresence>
        {showCreatePrompt && quizzes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-20"
          >
            <CreateCard floating title="Create New Quiz" animationDuration={2.0} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

