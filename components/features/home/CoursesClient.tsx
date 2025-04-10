"use client"

import React, { useEffect } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { toast } from "@/hooks/use-toast"


import { CategoryId } from "@/config/categories"
import { Loader2 } from "lucide-react"
import { CreateCard } from "@/components/CreateCard"
import { useDebounce } from "@/hooks/useDebounce"
import { CourseCard } from "./CourseCard"

interface CoursesClientProps {
  url: string
  userId?: string
  searchQuery: string
  selectedCategory: CategoryId | null
}

const ITEMS_PER_PAGE = 12 // Reduced for better performance

const CoursesClient: React.FC<CoursesClientProps> = ({ url, userId, searchQuery, selectedCategory }) => {
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, refetch } = useInfiniteQuery({
    queryKey: ["courses", { search: debouncedSearchQuery, category: selectedCategory, userId }],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) =>
      fetch(`/api/courses?page=${pageParam}&limit=${ITEMS_PER_PAGE}${
        debouncedSearchQuery ? `&search=${debouncedSearchQuery}` : ''
      }${selectedCategory ? `&category=${selectedCategory}` : ''}${userId ? `&userId=${userId}` : ''}`
      ).then((res) => res.json()),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.courses.length === ITEMS_PER_PAGE ? allPages.length + 1 : undefined
    },
  })

  useEffect(() => {
    refetch()
  }, [refetch, debouncedSearchQuery, selectedCategory])

  const courses = data?.pages.flatMap((page) => page.courses) || []

  if (status === "error") {
    toast({
      title: "Error",
      description: (error as Error).message,
      variant: "destructive",
    })
  }

  return (
    <div className="flex-1 p-8">
      <AnimatePresence mode="wait">
        {status === "pending" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </motion.div>
        ) : courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
          >
            <p className="text-2xl text-muted-foreground text-center font-light">
              {searchQuery || selectedCategory
                ? "No courses found matching your criteria"
                : "Start your learning journey"}
            </p>
            <CreateCard
              title="Create New Course"
              description="Share your knowledge with the community"
              createUrl={url}
              animationDuration={1.2}
              className="w-full max-w-2xl"
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layout
            className="space-y-12"
          >
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            >
              <AnimatePresence>
                {courses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="h-full"
                  >
                    <CourseCard {...course} className="h-full" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {hasNextPage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center pt-12"
              >
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  size="lg"
                  className="rounded-xl px-12 py-6 text-lg bg-primary/90 hover:bg-primary shadow-lg"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    "Show More Courses"
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const SkeletonCard = () => (
  <div className="flex flex-col space-y-6 p-8 border rounded-3xl bg-background h-[480px]">
    <Skeleton className="h-8 w-3/4 rounded-xl mb-4" />
    <Skeleton className="h-5 w-full rounded-xl" />
    <Skeleton className="h-5 w-5/6 rounded-xl" />
    <Skeleton className="h-5 w-2/3 rounded-xl" />
    <div className="flex-1 pt-8 space-y-4">
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-3 w-1/3 rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-4 pt-6">
      {Array(3).fill(0).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  </div>
)

export default React.memo(CoursesClient)