"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useInfiniteQuery, type UseInfiniteQueryResult } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { BookOpen, LayoutGrid, List, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlobalLoader } from "@/components/loaders/UnifiedLoader"
import { useDebounce } from "@/lib/utils/hooks"
import { useGlobalLoader } from "@/components/loaders/global-loaders"
import { cn } from "@/lib/utils"
import { CourseCard } from "./CourseCard"
import type { CategoryId } from "@/config/categories"

// Types
interface Course {
  id: string
  title: string
  name?: string
  description: string
  image?: string
  rating?: number
  slug: string
  unitCount?: number
  lessonCount?: number
  quizCount?: number
  viewCount?: number
  category?: CategoryId
  duration?: string
  createdAt: string
  difficulty?: string
}

interface CoursesResponse {
  courses: Course[]
  total: number
  hasMore: boolean
}

interface CoursesClientProps {
  url: string
  userId?: string
  searchQuery: string
  selectedCategory: CategoryId | null
  ratingFilter?: number
}

const ITEMS_PER_PAGE = 12
const MemoizedCourseCard = React.memo(CourseCard)

export default function CoursesClient({
  url,
  userId,
  searchQuery,
  selectedCategory,
  ratingFilter = 0,
}: CoursesClientProps) {
  // State
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "newest">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  
  // Hooks
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const { startLoading, stopLoading } = useGlobalLoader()

  // Query
  const queryResult: UseInfiniteQueryResult<any, Error> = useInfiniteQuery({
    queryKey: ["courses", debouncedSearchQuery || "", selectedCategory || "", userId || "", ratingFilter, activeTab],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const currentPage = pageParam as number
      const loaderId = startLoading({
        message: currentPage === 1 ? 'Loading courses...' : 'Loading more courses...',
        type: 'data',
        showProgress: true,
        minVisibleMs: 150
      })

      try {
        const apiUrl = new URL("/api/course", window.location.origin)
        apiUrl.searchParams.set("page", currentPage.toString())
        apiUrl.searchParams.set("limit", ITEMS_PER_PAGE.toString())
        
        if (debouncedSearchQuery) {
          apiUrl.searchParams.set("search", debouncedSearchQuery)
        }
        if (selectedCategory) {
          apiUrl.searchParams.set("category", selectedCategory)
        }
        if (userId) {
          apiUrl.searchParams.set("userId", userId)
        }
        if (ratingFilter > 0) {
          apiUrl.searchParams.set("minRating", ratingFilter.toString())
        }
        
        apiUrl.searchParams.set(
          "sortBy",
          activeTab === "popular" ? "viewCount" : activeTab === "newest" ? "createdAt" : "viewCount"
        )
        apiUrl.searchParams.set("sortOrder", "desc")

        const response = await fetch(apiUrl.toString(), {
          headers: { "Cache-Control": "no-cache" },
          signal
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        return response.json()
      } finally {
        stopLoading(loaderId)
      }
    },
    getNextPageParam: (lastPage, allPages) => 
      lastPage.hasMore ? allPages.length + 1 : undefined,
    refetchOnWindowFocus: false,
    staleTime: 60000,
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = queryResult

  // Infinite scroll
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || !hasNextPage || isFetchingNextPage) return
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // States
  const coursesData = data as any
  const isInitialLoading = status === "pending" && (!coursesData?.pages?.length)
  const hasNoData = !isInitialLoading && (!coursesData?.pages?.length || !coursesData.pages[0]?.courses?.length)
  const hasFilters = Boolean(searchQuery || selectedCategory || ratingFilter > 0)

  // Loading state
  if (isInitialLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] w-full"
      >
        <GlobalLoader />
      </motion.div>
    )
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center"
      >
        <div className="bg-destructive/10 rounded-full p-6 mb-6">
          <Search className="w-12 h-12 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {error instanceof Error ? error.message : "An error occurred while loading courses"}
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Try again
        </Button>
      </motion.div>
    )
  }

  // Empty state
  if (hasNoData) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center"
      >
        <div className="bg-primary/10 rounded-full p-6 mb-6">
          {hasFilters ? (
            <Search className="w-12 h-12 text-primary" />
          ) : (
            <BookOpen className="w-12 h-12 text-primary" />
          )}
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {hasFilters ? "No courses match your filters" : "No courses available yet"}
        </h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {hasFilters 
            ? "Try adjusting your search terms or removing some filters"
            : "Check back soon - new courses are added regularly"}
        </p>
        {hasFilters && (
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/courses'
            }}
          >
            Clear all filters
          </Button>
        )}
      </motion.div>
    )
  }

  // Main content
  return (
    <div className="w-full space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab as any} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="newest">Newest</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn("px-2.5", viewMode === "grid" && "bg-muted")}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn("px-2.5", viewMode === "list" && "bg-muted")}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Course grid */}
      <div className={cn(
        "grid gap-6",
        viewMode === "grid" 
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "grid-cols-1"
      )}>
        {coursesData?.pages?.map((page: CoursesResponse, i: number) => (
          <React.Fragment key={i}>
            {page.courses?.map((course: Course) => (
              <MemoizedCourseCard
                key={course.id}
                title={course.title || course.name || "Untitled Course"}
                description={course.description || "No description available"}
                rating={course.rating || 0}
                slug={course.slug || `course-${course.id}`}
                unitCount={course.unitCount || 0}
                lessonCount={course.lessonCount || 0}
                quizCount={course.quizCount || 0}
                viewCount={course.viewCount || 0}
                category={course.category || ""}
                duration={course.duration || "4-6 weeks"}
                image={course.image}
                difficulty={course.difficulty as "Beginner" | "Intermediate" | "Advanced"}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Load more */}
      {hasNextPage && (
        <div 
          ref={loadMoreRef}
          className="flex justify-center py-8"
        >
          {isFetchingNextPage ? (
            <GlobalLoader />
          ) : (
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={!hasNextPage || isFetchingNextPage}
            >
              Load more courses
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
