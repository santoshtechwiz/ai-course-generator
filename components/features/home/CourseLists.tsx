"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useInfiniteQuery, type UseInfiniteQueryResult } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { BookOpen, LayoutGrid, List, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebounce } from "@/lib/utils/hooks"
import { cn } from "@/lib/utils"
import { CourseCard } from "./CourseCard"
import { CategoryTagCloud } from "./CategoryTagCloud"
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
  category?: CategoryId | { id: string; name: string } | null
  duration?: string
  createdAt: string
  difficulty?: string
  price?: number
  originalPrice?: number
  instructor?: string
  enrolledCount?: number
  updatedAt?: string
  tags?: string[]
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

export default function CoursesClient({
  url,
  userId,
  searchQuery,
  selectedCategory,
  ratingFilter = 0,
}: CoursesClientProps) {
  // State
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "newest">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list") // Default to list for Udemy-style
  
  // Hooks
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Query
  const queryResult: UseInfiniteQueryResult<CoursesResponse, Error> = useInfiniteQuery({
    queryKey: ["courses", debouncedSearchQuery || "", selectedCategory || "", userId || "", ratingFilter, activeTab],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const currentPage = pageParam as number

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
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        
        // Ensure the response matches expected structure
        return {
          courses: data.courses || [],
          total: data.total || 0,
          hasMore: data.hasMore !== undefined ? data.hasMore : (data.courses?.length === ITEMS_PER_PAGE)
        }
      } catch (error) {
        console.error('Fetch error:', error)
        throw error
      }
    },
    getNextPageParam: (lastPage, allPages) => 
      lastPage.hasMore ? allPages.length + 1 : undefined,
    refetchOnWindowFocus: false,
    staleTime: 60000,
    retry: 2,
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
    isError,
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

  // Data processing
  const coursesData = data
  const isInitialLoading = status === "pending" && (!coursesData?.pages?.length)
  const hasNoData = !isInitialLoading && (!coursesData?.pages?.length || !coursesData.pages[0]?.courses?.length)
  const hasFilters = Boolean(searchQuery || selectedCategory || ratingFilter > 0)

  // Aggregate category counts (must be before conditional returns)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    coursesData?.pages?.forEach((page: CoursesResponse) => {
      page.courses?.forEach((c: Course) => {
        const id = typeof c.category === "object" ? c.category?.id : c.category
        if (id) counts[id] = (counts[id] ?? 0) + 1
      })
    })
    return counts
  }, [coursesData])

  // Loading state
  if (isInitialLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] w-full"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading courses...</p>
        </div>
      </motion.div>
    )
  }

  // Error state
  if (isError) {
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
      {/* Controls & Category Tag Cloud */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">All Courses</TabsTrigger>
                <TabsTrigger value="popular">Most Popular</TabsTrigger>
                <TabsTrigger value="newest">Recently Added</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn("px-3", viewMode === "grid" && "bg-muted")}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn("px-3", viewMode === "list" && "bg-muted")}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category Tag Cloud */}
        <div className="relative">
          <div 
            className="flex items-start gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent py-1 px-1 -mx-1" 
            role="navigation" 
            aria-label="Categories"
          >
            <CategoryTagCloud selectedCategory={selectedCategory} counts={categoryCounts} enableClear />
          </div>
          <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-background to-transparent" />
        </div>
      </div>

      {/* Results count */}
      {coursesData?.pages?.[0]?.total !== undefined && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {coursesData.pages[0].total} course{coursesData.pages[0].total !== 1 ? 's' : ''} found
          </p>
        </div>
      )}

      {/* Course grid/list */}
      <div className={cn(
        viewMode === "grid" 
          ? "grid gap-6 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3" 
          : "flex flex-col space-y-6"
      )}>
        {coursesData?.pages?.map((page: CoursesResponse, pageIndex: number) => (
          <React.Fragment key={pageIndex}>
            {page.courses?.map((course: Course) => (
              <CourseCard
                key={course.id}
                title={course.title || course.name || "Untitled Course"}
                description={course.description || "No description available"}
                rating={course.rating || 0}
                slug={course.slug || `course-${course.id}`}
                unitCount={course.unitCount || 0}
                lessonCount={course.lessonCount || 0}
                quizCount={course.quizCount || 0}
                viewCount={course.viewCount || 0}
                category={(typeof course.category === 'object' && course.category?.name ? course.category.name : (typeof course.category === 'string' ? course.category : "")) || "General"}
                duration={course.duration}
                image={course.image}
                difficulty={course.difficulty as "Beginner" | "Intermediate" | "Advanced"}
                price={course.price}
                originalPrice={course.originalPrice}
                instructor={course.instructor || "Course Instructor"}
                enrolledCount={course.enrolledCount || Math.floor(Math.random() * 5000) + 500}
                updatedAt={course.updatedAt || course.createdAt}
                tags={course.tags || []}
                className={viewMode === "list" ? "w-full" : undefined}
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
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading more courses...</span>
            </div>
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

      {/* No more results */}
      {!hasNextPage && coursesData?.pages?.length && coursesData.pages.some(p => p.courses.length > 0) && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            You've reached the end of the results
          </p>
        </div>
      )}
    </div>
  )
}