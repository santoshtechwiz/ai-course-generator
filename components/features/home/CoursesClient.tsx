"use client"

import React, { useState, useCallback, useMemo } from "react"
import { useInfiniteQuery, type UseInfiniteQueryResult } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, LayoutGrid, List, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebounce } from "@/lib/utils/hooks"
import { cn } from "@/lib/utils"
import { CourseCard } from "./CourseCard"
import { CategoryTagCloud } from "./CategoryTagCloud"
import type { CategoryId } from "@/config/categories"
import { getImageWithFallback } from "@/utils/image-utils"

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

  // Query
  const queryResult: UseInfiniteQueryResult<any, Error> = useInfiniteQuery({
    queryKey: ["courses", debouncedSearchQuery || "", selectedCategory || "", userId || "", ratingFilter, activeTab],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const currentPage = pageParam as number
      // Legacy loader removed; relying on built-in query states + NProgress route transitions

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
          activeTab === "popular" ? "createdAt" : activeTab === "newest" ? "createdAt" : "createdAt",
        )
        apiUrl.searchParams.set("sortOrder", "desc")

        const response = await fetch(apiUrl.toString(), {
          headers: { "Cache-Control": "no-cache" },
          signal,
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        return response.json()
      } finally {
        // no-op: loader system removed
      }
    },
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length + 1 : undefined),
    refetchOnWindowFocus: false,
    staleTime: 60000,
  })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error } = queryResult

  // Infinite scroll
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !hasNextPage || isFetchingNextPage) return

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        },
        { rootMargin: "200px" },
      )

      observer.observe(node)
      return () => observer.disconnect()
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  // States
  const coursesData = data as any
  const isInitialLoading = status === "pending" && !coursesData?.pages?.length
  const hasNoData = !isInitialLoading && (!coursesData?.pages?.length || !coursesData.pages[0]?.courses?.length)
  const hasFilters = Boolean(searchQuery || selectedCategory || ratingFilter > 0)

  // Aggregate category counts early (must be before any conditional returns to preserve hook order)
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh] w-full"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-accent rounded-full animate-spin animate-reverse"
              style={{ animationDelay: "0.5s" }}
            />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-foreground">Discovering courses</h3>
            <p className="text-sm text-muted-foreground">Finding the perfect learning experiences for you...</p>
          </div>
        </div>
      </motion.div>
    )
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center"
      >
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-8 mb-6 max-w-md">
          <div className="bg-destructive/10 rounded-full p-4 w-fit mx-auto mb-4">
            <Search className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-foreground">Something went wrong</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            {error instanceof Error
              ? error.message
              : "We encountered an issue while loading courses. Please try again."}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
            Try again
          </Button>
        </div>
      </motion.div>
    )
  }

  // Empty state
  if (hasNoData) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center"
      >
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-12 max-w-lg">
          <div className="bg-primary/10 rounded-full p-6 w-fit mx-auto mb-6">
            {hasFilters ? (
              <Search className="w-12 h-12 text-primary" />
            ) : (
              <BookOpen className="w-12 h-12 text-primary" />
            )}
          </div>
          <h3 className="text-2xl font-semibold mb-4 text-foreground text-balance">
            {hasFilters ? "No courses match your search" : "Your learning journey awaits"}
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-8 text-pretty">
            {hasFilters
              ? "Try adjusting your search terms or exploring different categories to discover new learning opportunities."
              : "New courses are being added regularly. Check back soon to discover exciting new learning paths."}
          </p>
          {hasFilters && (
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/courses"
              }}
              className="px-6"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Explore all courses
            </Button>
          )}
        </div>
      </motion.div>
    )
  }

  // Main content
  return (
    <div className="w-full space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-3">
            <Tabs value={activeTab} onValueChange={setActiveTab as any} className="w-auto">
              <TabsList className="bg-muted/50 p-1 h-auto">
                <TabsTrigger value="all" className="px-4 py-2 text-sm font-medium">
                  All Courses
                </TabsTrigger>
                <TabsTrigger value="popular" className="px-4 py-2 text-sm font-medium">
                  Popular
                </TabsTrigger>
                <TabsTrigger value="newest" className="px-4 py-2 text-sm font-medium">
                  Latest
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "px-3 py-2 h-auto text-xs font-medium transition-all",
                  viewMode === "grid" && "bg-background shadow-sm",
                )}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                Grid
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "px-3 py-2 h-auto text-xs font-medium transition-all",
                  viewMode === "list" && "bg-background shadow-sm",
                )}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4 mr-1.5" />
                List
              </Button>
            </div>
          </div>
        </div>

    
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${activeTab}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "grid gap-8",
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 max-w-4xl mx-auto",
          )}
        >
          {coursesData?.pages?.map((page: CoursesResponse, pageIndex: number) => (
            <React.Fragment key={pageIndex}>
              {page.courses?.map((course: Course, courseIndex: number) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: (courseIndex % 12) * 0.05,
                    ease: "easeOut",
                  }}
                >
                  <MemoizedCourseCard
                    title={course.title || course.name || "Untitled Course"}
                    description={course.description || "No description available"}
                    rating={course.rating || 0}
                    slug={course.slug || `course-${course.id}`}
                    unitCount={course.unitCount || 0}
                    lessonCount={course.lessonCount || 0}
                    quizCount={course.quizCount || 0}
                    viewCount={course.viewCount || 0}
                    category={
                      (typeof course.category === "object" && course.category?.name
                        ? course.category.name
                        : typeof course.category === "string"
                          ? course.category
                          : "") || ""
                    }
                    duration={course.duration || "4-6 weeks"}
                    image={getImageWithFallback(course.image)}
                    difficulty={course.difficulty as "Beginner" | "Intermediate" | "Advanced"}
                  />
                </motion.div>
              ))}
            </React.Fragment>
          ))}
        </motion.div>
      </AnimatePresence>

      {hasNextPage && (
        <motion.div
          ref={loadMoreRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-12"
        >
          {isFetchingNextPage ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading more courses...</span>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={!hasNextPage || isFetchingNextPage}
              className="px-8 py-3 h-auto font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Discover more courses
            </Button>
          )}
        </motion.div>
      )}
    </div>
  )
}
