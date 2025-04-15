"use client"

import React, { useState, useEffect } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
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
}

const ITEMS_PER_PAGE = 12

export default function CoursesClient({ url, userId, searchQuery, selectedCategory }: CoursesClientProps) {
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

  const sortedCourses = React.useMemo(() => {
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
      title: "Error",
      description: (error as Error).message,
      variant: "destructive",
    })
  }

  if (status === "pending") {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
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

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 w-full">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
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
        </h2>

        <div className="flex items-center gap-4">
          {!searchQuery && !selectedCategory && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden sm:block">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
               
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

      <div className="w-full">
        <div
          className={`grid gap-5 w-full ${
            viewMode === "grid" 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-1"
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
            />
          ))}
        </div>

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
    </div>
  )
}