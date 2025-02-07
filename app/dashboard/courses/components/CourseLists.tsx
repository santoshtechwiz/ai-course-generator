"use client"

import React, { useState, useEffect, useMemo, useCallback, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CourseCard } from "./CourseCard"
import { CreateCard } from "@/app/components/CreateCard"
import { useInView } from "react-intersection-observer"
import { useDebounce } from "@/hooks/useDebounce"
import type { CategoryId } from "@/config/categories"
import { CourseSidebar } from "./CourseSidebar"
import { SkeletonCard } from "./SkeletonCard"
import type { Course, CourseCardProps } from "@/app/types/types"

interface CourseListProps {
  initialCourses: CourseCardProps[]
  url: string
}

const ITEMS_PER_PAGE = 20

const CourseList: React.FC<CourseListProps> = ({ initialCourses, url }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([])
  const [isPending, startTransition] = useTransition()
  const [page, setPage] = useState(1)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const { ref, inView } = useInView({ threshold: 0.1 })

  // Memoized filtering logic
  const filteredCourses = useMemo(() => {
    const searchTerm = debouncedSearchQuery.toLowerCase().trim()

    return initialCourses.filter((course) => {
      const matchesSearch = searchTerm === "" || course.name.toLowerCase().includes(searchTerm)
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(course.categoryId)
      return matchesSearch && matchesCategory
    })
  }, [initialCourses, debouncedSearchQuery, selectedCategories])

  // Reset pagination when filters change
  useEffect(() => {
    startTransition(() => {
      setPage(1)
    })
  }, [initialCourses, selectedCategories]) //Fixed unnecessary dependencies

  // Memoized paginated courses
  const paginatedCourses = useMemo(() => {
    return filteredCourses.slice(0, page * ITEMS_PER_PAGE)
  }, [filteredCourses, page])

  // Load more handler
  const loadMore = useCallback(() => {
    if (!isPending && filteredCourses.length > paginatedCourses.length) {
      startTransition(() => {
        setPage((prev) => prev + 1)
      })
    }
  }, [isPending, filteredCourses.length, paginatedCourses.length])

  // Infinite scroll
  useEffect(() => {
    if (inView) {
      loadMore()
    }
  }, [inView, loadMore])

  // Event handlers
  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
  }, [])

  const toggleCategory = useCallback((categoryId: CategoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }, [])

  return (
    <div className="flex min-h-screen">
      <CourseSidebar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategories={selectedCategories}
        toggleCategory={toggleCategory}
        handleClearSearch={handleClearSearch}
        isPending={isPending}
      />

      <div className="flex-1 p-6">
        <AnimatePresence mode="wait">
          {filteredCourses.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <p className="text-xl text-muted-foreground mb-4">
                {searchQuery || selectedCategories.length > 0
                  ? "No courses found matching your criteria."
                  : "No courses available."}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {paginatedCourses.map((course) => (
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
              {isPending && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <SkeletonCard key={index} />
                  ))}
                </div>
              )}
              <div ref={ref} className="h-20" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CourseList;

