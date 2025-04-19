"use client"

import React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import type { CategoryId } from "@/config/categories"
import { BookOpen, ChevronDown, Loader2, LayoutGrid, List, Filter } from "lucide-react"
// Add import for missing icons
import { AlertCircle, RefreshCw } from "lucide-react"
import { CreateCard } from "@/components/CreateCard"
import { useDebounce } from "@/hooks/useDebounce"
import { CourseCard } from "./CourseCard"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { motion, AnimatePresence } from "framer-motion"
// Add missing imports at the top of the file
// Remove this line:
// import { useInView } from "react-intersection-observer";
// Add memo and useCallback to optimize rendering
const MemoizedCourseCard = React.memo(CourseCard)

// Update interface to include ratingFilter
interface CoursesClientProps {
  url: string
  userId?: string
  searchQuery: string
  selectedCategory: CategoryId | null
  ratingFilter?: number
}

interface Course {
  id: string
  name?: string
  title?: string
  description?: string
  rating?: number
  slug?: string
  unitCount?: number
  lessonCount?: number
  quizCount?: number
  viewCount?: number
  category?: any
  duration?: string
  createdAt?: string
  image?: string
  difficulty?: string
}

const ITEMS_PER_PAGE = 12

// Update function parameters to include ratingFilter
export default function CoursesClient({
  url,
  userId,
  searchQuery,
  selectedCategory,
  ratingFilter = 0,
}: CoursesClientProps) {
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)

  // Update query key to include ratingFilter
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, refetch, isLoading } = useInfiniteQuery({
    queryKey: ["courses", { search: debouncedSearchQuery, category: selectedCategory, userId, rating: ratingFilter }],
    initialPageParam: 1,
    // Update the queryFn to include ratingFilter in the API call
    queryFn: async ({ pageParam = 1 }) => {
      try {
        // Build the API URL with proper parameters
        const apiUrl = new URL("/api/courses", window.location.origin)
        apiUrl.searchParams.set("page", pageParam.toString())
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
          activeTab === "popular" ? "viewCount" : activeTab === "newest" ? "createdAt" : "viewCount",
        )
        apiUrl.searchParams.set("sortOrder", "desc")

        console.log("Fetching courses from:", apiUrl.toString())

        const response = await fetch(apiUrl.toString(), {
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        console.log("Fetched courses data:", data)
        return data
      } catch (error) {
        console.error("Error fetching courses:", error)
        throw error
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.courses?.length === ITEMS_PER_PAGE ? allPages.length + 1 : undefined
    },
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
  })

  // Add this after the query definition
  const [loadMoreRef, setLoadMoreRef] = useState<HTMLDivElement | null>(null)

  // Add this useEffect for infinite scrolling
  useEffect(() => {
    if (!loadMoreRef || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { rootMargin: "200px" },
    )

    observer.observe(loadMoreRef)
    return () => observer.disconnect()
  }, [loadMoreRef, hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery || selectedCategory) {
      refetch()
    }
  }, [refetch, debouncedSearchQuery, searchQuery, selectedCategory])

  // Force refetch when activeTab changes
  // Update useEffect to refetch when ratingFilter changes
  useEffect(() => {
    refetch()
  }, [activeTab, ratingFilter, refetch])

  const courses = data?.pages.flatMap((page) => page.courses) || []

  // Use useCallback for handlers
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
  }, [])

  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode)
  }, [])

  // Use useMemo for filtered and sorted courses
  // Update the filtered courses to filter by rating if not already filtered by the API
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Filter by rating if not already filtered by the API
      if (ratingFilter > 0 && (course.rating || 0) < ratingFilter) {
        return false
      }
      return true
    })
  }, [courses, ratingFilter])

  const sortedCourses = useMemo(() => {
    if (activeTab === "popular") {
      return [...filteredCourses].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    } else if (activeTab === "newest") {
      return [...filteredCourses].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        return 0
      })
    }
    return filteredCourses
  }, [filteredCourses, activeTab])

  // Fix the "No course found" flash issue by improving loading state handling
  // Update the isLoading condition to include when selectedCategory changes
  const isLoadingState = isLoading || (selectedCategory !== null && status === "loading")

  // Replace the existing isLoading check with this updated condition
  if (isLoadingState) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-muted/60 rounded-md animate-pulse"></div>
          <div className="h-10 w-32 bg-muted/60 rounded-md animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <CourseCard
              key={index}
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

  // Enhanced empty state with better visuals
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 w-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4"
        >
          <BookOpen className="h-10 w-10 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-bold mb-2 text-center">
          {searchQuery || selectedCategory ? "No courses found" : "Start your learning journey"}
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto text-center mb-6">
          {searchQuery || selectedCategory
            ? "Try adjusting your search or filters to find what you're looking for."
            : "Create your first course or explore our catalog to begin learning."}
        </p>
        <CreateCard
          title="Create New Course"
          description="Share your knowledge with the community"
          createUrl={url}
          animationDuration={1.2}
          className="w-full max-w-md"
        />
      </div>
    )
  }

  if (status === "error") {
    toast({
      title: "Error loading courses",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    })

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="text-destructive mb-4">
          <AlertCircle className="h-12 w-12 mx-auto mb-2" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Failed to load courses</h3>
        <p className="text-muted-foreground mb-4 text-center max-w-md">
          There was a problem loading the courses. Please try again later.
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 w-full">
        <h2 className="text-2xl font-bold tracking-tight">
          {searchQuery || selectedCategory ? "Search Results" : "All Courses"}
          <span className="text-muted-foreground text-sm font-normal ml-2">({courses.length} courses)</span>
        </h2>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile filter button */}
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="sm:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:max-w-none">
              <div className="space-y-4 py-4">
                <h3 className="text-lg font-medium">Sort & Filter</h3>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="all" className="flex-1">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="popular" className="flex-1">
                      Popular
                    </TabsTrigger>
                    <TabsTrigger value="newest" className="flex-1">
                      Newest
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-2">View</h4>
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      className="h-9 w-full rounded-none"
                      onClick={() => {
                        handleViewModeChange("grid")
                        setShowFilters(false)
                      }}
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      className="h-9 w-full rounded-none"
                      onClick={() => {
                        handleViewModeChange("list")
                        setShowFilters(false)
                      }}
                    >
                      <List className="h-4 w-4 mr-2" />
                      List
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop controls */}
          <div className="hidden sm:flex items-center gap-4">
            {!searchQuery && !selectedCategory && (
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="newest">Newest</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => handleViewModeChange("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => handleViewModeChange("list")}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {/* Increase the grid gap for larger cards */}
          {/* Update the grid class in the return statement */}
          <div
            className={`grid gap-6 w-full ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {sortedCourses.map((course: Course) => (
              <MemoizedCourseCard
                key={course.id}
                title={course.title || course.name || "Untitled Course"}
                description={course.description || "No description available"}
                rating={typeof course.rating === "number" ? course.rating : 0}
                slug={course.slug || `course-${course.id}`}
                unitCount={course.unitCount || 0}
                lessonCount={course.lessonCount || 0}
                quizCount={course.quizCount || 0}
                viewCount={course.viewCount || 0}
                category={course.category?.name || (typeof course.category === "string" ? course.category : "")}
                duration={typeof course.duration === "string" ? course.duration : "4-6 weeks"}
                image={course.image}
                difficulty={course.difficulty}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {hasNextPage && (
        <div className="flex justify-center mt-8 w-full">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            size="lg"
            variant="outline"
            className="rounded-full px-8 gap-2 transition-all duration-300 hover:bg-primary/10"
          >
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading more courses...</span>
              </div>
            ) : (
              <>
                Show More Courses
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Infinite Scroll Observer */}
      <div ref={setLoadMoreRef} className="h-4 w-full mt-8" />
    </div>
  )
}
