"use client"

import React from "react"
import { CourseSidebar } from "./CourseSidebar"
import CoursesClient from "./CoursesClient"
import { categories, type CategoryId } from "@/config/categories"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface CourseListProps {
  url: string
  userId?: string
}

const CourseList: React.FC<CourseListProps> = ({ url, userId }) => {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryId | null>(null)

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
      {/* Mobile sidebar trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed left-4 top-4 z-40 lg:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-[280px] p-0">
          <CourseSidebar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            handleCategoryChange={handleCategoryChange}
            handleClearSearch={handleClearSearch}
            resetFilters={resetFilters}
            isPending={false}
            courseTypes={categories}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar - fixed width and position */}
      <aside className="hidden lg:block w-[250px] min-w-[250px] flex-shrink-0 border-r h-screen sticky top-0 overflow-y-auto">
        <CourseSidebar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          handleCategoryChange={handleCategoryChange}
          handleClearSearch={handleClearSearch}
          resetFilters={resetFilters}
          isPending={false}
          courseTypes={categories}
        />
      </aside>

      {/* Main content area - allow it to grow and fill available space */}
      <main className="flex-1 min-w-0">
        <CoursesClient url={url} userId={userId} searchQuery={searchQuery} selectedCategory={selectedCategory} />
      </main>
    </div>
  )
}

export default CourseList
