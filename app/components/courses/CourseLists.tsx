"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"

import { CreateCard } from "@/app/components/CreateCard"
import { useDebounce } from "@/hooks/useDebounce"

import type { CourseCardProps } from "@/app/types/types"
import type { CategoryId } from "@/config/categories"
import { toast } from "@/hooks/use-toast"
import { CourseCard } from "./CourseCard"
import { CourseSidebar } from "./CourseSidebar"
import { SkeletonCard } from "./SkeletonCard"
import { SearchBar } from "./SearchBar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

interface CourseListProps {
  url: string
  userId?: string
}

const ITEMS_PER_PAGE = 20

const fetchCourses = async ({
  pageParam = 1,
  search,
  category,
  userId,
}: {
  pageParam?: number
  search?: string
  category?: CategoryId
  userId?: string
}) => {
  const params = new URLSearchParams({
    page: pageParam.toString(),
    limit: ITEMS_PER_PAGE.toString(),
    ...(search && { search }),
    ...(category && { category }),
    ...(userId && { userId }),
  })

  const res = await fetch(`/api/courses?${params.toString()}`)
  if (!res.ok) throw new Error("Failed to fetch courses")
  return res.json()
}

const CourseList: React.FC<CourseListProps> = ({ url, userId }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, refetch } = useInfiniteQuery({
    queryKey: ["courses", { search: debouncedSearchQuery, category: selectedCategory, userId }],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) =>
      fetchCourses({
        pageParam,
        search: debouncedSearchQuery,
        category: selectedCategory || undefined,
        userId,
      }),
    getNextPageParam: (lastPage, pages) => {
      const totalFetched = pages.reduce((total, page) => total + page.courses.length, 0)
      return totalFetched < lastPage.totalCount ? pages.length + 1 : undefined
    },
  })

  useEffect(() => {
    refetch()
  }, [refetch])

  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
  }, [])

  const handleCategoryChange = useCallback((categoryId: CategoryId | null) => {
    setSelectedCategory(categoryId)
  }, [])

  const resetFilters = useCallback(() => {
    setSearchQuery("")
    setSelectedCategory(null)
  }, [])

  const courses = data?.pages.flatMap((page) => page.courses) || []

  if (status === "error") {
    toast({
      title: "Error",
      description: (error as Error).message,
      variant: "destructive",
    })
  }

  const sidebar = (
    <div className="space-y-4">
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleClearSearch={handleClearSearch} />
      <CourseSidebar
        selectedCategory={selectedCategory}
        handleCategoryChange={handleCategoryChange}
        resetFilters={resetFilters}
        isPending={isFetchingNextPage}
      />
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-screen">
      <div className="md:hidden mb-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            {sidebar}
          </SheetContent>
        </Sheet>
      </div>
      <div className="hidden md:block md:w-64 md:pr-4 space-y-4">{sidebar}</div>
      <div className="flex-1 space-y-4">
        
        <AnimatePresence mode="wait">
          {status === "pending" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            </motion.div>
          ) : courses.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <p className="text-xl text-muted-foreground mb-4">
                {searchQuery || selectedCategory ? "No courses found matching your criteria." : "No courses available."}
              </p>
              <CreateCard
                title="Create New Course"
                description="Can't find what you're looking for? Create a new course!"
                createUrl={url}
                animationDuration={2.0}
              />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {courses.map((course: CourseCardProps) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    layout
                  >
                    <CourseCard {...course} />
                  </motion.div>
                ))}
              </div>
              {hasNextPage && (
                <div className="mt-8 flex justify-center">
                  <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                    {isFetchingNextPage ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CourseList

