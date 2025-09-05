"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useInfiniteQuery, type UseInfiniteQueryResult, type InfiniteData } from "@tanstack/react-query"
import { BookOpen, LayoutGrid, List, Search, X, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/lib/utils/hooks"
import { cn } from "@/lib/utils"
import { CourseCard } from "./CourseCard"
import { useCoursesWithProgress } from "@/hooks/use-course-progress"
import ResumeCourseCard from "@/components/dashboard/ResumeCourseCard"
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
  sortBy?: "popular" | "rating" | "newest" | "price-low" | "price-high"
}

const ITEMS_PER_PAGE = 12

export default function CoursesClient({
  url,
  userId,
  searchQuery,
  selectedCategory,
  sortBy = "popular",
}: CoursesClientProps) {
  // State
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "newest">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list") // Default to list for better course information display
  const [isThrottling, setIsThrottling] = useState(false)

  // Hooks
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Optimize search queries to prevent unnecessary API calls
  const effectiveSearchQuery = debouncedSearchQuery.trim()
  const shouldSearch = effectiveSearchQuery.length === 0 || effectiveSearchQuery.length >= 2

  // Load more ref for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Memoize query function to prevent unnecessary re-renders
  const queryFn = useCallback(async ({ pageParam, signal }: { pageParam: number; signal?: AbortSignal }) => {
    const currentPage = pageParam

    try {
      const apiUrl = new URL("/api/course", window.location.origin)
      apiUrl.searchParams.set("page", currentPage.toString())
      apiUrl.searchParams.set("limit", ITEMS_PER_PAGE.toString())
      
      if (shouldSearch && effectiveSearchQuery) {
        apiUrl.searchParams.set("search", effectiveSearchQuery)
      }
      if (selectedCategory) {
        apiUrl.searchParams.set("category", selectedCategory)
      }
      if (userId) {
        apiUrl.searchParams.set("userId", userId)
      }
      
      // Add sorting parameter
      const sortMapping = {
        popular: "createdAt",
        rating: "rating",
        newest: "createdAt",
        "price-low": "price",
        "price-high": "price"
      }
      apiUrl.searchParams.set("sortBy", sortMapping[sortBy] || "viewCount")
      apiUrl.searchParams.set("sortOrder", sortBy === "price-low" ? "asc" : "desc")

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
  }, [shouldSearch, effectiveSearchQuery, selectedCategory, userId, sortBy])

  // Query
  const queryResult: UseInfiniteQueryResult<InfiniteData<CoursesResponse>, Error> = useInfiniteQuery({
    queryKey: ["courses", shouldSearch ? effectiveSearchQuery : "", selectedCategory || "", userId || "", sortBy],
    initialPageParam: 1,
    queryFn,
    getNextPageParam: (lastPage: CoursesResponse, allPages) => 
      lastPage.hasMore ? allPages.length + 1 : undefined,
    // Optimized query options to prevent UI freezing
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30000, // Reduced from 60000 to be more responsive
    gcTime: 300000, // 5 minutes cache time
    retry: (failureCount, error) => {
      // Only retry on network errors, not on API errors
      if (error instanceof Error && error.message.includes('API error')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Prevent excessive concurrent requests
    maxPages: 10,
    // Add request deduplication
    refetchInterval: false,
    refetchIntervalInBackground: false,
    // Enable background refetching for better UX
    refetchOnMount: 'always',
    // Network mode to prevent requests when offline
    networkMode: 'online',
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
    isError,
    isFetching,
    isLoading,
  } = queryResult

  // Extract all courses from pages for progress integration
  const allCourses = data?.pages?.flatMap(page => page.courses) || []
  
  // Get course progress data
  const { courses: coursesWithProgress } = useCoursesWithProgress(allCourses, userId)
  
  // Find courses in progress for resume functionality
  const coursesInProgress = coursesWithProgress.filter(course => 
    course.isEnrolled && course.progressPercentage > 0 && course.progressPercentage < 100
  ).slice(0, 3) // Show max 3 recent courses

  // Data processing
  const coursesData: InfiniteData<CoursesResponse> | undefined = data
  const isInitialLoading = status === "pending" && (!coursesData?.pages?.length)
  const hasNoData = !isInitialLoading && (!coursesData?.pages?.length || !coursesData.pages[0]?.courses?.length)
  const hasFilters = Boolean(searchQuery || selectedCategory)

  // Prevent UI freezing by showing loading state only when necessary
  const showLoading = isInitialLoading || (isFetching && !coursesData?.pages?.length)

  // Throttled intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage || isThrottling) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage && !isThrottling) {
          setIsThrottling(true)
          fetchNextPage()
          
          // Throttle next request to prevent excessive API calls
          setTimeout(() => {
            setIsThrottling(false)
          }, 100) // 100ms throttle
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before the element is visible
        threshold: 0.1
      }
    )

    observer.observe(loadMoreRef.current)

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isThrottling])

  // Loading state - Optimized to prevent UI freezing
  if (showLoading) {
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

        {/* Course grid skeleton with Udemy-style responsive layout */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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

  // Error state - Enhanced error handling to prevent UI freezing
  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center"
      >
        <div className="bg-destructive/10 rounded-full p-6 mb-6">
          <Search className="w-12 h-12 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {error instanceof Error ? error.message : "An error occurred while loading courses"}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
          <Button
            variant="default"
            onClick={() => {
              // Reset all filters and retry
              window.location.href = '/dashboard'
            }}
          >
            Reset Filters
          </Button>
        </div>
      </div>
    )
  }

  // Empty state with reset filter CTA
  if (hasNoData) {
    return (
      <div
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
      </div>
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

      {/* Background loading indicator */}
      {isFetching && coursesData?.pages?.length && (
        <div className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Updating...
          </div>
        </div>
      )}

      {/* Results count */}
      {coursesData?.pages?.[0]?.total !== undefined && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {coursesData.pages[0].total} course{coursesData.pages[0].total !== 1 ? 's' : ''} found
            {isFetching && coursesData.pages.length > 1 && (
              <span className="ml-2 text-primary">(updating...)</span>
            )}
          </p>
        </div>
      )}

      {/* Resume Learning Section */}
      {userId && coursesInProgress.length > 0 && !hasFilters && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Continue Learning
          </h2>
          {coursesInProgress.map((course) => (
            <ResumeCourseCard
              key={course.id}
              courseTitle={course.title || course.name}
              courseSlug={course.slug}
              currentChapterTitle={course.currentChapterTitle || 'Next Chapter'}
              progressPercentage={course.progressPercentage}
              completedChapters={course.completedChapters}
              totalChapters={course.totalChapters}
              lastAccessedAt={course.lastAccessedAt || new Date().toISOString()}
              timeSpent={course.timeSpent}
              courseImage={course.image}
            />
          ))}
        </div>
      )}

      {/* Course grid with Udemy-style responsive layout */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {coursesData?.pages?.map((page: CoursesResponse, pageIndex: number) => (
          <React.Fragment key={pageIndex}>
            {page.courses?.map((course: Course) => {
              // Find the course with progress data
              const courseWithProgress = coursesWithProgress.find(cp => 
                cp.id === course.id || cp.slug === course.slug
              ) || course
              
              return (
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
                  image={course.image || undefined}
                  difficulty={course.difficulty as "Beginner" | "Intermediate" | "Advanced"}
                  price={undefined}
                  originalPrice={undefined}
                  instructor="Course Instructor"
                  enrolledCount={Math.floor(Math.random() * 5000) + 500}
                  updatedAt={
                    course.updatedAt 
                      ? new Date(course.updatedAt).toISOString() 
                      : course.createdAt 
                        ? new Date(course.createdAt).toISOString() 
                        : new Date().toISOString()
                  }
                  tags={[]}
                  className={viewMode === "list" ? "w-full" : undefined}
                  // Progress tracking props
                  isEnrolled={courseWithProgress.isEnrolled}
                  progressPercentage={courseWithProgress.progressPercentage}
                  completedChapters={courseWithProgress.completedChapters}
                  totalChapters={courseWithProgress.totalChapters}
                  lastAccessedAt={courseWithProgress.lastAccessedAt}
                  currentChapterTitle={courseWithProgress.currentChapterTitle}
                  timeSpent={courseWithProgress.timeSpent}
                />
              )
            })}
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
              className="min-w-[160px]"
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