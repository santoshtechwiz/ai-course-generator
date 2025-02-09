"use client"

import React from "react"
import { CourseSidebar } from "./CourseSidebar"
import CoursesClient from "./CoursesClient"
import { categories, type CategoryId } from "@/config/categories"



interface CourseListProps {
  url: string
  userId?: string
}

const CourseList: React.FC<CourseListProps> = ({ url, userId }) => {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryId | null>(null)
  const [courseTypes] = React.useState<
    Array<{ id: CategoryId; label: string; icon: React.ElementType; color: string }>
  >(categories)

  const handleClearSearch = React.useCallback(() => {
    setSearchQuery("")
  }, [])

  const handleCategoryChange = React.useCallback((categoryId: CategoryId | null) => {
    setSelectedCategory(categoryId)
  }, [])

  const resetFilters = React.useCallback(() => {
    setSearchQuery("")
    setSelectedCategory(null)
  }, [])

  return (
    <div className="flex min-h-screen">
      <CourseSidebar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        handleCategoryChange={handleCategoryChange}
        handleClearSearch={handleClearSearch}
        resetFilters={resetFilters}
        isPending={false}
        courseTypes={courseTypes}
      />
      <CoursesClient url={url} userId={userId} searchQuery={searchQuery} />
    </div>
  )
}

export default CourseList

