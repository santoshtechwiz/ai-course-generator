"use client"

import { useState, useEffect } from "react"
import { CourseSidebar } from "./CourseSidebar"
import CoursesClient from "./CoursesClient"
import type { CategoryId } from "@/config/categories"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, ChevronLeft, ChevronRight } from "lucide-react"

interface CourseListProps {
  url: string
  userId?: string
}

interface Category {
  id: string
  name: string
  courseCount?: number
}

export default function CourseList({ url, userId }: CourseListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // Add rating filter state
  const [ratingFilter, setRatingFilter] = useState(0)

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/categories")
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleCategoryChange = (categoryId: CategoryId | null) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId)
  }

  // Update the resetFilters function to also reset the rating filter
  const resetFilters = () => {
    setSearchQuery("")
    setSelectedCategory(null)
    setRatingFilter(0) // Reset rating filter
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Mobile sidebar with Sheet component */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed left-4 top-20 z-40 lg:hidden shadow-md"
            aria-label="Open filters"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 sm:max-w-none">
          <CourseSidebar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            handleCategoryChange={handleCategoryChange}
            resetFilters={resetFilters}
            courseTypes={categories}
            ratingFilter={ratingFilter}
            setRatingFilter={setRatingFilter}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar with toggle button */}
      <div
        className={`hidden lg:block relative transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-[280px] shrink-0" : "w-[60px] shrink-0"
        } h-full border-r`}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute right-[-12px] top-4 h-6 w-6 rounded-full border bg-background z-10 shadow-sm"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>

        <CourseSidebar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          handleCategoryChange={handleCategoryChange}
          resetFilters={resetFilters}
          courseTypes={categories}
          isCollapsed={!sidebarOpen}
          ratingFilter={ratingFilter}
          setRatingFilter={setRatingFilter}
        />
      </div>

      {/* Main content area */}
      <main className="flex-1">
        <div className="h-full overflow-y-auto">
          <CoursesClient
            url={url}
            userId={userId || "static-user-id"} // Ensure consistent userId
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            ratingFilter={ratingFilter}
          />
        </div>
      </main>
    </div>
  )
}
