"use client"

import React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import type { CategoryId } from "@/config/categories"
import { BookOpen, ChevronDown, Loader2, LayoutGrid, List, Filter, Search, TrendingUp, Clock, Users, GraduationCap } from "lucide-react"
// Add import for missing icons
import { AlertCircle, RefreshCw, Sparkles, Award, Target } from "lucide-react"
import { CreateCard } from "@/components/CreateCard"
import { useDebounce } from "@/lib/utils/hooks"
import { CourseCard } from "./CourseCard"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { motion, AnimatePresence } from "framer-motion"
import { useGlobalLoader } from "@/store/loaders/global-loader"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

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
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Update query key to include ratingFilter
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, refetch, isLoading } = useInfiniteQuery({
    queryKey: ["courses", { search: debouncedSearchQuery, category: selectedCategory, userId, rating: ratingFilter }],
    initialPageParam: 1,
    // Update the queryFn to include ratingFilter in the API call
    queryFn: async ({ pageParam = 1 }) => {
      try {
        setLoadingProgress(20)
        // Build the API URL with proper parameters
        const apiUrl = new URL("/api/course", window.location.origin)
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

        setLoadingProgress(50)
        console.log("Fetching courses from:", apiUrl.toString())

        const response = await fetch(apiUrl.toString(), {
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        setLoadingProgress(80)

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        setLoadingProgress(100)
        console.log("Fetched courses data:", data)
        return data
      } catch (error) {
        setLoadingProgress(0)
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

  // Remove the local loading spinner/logic
  // Use useGlobalLoader for loading state
  const { isLoading: globalLoading } = useGlobalLoader()

  // Replace the existing isLoading check with this updated condition
  if (globalLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading courses...</p>
            <Progress value={loadingProgress} className="w-64 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  // Enhanced empty state with better visuals and suggestions
  if (courses.length === 0 && !isLoading) {
    const hasFilters = searchQuery || selectedCategory || ratingFilter > 0
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 w-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md mx-auto"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            {hasFilters ? (
              <Search className="h-10 w-10 text-primary" />
            ) : (
              <BookOpen className="h-10 w-10 text-primary" />
            )}
          </div>
          
          <h3 className="text-2xl font-bold mb-3 text-center">
            {hasFilters ? "No courses found" : "Start your learning journey"}
          </h3>
          
          <p className="text-muted-foreground text-center mb-6 leading-relaxed">
            {hasFilters
              ? "We couldn't find any courses matching your criteria. Try adjusting your search or filters to discover more content."
              : "Discover amazing courses or create your own to share knowledge with the community."}
          </p>

          {hasFilters ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="text-sm">
                  Try broader search terms
                </Badge>
                <Badge variant="outline" className="text-sm">
                  Remove some filters
                </Badge>
                <Badge variant="outline" className="text-sm">
                  Explore all categories
                </Badge>
              </div>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="mx-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset and Browse All
              </Button>
            </div>
          ) : (
            <CreateCard
              title="Create New Course"
              description="Share your knowledge with the community"
              createUrl={url}
              animationDuration={1.2}
              className="w-full max-w-md mx-auto"
            />
          )}
        </motion.div>
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
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md mx-auto"
        >
          <div className="text-destructive mb-6">
            <AlertCircle className="h-16 w-16 mx-auto mb-4" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Failed to load courses</h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            There was a problem loading the courses. This might be due to a network issue or server problem.
          </p>
          <div className="space-y-3">
            <Button onClick={() => refetch()} variant="default" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
              Refresh Page
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* Enhanced Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 w-full">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            {searchQuery || selectedCategory ? "Search Results" : "All Courses"}
          </h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{courses.length} courses</span>
            </div>
            {courses.length > 0 && (
              <>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{courses.reduce((acc, course) => acc + (course.viewCount || 0), 0).toLocaleString()} total views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>{(courses.reduce((acc, course) => acc + (course.rating || 0), 0) / courses.length).toFixed(1)} avg rating</span>
                </div>
                <div className="hidden md:flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Learn at your pace</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 sticky top-2 sm:static z-20">
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

          {/* Desktop quick sort tabs */}
          <div className="hidden sm:flex items-center rounded-xl border border-border/50 p-1 bg-background/50">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="newest">Newest</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* View toggles */}
          <div className="flex items-center border rounded-md overflow-hidden bg-muted/50">
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

      {/* Course Grid/List with Enhanced Animations */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${activeTab}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <div
            className={`grid gap-6 w-full ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4"
                : "grid-cols-1 max-w-4xl mx-auto"
            }`}
          >
            {sortedCourses.map((course: Course, index: number) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <MemoizedCourseCard
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
                  className={viewMode === "list" ? "max-w-none" : ""}
                />
              </motion.div>
            ))}

            {/* Skeletons while fetching next page */}
            {isFetchingNextPage && Array.from({ length: 4 }).map((_, i) => (
              <div key={`s-${i}`} className="space-y-3">
                <Skeleton className="w-full aspect-video rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Enhanced Load More Section */}
      {hasNextPage && (
        <div className="flex justify-center mt-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              size="lg"
              variant="outline"
              className="rounded-full px-8 gap-2 transition-all duration-300 hover:bg-primary/10 hover:border-primary/50 hover:shadow-lg"
            >
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading more courses...</span>
                </div>
              ) : (
                <>
                  <span>Show More Courses</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      )}

      {/* Infinite Scroll Observer */}
      <div ref={setLoadMoreRef} className="h-4 w-full mt-8" />

      {/* Course Statistics Card */}
      {courses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-foreground">
                <div>
                  <div className="text-2xl font-bold text-primary">{courses.length}</div>
                  <div className="text-sm text-muted-foreground">Total Courses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {courses.reduce((acc, course) => acc + (course.viewCount || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {(courses.reduce((acc, course) => acc + (course.rating || 0), 0) / courses.length).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Rating</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {courses.reduce((acc, course) => acc + (course.unitCount || 0) + (course.lessonCount || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Content</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Floating CTA (example): show if many results present */}
      {courses.length >= 12 && (
        <div className="fixed bottom-6 right-6 z-20">
          <Button
            size="lg"
            onClick={() => (window.location.href = "/dashboard/subscription")}
            className="shadow-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 rounded-full"
          >
            Subscribe for Full Access
          </Button>
        </div>
      )}
    </div>
  )
}

