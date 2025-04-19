"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Loader2, Star, StarHalf } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { motion } from "framer-motion"

type CategoryId = string

interface Category {
  id: string
  name: string
  courseCount?: number
}

interface CourseSidebarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: CategoryId | null
  handleCategoryChange: (category: CategoryId | null) => void
  resetFilters: () => void
  courseTypes?: Category[]
  isCollapsed?: boolean
  ratingFilter?: number
  setRatingFilter?: (rating: number) => void
}

export function CourseSidebar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  handleCategoryChange,
  resetFilters,
  courseTypes = [],
  isCollapsed = false,
  ratingFilter = 0,
  setRatingFilter = () => {},
}: CourseSidebarProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/categories")
        if (response.ok) {
          const data = await response.json()
          console.log("Fetched categories:", data)
          setCategories(data)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch if courseTypes is empty
    if (courseTypes.length === 0) {
      fetchCategories()
    } else {
      setCategories(courseTypes)
    }
  }, [courseTypes])

  const displayCategories = categories.length > 0 ? categories : courseTypes

  // Rating options for Udemy-like filter
  const ratingOptions = [
    { value: 4.5, label: "4.5 & up", stars: 4.5 },
    { value: 4.0, label: "4.0 & up", stars: 4.0 },
    { value: 3.5, label: "3.5 & up", stars: 3.5 },
    { value: 3.0, label: "3.0 & up", stars: 3.0 },
  ]

  // Function to render stars
  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }

    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />)
    }

    return stars
  }

  return (
    <div className={`h-full flex flex-col overflow-hidden ${isCollapsed ? "items-center" : "p-4"}`}>
      {/* Search */}
      <div className={`mb-6 w-full ${isCollapsed ? "px-2" : ""}`}>
        {!isCollapsed && <h3 className="text-lg font-semibold mb-2">Search Courses</h3>}
        <div className="relative">
          <Search
            className={`${isCollapsed ? "absolute left-2 top-2.5" : "absolute left-2.5 top-2.5"} h-4 w-4 text-muted-foreground`}
          />
          <Input
            type="search"
            placeholder={isCollapsed ? "" : "What do you want to learn?"}
            className={`${isCollapsed ? "w-10 pl-8 pr-0" : "pl-8"}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Rating Filter - Moved to top */}
      {!isCollapsed && (
        <div className="mb-6 w-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Ratings</h3>
            {ratingFilter > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setRatingFilter(0)}
              >
                Clear
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {ratingOptions.map((option) => (
              <motion.div key={option.value} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start px-2 py-1.5 h-auto ${
                    ratingFilter === option.value ? "bg-primary/10 text-primary" : ""
                  }`}
                  onClick={() => setRatingFilter(option.value)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(option.value)}</div>
                    <span className="text-sm">{option.label}</span>
                    {/* Add count badge if available */}
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <Separator className="my-2" />

      {/* Categories */}
      <div className="mb-6 w-full">
        <div className="flex items-center justify-between mb-2">
          {!isCollapsed && <h3 className="text-lg font-semibold">Categories</h3>}
          {selectedCategory && !isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => handleCategoryChange(null)}
            >
              Clear
            </Button>
          )}
        </div>
        <ScrollArea className={`${isCollapsed ? "h-[300px] w-10" : "h-[300px]"}`}>
          {isLoading ? (
            <div className="flex justify-center items-center h-20">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1 pr-2">
              {displayCategories.map((category) => (
                <motion.div key={category.id} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className={`w-full justify-start ${isCollapsed ? "px-2" : "px-3 py-2 h-auto"}`}
                    onClick={() => {
                      console.log("Selecting category:", category.id)
                      handleCategoryChange(category.id)
                    }}
                    title={isCollapsed ? category.name : undefined}
                  >
                    {isCollapsed ? (
                      <div className="w-6 h-6 flex items-center justify-center">{category.name.charAt(0)}</div>
                    ) : (
                      <div className="flex justify-between w-full items-center">
                        <span className="text-sm">{category.name}</span>
                        {category.courseCount !== undefined && (
                          <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                            {category.courseCount}
                          </Badge>
                        )}
                      </div>
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Custom Rating Slider (Optional) */}
      {!isCollapsed && (
        <div className="mb-6 w-full">
          <h3 className="text-lg font-semibold mb-2">Custom Rating</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                {renderStars(ratingFilter)}
                <span className="text-sm font-medium ml-1">({ratingFilter.toFixed(1)})</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {ratingFilter === 5
                  ? "Excellent"
                  : ratingFilter >= 4
                    ? "Very Good"
                    : ratingFilter >= 3
                      ? "Good"
                      : ratingFilter >= 2
                        ? "Fair"
                        : "Any"}
              </span>
            </div>
            <Slider
              id="rating-filter"
              min={0}
              max={5}
              step={0.5}
              value={[ratingFilter]}
              onValueChange={(value) => setRatingFilter(value[0])}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Reset Filters */}
      {!isCollapsed && (
        <Button
          variant="outline"
          className="mt-auto w-full"
          onClick={resetFilters}
          disabled={!selectedCategory && ratingFilter === 0 && !searchQuery}
        >
          <Filter className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>
      )}
    </div>
  )
}

export default CourseSidebar
