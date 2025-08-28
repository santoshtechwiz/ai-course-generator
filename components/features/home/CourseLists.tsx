"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useInfiniteQuery, type UseInfiniteQueryResult, type InfiniteData } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { BookOpen, LayoutGrid, List, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/lib/utils/hooks"
import { cn } from "@/lib/utils"
import { CourseCard } from "./CourseCard"
// import { CategoryTagCloud } from "./CategoryTagCloud" // REMOVED: Now used in sidebar
import type { CategoryId } from "@/config/categories"

// Types
interface Course {
  id: string
  name: string
  title: string
  description: string
  image: string | null
  rating: number
  slug: string
  viewCount: number
  categoryId?: string
  difficulty: string
  estimatedHours: number
  createdAt: string
  updatedAt: string
  category?: {
    id: string
    name: string
  } | null
  unitCount: number
  lessonCount: number
  quizCount: number
  userId: string
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

  // Load more ref for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Query
  const queryResult: UseInfiniteQueryResult<InfiniteData<CoursesResponse>, Error> = useInfiniteQuery({
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
        
        // Transform API response to match expected structure
        return {
          courses: data.courses || [],
          total: data.totalCount || 0,
          hasMore: data.page < data.totalPages
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

  // Data processing
  const coursesData: InfiniteData<CoursesResponse> | undefined = data
  const isInitialLoading = status === "pending" && (!coursesData?.pages?.length)
  const hasNoData = !isInitialLoading && (!coursesData?.pages?.length || !coursesData.pages[0]?.courses?.length)
  const hasFilters = Boolean(searchQuery || selectedCategory || ratingFilter > 0)

  // Loading state
  if (isInitialLoading) {
    return (
      <div className="w-full space-y-6">
        {/* Controls skeleton */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Course grid skeleton */}
        <div className={cn(
          "grid gap-6",
          "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        )}>
          {[...Array(8)].map((_, i) => (
            <CourseCard
              key={i}
              title=""
              description=""
              rating={0}
              slug=""
              unitCount={0}
              lessonCount={0}
              quizCount={0}
              viewCount={0}
              loading={true}
            />
          ))}
        </div>
      </div>
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

  // Empty state with reset filter CTA
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
            ? "Try adjusting your search terms or removing some filters to see more results"
            : "Check back soon - new courses are added regularly"}
        </p>
        {hasFilters && (
          <Button
            variant="outline"
            onClick={() => {
              // Reset filters by navigating to clean URL
              window.location.href = '/dashboard'
            }}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
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
                category={course.category?.name || "General"}
                duration={`${course.estimatedHours || 4} hours`}
                image={course.image}
                difficulty={course.difficulty as "Beginner" | "Intermediate" | "Advanced"}
                price={undefined}
                originalPrice={undefined}
                instructor="Course Instructor"
                enrolledCount={Math.floor(Math.random() * 5000) + 500}
                updatedAt={course.updatedAt ? new Date(course.updatedAt).toISOString() : course.createdAt ? new Date(course.createdAt).toISOString() : new Date().toISOString()}
                tags={[]}
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
      {!hasNextPage && coursesData?.pages?.length && coursesData.pages.some((p: CoursesResponse) => p.courses.length > 0) && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            You've reached the end of the results
          </p>
        </div>
      )}
    </div>
  )
}