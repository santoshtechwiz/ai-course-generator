"use client"

import { useState, useEffect } from "react"
import { CourseSidebar } from "./CourseSidebar"
import CoursesClient from "./CoursesClient"
import type { CategoryId } from "@/config/categories"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, ChevronLeft, ChevronRight, Filter, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
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
    setMobileSidebarOpen(false) // Close mobile sidebar when category is selected
  }

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedCategory(null)
    setRatingFilter(0)
  }

  // Get active filters count for mobile badge
  const activeFiltersCount = [
    searchQuery.trim() !== "",
    selectedCategory !== null,
    ratingFilter > 0,
  ].filter(Boolean).length

  // Get selected category name for display
  const selectedCategoryName = selectedCategory 
    ? categories.find(cat => cat.id === selectedCategory)?.name 
    : null

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      {/* Mobile Filter Bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="relative"
                  aria-label="Open filters"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] p-0 sm:max-w-none">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
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
          </div>

          {/* Active Filters Display */}
          <div className="flex items-center gap-2 flex-1 ml-4">
            <AnimatePresence>
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center"
                >
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: "{searchQuery.slice(0, 15)}{searchQuery.length > 15 ? '...' : ''}"
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </motion.div>
              )}
              
              {selectedCategoryName && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center"
                >
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {selectedCategoryName}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setSelectedCategory(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </motion.div>
              )}

              {ratingFilter > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center"
                >
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {ratingFilter}+ ⭐
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setRatingFilter(0)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Desktop Active Filters chips */}
      <div className="hidden lg:block fixed top-[64px] left-0 right-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/50 border-b">
        {activeFiltersCount > 0 && (
          <div className="max-w-[1600px] mx-auto px-6 py-2 flex items-center gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{searchQuery.slice(0, 20)}{searchQuery.length > 20 ? '...' : ''}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {selectedCategoryName && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedCategoryName}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => setSelectedCategory(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {ratingFilter > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {ratingFilter}+ ⭐
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => setRatingFilter(0)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="ml-2" onClick={resetFilters}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Desktop sidebar with enhanced toggle */}
      <div
        className={`hidden lg:block relative transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-[320px] shrink-0" : "w-[60px] shrink-0"
        } h-full border-r bg-card/50`}
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute right-[-12px] top-4 h-6 w-6 rounded-full border bg-background z-10 shadow-md hover:shadow-lg transition-shadow"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <motion.div
              animate={{ rotate: sidebarOpen ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="h-3 w-3" />
            </motion.div>
          </Button>
        </motion.div>

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

        {/* Collapsed state indicator */}
        {!sidebarOpen && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="w-8 h-0.5 bg-muted rounded-full" />
              <div className="w-6 h-0.5 bg-muted rounded-full" />
              <div className="w-4 h-0.5 bg-muted rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Main content area with enhanced layout */}
      <main className="flex-1 min-w-0">
        <div className="h-full overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <CoursesClient
              url={url}
              userId={userId || "static-user-id"}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              ratingFilter={ratingFilter}
            />
          </motion.div>
        </div>
      </main>

      {/* Floating action button for quick access (mobile) */}
      <AnimatePresence>
        {!mobileSidebarOpen && activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="lg:hidden fixed bottom-6 right-6 z-20"
          >
            <Button
              onClick={resetFilters}
              size="sm"
              variant="outline"
              className="rounded-full shadow-lg bg-background/95 backdrop-blur-sm border-2"
            >
              Clear Filters ({activeFiltersCount})
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

