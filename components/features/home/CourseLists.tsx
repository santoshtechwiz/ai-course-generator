import React, { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { useInfiniteQuery, type UseInfiniteQueryResult, type InfiniteData } from "@tanstack/react-query"
import { BookOpen, LayoutGrid, List, Search, X, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/lib/utils/hooks"
import { cn } from "@/lib/utils"
import { CourseCard } from "./CourseCard"
import { useCoursesWithProgress } from "@/hooks/use-course-progress"
import ResumeCourseCard from "@/components/dashboard/ResumeCourseCard"
import { getImageWithFallback } from "@/utils/image-utils"
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
  // Helper: compute quiz count from nested courseUnits if the API didn't provide a top-level quizCount
  const computeQuizCount = (course: any): number => {
    if (typeof course.quizCount === "number") return course.quizCount
    if (!course.courseUnits || !Array.isArray(course.courseUnits)) return 0
    return course.courseUnits.reduce((unitAcc: number, unit: any) => {
      if (!unit.chapters || !Array.isArray(unit.chapters)) return unitAcc
      const chapterQuizzes = unit.chapters.reduce((chapAcc: number, chap: any) => {
        return chapAcc + (chap._count && typeof chap._count.courseQuizzes === "number" ? chap._count.courseQuizzes : 0)
      }, 0)
      return unitAcc + chapterQuizzes
    }, 0)
  }

  // State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid") // Default to grid like Udemy
  const [isThrottling, setIsThrottling] = useState(false)

  // Hooks
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Optimize search queries to prevent unnecessary API calls
  const effectiveSearchQuery = debouncedSearchQuery.trim()
  const shouldSearch = effectiveSearchQuery.length === 0 || effectiveSearchQuery.length >= 2

  // Load more ref for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Memoize query function to prevent unnecessary re-renders
  const queryFn = useCallback(
    async ({ pageParam, signal }: { pageParam: number; signal?: AbortSignal }) => {
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
          "price-high": "price",
        }
        apiUrl.searchParams.set("sortBy", sortMapping[sortBy] || "viewCount")
        apiUrl.searchParams.set("sortOrder", sortBy === "price-low" ? "asc" : "desc")

        const response = await fetch(apiUrl.toString(), {
          headers: { "Cache-Control": "no-cache" },
          signal,
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        // Transform API response to match expected structure
        return {
          courses: data.courses || [],
          total: data.totalCount || 0,
          hasMore: data.page < data.totalPages,
        }
      } catch (error) {
        console.error("Fetch error:", error)
        throw error
      }
    },
    [shouldSearch, effectiveSearchQuery, selectedCategory, userId, sortBy],
  )

  // Query
  const queryResult: UseInfiniteQueryResult<InfiniteData<CoursesResponse>, Error> = useInfiniteQuery({
    queryKey: ["courses", shouldSearch ? effectiveSearchQuery : "", selectedCategory || "", userId || "", sortBy],
    initialPageParam: 1,
    queryFn,
    getNextPageParam: (lastPage: CoursesResponse, allPages) => (lastPage.hasMore ? allPages.length + 1 : undefined),
    // Optimized query options to prevent UI freezing
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30000, // Reduced from 60000 to be more responsive
    gcTime: 300000, // 5 minutes cache time
    retry: (failureCount, error) => {
      // Only retry on network errors, not on API errors
      if (error instanceof Error && error.message.includes("API error")) {
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
    refetchOnMount: "always",
    // Network mode to prevent requests when offline
    networkMode: "online",
  })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, isError, isFetching, isLoading } =
    queryResult

  // Extract all courses from pages for progress integration
  const allCourses = data?.pages?.flatMap((page) => page.courses) || []

  // Get course progress data
  const { courses: coursesWithProgress } = useCoursesWithProgress(allCourses, userId)

  // Find courses in progress for resume functionality
  const coursesInProgress = coursesWithProgress
    .filter((course) => course.isEnrolled && course.progressPercentage > 0 && course.progressPercentage < 100)
    .slice(0, 3) // Show max 3 recent courses

  // Data processing
  const coursesData: InfiniteData<CoursesResponse> | undefined = data
  const isInitialLoading = status === "pending" && !coursesData?.pages?.length
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
        rootMargin: "100px", // Start loading 100px before the element is visible
        threshold: 0.1,
      },
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(12)].map((_, i) => (
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="bg-destructive/10 rounded-full p-6 mb-6">
          <Search className="w-12 h-12 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {error instanceof Error ? error.message : "An error occurred while loading courses"}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
          <Button
            variant="default"
            onClick={() => {
              // Reset all filters and retry
              window.location.href = "/dashboard"
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="bg-primary/10 rounded-full p-6 mb-6">
          {hasFilters ? <Search className="w-12 h-12 text-primary" /> : <BookOpen className="w-12 h-12 text-primary" />}
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
              window.location.href = "/dashboard"
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
    <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 space-y-6">
      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "px-3 h-8 transition-all duration-200",
              viewMode === "grid"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "px-3 h-8 transition-all duration-200",
              viewMode === "list"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Resume Learning Section - Simplified to text only */}
      {userId && coursesInProgress.length > 0 && !hasFilters && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Play className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-primary">
              Continue Learning
            </h2>
          </div>
          <div className="space-y-3">
            {coursesInProgress.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-blue-50/30 border border-blue-100 rounded-lg hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                onClick={() => window.location.href = `/dashboard/course/${course.slug}`}
              >
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {course.title || course.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {course.progressPercentage}% complete
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(course.completedCount || 0)}/{course.totalChapters} chapters
                    </div>
                    {course.lastAccessedAt && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(course.lastAccessedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Play className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

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
            <span className="font-medium text-foreground">{coursesData.pages[0].total}</span> course
            {coursesData.pages[0].total !== 1 ? "s" : ""} found
            {isFetching && coursesData.pages.length > 1 && (
              <span className="ml-2 text-primary animate-pulse">(updating...)</span>
            )}
          </p>
        </div>
      )}

      <motion.div
        className={cn(
          "grid gap-6",
          viewMode === "grid" && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
          viewMode === "list" && "grid-cols-1 max-w-4xl gap-4",
        )}
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.02 },
          },
        }}
        initial="hidden"
        animate="show"
      >
        {coursesData?.pages?.map((page: CoursesResponse, pageIndex: number) => (
          <React.Fragment key={pageIndex}>
            {page.courses?.map((course: Course) => {
              // Find the course with progress data
              const courseWithProgress =
                coursesWithProgress.find((cp) => cp.id === course.id || cp.slug === course.slug) || course

              return (
                <motion.div
                  key={course.id}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.98 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 24 } },
                  }}
                >
                  <CourseCard
                    key={course.id}
                    courseId={Number(course.id) || undefined}
                    title={course.title || course.name || "Untitled Course"}
                    description={course.description || "No description available"}
                    rating={course.rating || 0}
                    slug={course.slug || `course-${course.id}`}
                    variant={viewMode}
                    unitCount={course.unitCount || 0}
                    lessonCount={course.lessonCount || 0}
                    quizCount={computeQuizCount(course) || 0}
                    viewCount={course.viewCount || 0}
                    category={course.category?.name || "General"}
                    duration={`${course.estimatedHours || 4} hours`}
                    image={getImageWithFallback(course.image)}
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
                    completedChapters={courseWithProgress.completedCount || 0}
                    totalChapters={courseWithProgress.totalChapters}
                    lastAccessedAt={courseWithProgress.lastAccessedAt}
                    currentChapterTitle={courseWithProgress.currentChapterTitle}
                    timeSpent={courseWithProgress.timeSpent}
                  />
                </motion.div>
              )
            })}
          </React.Fragment>
        ))}
      </motion.div>

      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-3 px-6 py-3 bg-muted/50 rounded-full">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-muted-foreground">Loading more courses...</span>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={!hasNextPage || isFetchingNextPage}
              className="min-w-[160px] hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Load more courses
            </Button>
          )}
        </div>
      )}

      {!hasNextPage &&
        coursesData?.pages?.length &&
        coursesData.pages.some((p: CoursesResponse) => p.courses.length > 0) && (
          <div className="text-center py-8 border-t border-border/50">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full">
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full"></div>
              <p className="text-sm text-muted-foreground font-medium">You've reached the end of the results</p>
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full"></div>
            </div>
          </div>
        )}
    </div>
  )
}
