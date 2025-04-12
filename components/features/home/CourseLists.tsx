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
  const [sidebarOpen, setSidebarOpen] = React.useState(true)

  const handleClearSearch = React.useCallback(() => {
    setSearchQuery("")
  }, [])

  const handleCategoryChange = React.useCallback(
    (categoryId: CategoryId | null) => {
      setSelectedCategory(categoryId === selectedCategory ? null : categoryId)
    },
    [selectedCategory],
  )

  const resetFilters = React.useCallback(() => {
    setSearchQuery("")
    setSelectedCategory(null)
  }, [])

  const toggleSidebar = React.useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="fixed left-4 top-20 z-40 lg:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:w-[300px] p-0">
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

        {/* Desktop sidebar - fixed width, scroll on the aside */}
        <aside
          className={`hidden lg:block border-r h-[calc(100vh-4rem)] sticky top-16 transition-all duration-300 ${sidebarOpen ? "w-[280px]" : "w-[60px]"
            } overflow-hidden`}
        >
          <CourseSidebar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            handleCategoryChange={handleCategoryChange}
            handleClearSearch={handleClearSearch}
            resetFilters={resetFilters}
            isPending={false}
            courseTypes={categories}
            isCollapsed={!sidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        </aside>

        {/* Main content area */}
        <main className="flex-1 min-w-0 pt-4 overflow-auto">
          <CoursesClient url={url} userId={userId} searchQuery={searchQuery} selectedCategory={selectedCategory} />
        </main>
      </div>
    </div>
  )
}

export default CourseList
