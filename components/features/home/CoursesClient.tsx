"use client"

import React, { useEffect, useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import type { CategoryId } from "@/config/categories"
import { BookOpen, ChevronDown, Loader2, LayoutGrid, List } from "lucide-react"
import { CreateCard } from "@/components/CreateCard"
import { useDebounce } from "@/hooks/useDebounce"
import { CourseCard } from "./CourseCard"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CoursesClientProps {
  url: string
  userId?: string
  searchQuery: string
  selectedCategory: CategoryId | null
}

// Update the Course interface to match your actual API response structure
interface Course {
  id: string
  name?: string // The API might be using 'name' instead of 'title'
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
  // Add any other properties that might be in your course object
}

const ITEMS_PER_PAGE = 12 // Reduced for better performance

const CoursesClient: React.FC<CoursesClientProps> = ({ url, userId, searchQuery, selectedCategory }) => {
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, refetch } = useInfiniteQuery({
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

  // Sort courses based on active tab
  const sortedCourses = React.useMemo(() => {
    if (activeTab === "popular") {
      return [...courses].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    } else if (activeTab === "newest") {
      // Assuming courses have a createdAt field, otherwise just return the original order
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
      title: "Error",
      description: (error as Error).message,
      variant: "destructive",
    })
  }

  const renderCourseGrid = (coursesToRender: Course[]) => (
    <motion.div
      layout
      className={cn("grid gap-5", viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}
    >
      <AnimatePresence mode="popLayout">
        {coursesToRender.map((course: Course) => {
          // Check if the course uses 'name' instead of 'title'
          const courseTitle = course.title || course.name || "Untitled Course"

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              <CourseCard
                title={courseTitle}
                description={course.description || "No description available"}
                rating={typeof course.rating === "number" ? course.rating : 0}
                slug={course.slug || `course-${course.id}`}
                unitCount={course.unitCount || 0}
                lessonCount={course.lessonCount || 0}
                quizCount={course.quizCount || 0}
                viewCount={course.viewCount || 0}
                category={typeof course.category === "string" ? course.category : "Development"}
                duration={typeof course.duration === "string" ? course.duration : "4-6 weeks"}
                className="h-full"
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )

  const renderLoadingGrid = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
    >
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
    </motion.div>
  )

  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
    >
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold">
          {searchQuery || selectedCategory ? "No courses found matching your criteria" : "Start your learning journey"}
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {searchQuery || selectedCategory
            ? "Try adjusting your search or filters to find what you're looking for."
            : "Create your first course or explore our catalog to begin learning."}
        </p>
      </div>
      <CreateCard
        title="Create New Course"
        description="Share your knowledge with the community"
        createUrl={url}
        animationDuration={1.2}
        className="w-full max-w-md"
      />
    </motion.div>
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
      <AnimatePresence mode="wait">
        {status === "pending" ? (
          renderLoadingGrid()
        ) : courses.length === 0 ? (
          renderEmptyState()
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layout
            className="space-y-8"
          >
            {/* All Courses Section */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight">
                  {searchQuery || selectedCategory ? "Search Results" : "All Courses"}
                </h2>

                <div className="flex items-center gap-4">
                  {!searchQuery && !selectedCategory && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                      <TabsList className="grid w-full sm:w-auto grid-cols-3">
                        
                      </TabsList>
                    </Tabs>
                  )}

                  <div className="flex items-center border rounded-md overflow-hidden">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon"
                      className="h-9 w-9 rounded-none"
                      onClick={() => setViewMode("grid")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="icon"
                      className="h-9 w-9 rounded-none"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {renderCourseGrid(sortedCourses)}

              {hasNextPage && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center pt-8">
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
                </motion.div>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ")

export default React.memo(CoursesClient)
