"use client"

import { useState, useEffect, useMemo } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import type { CategoryId } from "@/config/categories"
import { BookOpen, ChevronDown, Loader2, LayoutGrid, List, Filter } from "lucide-react"
import { CreateCard } from "@/components/CreateCard"
import { useDebounce } from "@/hooks/useDebounce"
import { CourseCard } from "./CourseCard"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { motion, AnimatePresence } from "framer-motion"

interface CoursesClientProps {
  url: string
  userId?: string
  searchQuery: string
  selectedCategory: CategoryId | null
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
  category?: string
  duration?: string
  createdAt?: string
  image?: string
  difficulty?: string
}

const ITEMS_PER_PAGE = 12

export default function CoursesClient({ url, userId, searchQuery, selectedCategory }: CoursesClientProps) {
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, refetch, isLoading } = useInfiniteQuery({
    queryKey: ["courses", { search: debouncedSearchQuery, category: selectedCategory, userId }],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `/api/courses?page=${pageParam}&limit=${ITEMS_PER_PAGE}${
          debouncedSearchQuery ? `&search=${debouncedSearchQuery}` : ""
        }${selectedCategory ? `&category=${selectedCategory}` : ""}${userId ? `&userId=${userId}` : ""}`,
      )
      const data = await response.json()
      return data
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.courses?.length === ITEMS_PER_PAGE ? allPages.length + 1 : undefined
    },
  })

  useEffect(() => {
    refetch()
  }, [refetch, debouncedSearchQuery, selectedCategory])

  const courses = data?.pages.flatMap((page) => page.courses) || []

  const sortedCourses = useMemo(() => {
    if (activeTab === "popular") {
      return [...courses].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    } else if (activeTab === "newest") {
      return [...courses].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        return 0
      })
    }
    return courses
  }, [courses, activeTab])

  if (status === "error") {
    toast({
      title: "Error loading courses",
      description: (error as Error).message,
      variant: "destructive",
    })
  }

  // Enhanced loading state with skeleton cards
  if (isLoading) {
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                        setViewMode("grid")
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
                        setViewMode("list")
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
              <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setViewMode("list")}
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
          <div
            className={`grid gap-5 w-full ${
              viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
            }`}
          >
            {sortedCourses.map((course: Course) => (
              <CourseCard
                key={course.id}
                title={course.title || course.name || "Untitled Course"}
                description={course.description || "No description available"}
                rating={typeof course.rating === "number" ? course.rating : 0}
                slug={course.slug || `course-${course.id}`}
                unitCount={course.unitCount || 0}
                lessonCount={course.lessonCount || 0}
                quizCount={course.quizCount || 0}
                viewCount={course.viewCount || 0}
                category={typeof course.category === "string" ? course.category : "Development"}
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
            className="rounded-full px-8 gap-2"
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Show More Courses
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
