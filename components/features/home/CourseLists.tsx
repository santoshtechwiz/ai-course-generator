"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useInfiniteQuery, type UseInfiniteQueryResult, type InfiniteData } from "@tanstack/react-query"
import { BookOpen, LayoutGrid, List, Search, X, Play, ChevronDown, Filter, Clock, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/lib/utils/hooks"
import { cn } from "@/lib/utils"
import { CourseCard } from "./CourseCard"
import { getImageWithFallback } from "@/utils/image-utils"
import type { CategoryId } from "@/config/categories"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { BaseListLayout } from "@/components/shared/BaseListLayout"

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
  showMobileFilters?: boolean
  onCloseMobileFilters?: () => void
}

const ITEMS_PER_PAGE = 8 // Reduced from 12 for faster initial load

export default function CoursesClient({
  url,
  userId,
  searchQuery,
  selectedCategory,
  sortBy = "popular",
  showMobileFilters = false,
  onCloseMobileFilters,
}: CoursesClientProps) {
  // Local filter state (kept client-side to drive UI and query)
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | null>(selectedCategory || null)
  const [levelFilter, setLevelFilter] = useState<string | null>(null)
  // instructor filter removed per design
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined)
  const [sortFilter, setSortFilter] = useState<typeof sortBy>(sortBy)
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

  // Helper: compute unit count and lesson count from nested structure if missing
  const computeUnitAndLessonCounts = (course: any) => {
    const unitCount =
      typeof course.unitCount === "number" && course.unitCount > 0
        ? course.unitCount
        : Array.isArray(course.courseUnits)
          ? course.courseUnits.length
          : 0

    let lessonCount = 0
    if (typeof course.lessonCount === "number" && course.lessonCount > 0) {
      lessonCount = course.lessonCount
    } else if (Array.isArray(course.courseUnits)) {
      for (const unit of course.courseUnits) {
        if (Array.isArray(unit.chapters)) {
          lessonCount += unit.chapters.length
        }
      }
    }

    return { unitCount, lessonCount }
  }

  // State
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("courseViewMode") as "grid" | "list") || "grid"
    }
    return "grid"
  })
  const [isThrottling, setIsThrottling] = useState(false)
  const [filtersCollapsed, setFiltersCollapsed] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    localStorage.setItem("courseViewMode", viewMode)
  }, [viewMode])

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
        if (categoryFilter) {
          apiUrl.searchParams.set("category", String(categoryFilter))
        }
        if (levelFilter) {
          apiUrl.searchParams.set("level", String(levelFilter))
        }
        // instructor filter intentionally removed
        if (typeof ratingFilter === "number") {
          apiUrl.searchParams.set("minRating", String(ratingFilter))
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
        apiUrl.searchParams.set("sortBy", sortMapping[sortFilter] || "viewCount")
        apiUrl.searchParams.set("sortOrder", sortFilter === "price-low" ? "asc" : "desc")

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
    [shouldSearch, effectiveSearchQuery, categoryFilter, levelFilter, ratingFilter, userId, sortFilter],
  )

  // Query
  const queryResult: UseInfiniteQueryResult<InfiniteData<CoursesResponse>, Error> = useInfiniteQuery({
    queryKey: [
      "courses",
      shouldSearch ? effectiveSearchQuery : "",
      categoryFilter || "",
      levelFilter || "",
      // instructorFilter removed
      ratingFilter || "",
      userId || "",
      sortFilter,
    ],
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

  // Derive available filters from loaded courses for the sidebar selects
  const availableCategories = Array.from(
    new Set(
      allCourses
        .map((c: any) => (c.category ? (typeof c.category === "object" ? c.category.name : c.category) : null))
        .filter(Boolean),
    ),
  ) as string[]
  // availableInstructors removed - instructor filter intentionally omitted

  // Get course progress data - simplified without hook
  const coursesWithProgress = allCourses

  // Find courses in progress for resume functionality
  const coursesInProgress = coursesWithProgress
    .filter((course: any) => course.isEnrolled && course.progressPercentage > 0 && course.progressPercentage < 100)
    .slice(0, 3) // Show max 3 recent courses

  // Data processing
  const coursesData: InfiniteData<CoursesResponse> | undefined = data
  const isInitialLoading = status === "pending" && !coursesData?.pages?.length
  const hasNoData = !isInitialLoading && (!coursesData?.pages?.length || !coursesData.pages[0]?.courses?.length)
  const hasFilters = Boolean(searchQuery || selectedCategory || categoryFilter || levelFilter) // Updated to include local filters

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

  if (showLoading) {
    return (
      <div className="w-full space-y-6">
        {/* Controls skeleton */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Skeleton className="h-10 w-32 rounded-none" />
              <Skeleton className="h-10 w-32 rounded-none" />
              <Skeleton className="h-10 w-32 rounded-none" />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Skeleton className="h-9 w-9 rounded-none" />
              <Skeleton className="h-9 w-9 rounded-none" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
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

  if (hasNoData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-primary/10 rounded-2xl p-8 mb-6 border-4 border-primary/20 shadow-[6px_6px_0px_0px_hsl(var(--border))]"
        >
          {hasFilters ? (
            <Search className="w-16 h-16 text-primary mx-auto" />
          ) : (
            <BookOpen className="w-16 h-16 text-primary mx-auto" />
          )}
        </motion.div>
        <h3 className="text-2xl font-bold mb-3 text-balance">
          {hasFilters ? "No courses match your filters" : "No courses available yet"}
        </h3>
        <p className="text-muted-foreground max-w-md mb-8 text-pretty leading-relaxed text-base">
          {hasFilters
            ? "Try adjusting your search terms or removing some filters to see more results"
            : "Check back soon - new courses are added regularly"}
        </p>
        {hasFilters && (
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <Button
              variant="default"
              size="lg"
              onClick={() => {
                window.location.href = "/dashboard"
              }}
              className="flex items-center gap-2 w-full"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </Button>
            <div className="mt-4">
              <p className="text-sm font-semibold text-muted-foreground mb-4">Try these popular categories:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["JavaScript", "Python", "React", "Machine Learning"].map((cat) => (
                  <Badge
                    key={cat}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105 px-3 py-1.5 text-sm"
                    onClick={() => (window.location.href = `/dashboard?category=${cat}`)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div className="p-4 bg-card border border-border rounded-none neo-shadow">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-black flex items-center gap-2 text-[hsl(var(--foreground))]">
            <Filter className="w-4 h-4 text-[hsl(var(--primary))]" />
            Filters
          </h4>
          {(categoryFilter || levelFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategoryFilter(null)
                setLevelFilter(null)
              }}
              className="h-7 px-2 text-xs hover:bg-[hsl(var(--destructive))]/10 hover:text-[hsl(var(--destructive))] border-2 border-[hsl(var(--border))] rounded-none"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[hsl(var(--foreground))] mb-2" htmlFor="category-filter">
              Category
            </label>
            <select
              id="category-filter"
              value={categoryFilter ?? ""}
              onChange={(e) => setCategoryFilter(e.target.value ? (e.target.value as CategoryId) : null)}
              className="w-full p-2.5 rounded-none border-4 bg-[hsl(var(--background))] border-[hsl(var(--border))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] focus:outline-none transition-all text-sm shadow-[2px_2px_0_0_rgba(0,0,0,0.9)]"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-[hsl(var(--foreground))] mb-2" htmlFor="level-filter">
              Level
            </label>
            <select
              id="level-filter"
              value={levelFilter ?? ""}
              onChange={(e) => setLevelFilter(e.target.value || null)}
              className="w-full p-2.5 rounded-none border-4 bg-[hsl(var(--background))] border-[hsl(var(--border))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] focus:outline-none transition-all text-sm shadow-[2px_2px_0_0_rgba(0,0,0,0.9)]"
              aria-label="Filter by level"
            >
              <option value="">All Levels</option>
              <option value="Beginner">🌱 Beginner</option>
              <option value="Intermediate">⚡ Intermediate</option>
              <option value="Advanced">🚀 Advanced</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 bg-card border border-border rounded-none neo-shadow">
        <h4 className="text-base font-black mb-4 flex items-center gap-2 text-[hsl(var(--foreground))]">
          <ChevronDown className="w-4 h-4 text-[hsl(var(--primary))]" />
          Sort By
        </h4>
        <div className="flex flex-col space-y-2.5">
          {[
            { value: "popular", label: "Most Popular", icon: "🔥" },
            { value: "newest", label: "Newest First", icon: "✨" },
            { value: "rating", label: "Highest Rated", icon: "⭐" },
          ].map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex items-center gap-3 cursor-pointer p-3 rounded-none border-4 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,0.9)]",
                sortFilter === option.value
                  ? "bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))] text-[hsl(var(--primary))] font-black"
                  : "bg-[hsl(var(--background))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50 hover:bg-[hsl(var(--primary))]/5 hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.9)]",
              )}
            >
              <input
                type="radio"
                name="sort"
                checked={sortFilter === option.value}
                onChange={() => setSortFilter(option.value as typeof sortBy)}
                className="accent-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))] w-4 h-4"
              />
              <span className="text-sm flex items-center gap-2 font-bold">
                <span>{option.icon}</span>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  // BaseListLayout content extraction
  const headerTitle = "Courses"
  const headerDescription = "Explore our comprehensive collection of courses"
  const headerIcon = <BookOpen className="h-6 w-6 text-[hsl(var(--primary-foreground))]" />

  const searchPlaceholder = "Search courses..."
  const resultCount = coursesData?.pages?.[0]?.total

  const filterSidebarContent = <FilterSidebar />

  // Main content
  return (
    <BaseListLayout
      title={headerTitle}
      description={headerDescription}
      icon={headerIcon}
      searchValue={searchQuery}
      onSearchChange={() => {}} // Search is handled by parent component
      searchPlaceholder={searchPlaceholder}
      resultCount={resultCount}
      filterSidebar={filterSidebarContent}
      contentGrid={
        <div className="space-y-8">
          {/* Continue Learning Section */}
          {userId && coursesInProgress.length > 0 && !hasFilters && (
            <motion.section
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
              className="p-6 bg-[hsl(var(--primary))]/10 border-4 border-[hsl(var(--primary))]/20 rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.9)]"
              aria-label="Continue learning"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-[hsl(var(--primary))]/20 rounded-xl border-2 border-[hsl(var(--primary))]/30">
                  <Play className="h-6 w-6 text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[hsl(var(--primary))]">Continue Learning</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] font-medium">Pick up where you left off</p>
                </div>
              </div>
              <div className="space-y-3">
                {coursesInProgress.map((course: any, index: number) => (
                  <motion.div
                    key={course.id}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : index * 0.1 }}
                    whileHover={shouldReduceMotion ? {} : { x: 6, scale: 1.01 }}
                    className="flex items-center justify-between p-5 bg-[hsl(var(--background))] border-4 border-[hsl(var(--primary))]/10 rounded-xl hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.9)] hover:border-[hsl(var(--primary))]/30 transition-all cursor-pointer group"
                    onClick={() => (window.location.href = `/dashboard/course/${course.slug}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        window.location.href = `/dashboard/course/${course.slug}`
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-[hsl(var(--foreground))] truncate group-hover:text-[hsl(var(--primary))] transition-colors mb-2">
                        {course.title || course.name}
                      </h3>
                      <div className="flex items-center gap-5 flex-wrap">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2.5 h-2.5 bg-[hsl(var(--primary))] rounded-full animate-pulse"></div>
                          <span className="font-bold text-[hsl(var(--primary))]">{course.progressPercentage}%</span>
                          <span className="text-[hsl(var(--muted-foreground))]">complete</span>
                        </div>
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">
                          <span className="font-semibold text-[hsl(var(--foreground))]">{course.completedCount || 0}</span>/
                          {course.totalChapters} chapters
                        </div>
                        {course.lastAccessedAt && (
                          <div className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(course.lastAccessedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[hsl(var(--primary))]/10 rounded-xl flex items-center justify-center group-hover:bg-[hsl(var(--primary))]/20 group-hover:scale-110 transition-all border-2 border-[hsl(var(--primary))]/20">
                        <Play className="h-5 w-5 text-[hsl(var(--primary))]" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Background loading indicator */}
          {isFetching && coursesData?.pages?.length && (
            <div
              className="fixed top-4 right-4 z-50 bg-[hsl(var(--background))]/80 backdrop-blur-sm border-4 border-[hsl(var(--border))] rounded-none px-3 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,0.9)]"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <div className="w-3 h-3 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                <span>Updating...</span>
              </div>
            </div>
          )}

          {/* Course count display */}
          {coursesData?.pages?.[0]?.total !== undefined && (
            <div className="flex items-center justify-between p-4 bg-[hsl(var(--muted))]/30 rounded-xl border-4 border-[hsl(var(--border))]/50">
              <p className="text-sm font-medium">
                <span className="font-bold text-[hsl(var(--foreground))] text-lg">{coursesData.pages[0].total}</span>
                <span className="text-[hsl(var(--muted-foreground))] ml-2">
                  course{coursesData.pages[0].total !== 1 ? "s" : ""} found
                </span>
                {isFetching && coursesData.pages.length > 1 && (
                  <span className="ml-3 text-[hsl(var(--primary))] animate-pulse font-semibold">(updating...)</span>
                )}
              </p>
            </div>
          )}

          {/* View mode toggle */}
          <div className="flex justify-end">
            <div
              className="flex items-center gap-1 bg-[hsl(var(--muted))]/50 rounded-xl p-1.5 border-4 border-[hsl(var(--border))]/50"
              role="group"
              aria-label="View mode"
            >
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "px-4 h-9 transition-all duration-200 rounded-none",
                  viewMode === "grid"
                    ? "bg-[hsl(var(--background))] shadow-[2px_2px_0_0_rgba(0,0,0,0.9)] text-[hsl(var(--foreground))] font-semibold"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--background))]/50",
                )}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Grid
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "px-4 h-9 transition-all duration-200 rounded-none",
                  viewMode === "list"
                    ? "bg-[hsl(var(--background))] shadow-[2px_2px_0_0_rgba(0,0,0,0.9)] text-[hsl(var(--foreground))] font-semibold"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--background))]/50",
                )}
                onClick={() => setViewMode("list")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </div>

          {/* Courses Grid */}
          <motion.div
            className={cn(
              "grid gap-4 sm:gap-6",
              // Mobile-first responsive grid
              viewMode === "grid" && "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
              viewMode === "list" && "grid-cols-1 max-w-4xl gap-3 sm:gap-4",
            )}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: shouldReduceMotion ? 0 : 0.05,
                  delayChildren: shouldReduceMotion ? 0 : 0.02,
                },
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
                    coursesWithProgress.find((cp: any) => cp.id === course.id || cp.slug === course.slug) || course

                  return (
                    <motion.div
                      key={course.id}
                      variants={{
                        hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.98 },
                        show: shouldReduceMotion
                          ? { opacity: 1 }
                          : {
                              opacity: 1,
                              y: 0,
                              scale: 1,
                              transition: { type: "spring", stiffness: 260, damping: 24 },
                            },
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
                        {...(() => {
                          const counts = computeUnitAndLessonCounts(course)
                          return {
                            unitCount: counts.unitCount,
                            lessonCount: counts.lessonCount,
                            quizCount: computeQuizCount(course) || 0,
                          }
                        })()}
                        viewCount={course.viewCount || 0}
                        category={course.category?.name || "General"}
                        duration={`${course.estimatedHours || 4} hours`}
                        image={getImageWithFallback(course.image)}
                        difficulty={course.difficulty as "Beginner" | "Intermediate" | "Advanced"}
                        price={undefined}
                        originalPrice={undefined}
                        instructor="Course Instructor"
                        enrolledCount={Math.floor(Math.random() * 5000) + 500}
                        tags={[]}
                        className={viewMode === "list" ? "w-full" : undefined}
                        // Progress tracking props
                        isEnrolled={(courseWithProgress as any).isEnrolled}
                        progressPercentage={(courseWithProgress as any).progressPercentage}
                        completedChapters={(courseWithProgress as any).completedCount || 0}
                        totalChapters={(courseWithProgress as any).totalChapters}
                        lastAccessedAt={(courseWithProgress as any).lastAccessedAt}
                        currentChapterTitle={(courseWithProgress as any).currentChapterTitle}
                        timeSpent={(courseWithProgress as any).timeSpent}
                      />
                    </motion.div>
                  )
                })}
              </React.Fragment>
            ))}
          </motion.div>

          {/* Load more */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex flex-col items-center gap-4 py-12">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-3 px-8 py-4 bg-[hsl(var(--primary))]/10 rounded-full border-4 border-[hsl(var(--primary))]/20">
                  <div className="w-5 h-5 border-3 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-semibold text-[hsl(var(--primary))]">Loading more courses...</span>
                </div>
              ) : (
                <>
                  <div className="text-sm text-[hsl(var(--muted-foreground))] mb-2 font-medium">Scroll for more or click below</div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => fetchNextPage()}
                    disabled={!hasNextPage || isFetchingNextPage}
                    className="min-w-[200px] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] hover:border-[hsl(var(--primary))] transition-all hover:scale-105 font-semibold border-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.9)]"
                  >
                    Load more courses
                  </Button>
                </>
              )}
            </div>
          )}

          {/* End of results */}
          {!hasNextPage &&
            coursesData?.pages?.length &&
            coursesData.pages.some((p: CoursesResponse) => p.courses.length > 0) && (
              <div className="text-center py-12 border-t-4 border-[hsl(var(--border))]/50">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-[hsl(var(--muted))]/50 rounded-full border-4 border-[hsl(var(--border))]/50">
                  <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] font-semibold">You've reached the end of the results</p>
                  <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full"></div>
                </div>
              </div>
            )}
        </div>
      }
    />
  )
}
