"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Loader2, Star, StarHalf, X, TrendingUp, Users, BookOpen } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

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
  // Categories now fully supplied via props (SWR in parent). Avoid local fetch duplication.
  const [categories] = useState<Category[]>(courseTypes)
  const isLoading = false
  const [searchFocused, setSearchFocused] = useState(false)
  const displayCategories = categories

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

  // Get active filters count
  const activeFiltersCount = [
    searchQuery.trim() !== "",
    selectedCategory !== null,
    ratingFilter > 0,
  ].filter(Boolean).length

  const containerVariants = {
    expanded: { width: "320px", opacity: 1 },
    collapsed: { width: "60px", opacity: 0.8 }
  }

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  }

  return (
    <motion.div 
      variants={containerVariants}
      animate={isCollapsed ? "collapsed" : "expanded"}
      className={`h-full flex flex-col overflow-hidden bg-card/30 backdrop-blur-sm ${isCollapsed ? "items-center" : "p-4"}`}
    >
      {/* Search Section */}
      <div className={`mb-6 w-full ${isCollapsed ? "px-2" : ""}`}>
        {!isCollapsed && (
          <motion.div
            variants={contentVariants}
            className="flex items-center justify-between mb-3"
          >
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search Courses
            </h3>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </motion.div>
        )}
        
        <div className="relative">
          <Search
            className={`${isCollapsed ? "absolute left-2 top-2.5" : "absolute left-2.5 top-2.5"} h-4 w-4 text-muted-foreground transition-colors ${searchFocused ? "text-primary" : ""}`}
          />
          <Input
            type="search"
            placeholder={isCollapsed ? "" : "What do you want to learn?"}
            className={`${isCollapsed ? "w-10 pl-8 pr-0" : "pl-8"} transition-all duration-200 ${searchFocused ? "ring-2 ring-primary/20" : ""}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-2 top-2.5"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Quick Stats Card */}
      {!isCollapsed && displayCategories.length > 0 && (
        <motion.div
          variants={contentVariants}
          className="mb-6 w-full"
        >
          <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Course Statistics
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-center">
                  <div>
                    <div className="text-base sm:text-lg font-bold text-primary">{displayCategories.length}</div>
                    <div className="text-xs text-muted-foreground">Categories</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-primary">
                      {displayCategories.reduce((acc, cat) => acc + (cat.courseCount || 0), 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Courses</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Rating Filter */}
      {!isCollapsed && (
        <motion.div
          variants={contentVariants}
          className="mb-6 w-full"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Ratings
            </h3>
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
              <motion.div 
                key={option.value} 
                whileHover={{ x: 2 }} 
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="ghost"
                  className={`w-full justify-start px-3 py-2 h-auto transition-all duration-200 ${
                    ratingFilter === option.value 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setRatingFilter(option.value)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex">{renderStars(option.value)}</div>
                    <span className="text-sm font-medium">{option.label}</span>
                    {ratingFilter === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto"
                      >
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      </motion.div>
                    )}
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <Separator className="my-4" />

      {/* Categories */}
      <div className="mb-6 w-full flex-1">
        <div className="flex items-center justify-between mb-3">
          {!isCollapsed && (
            <motion.h3 
              variants={contentVariants}
              className="text-base sm:text-lg font-semibold flex items-center gap-2"
            >
              <BookOpen className="h-5 w-5 text-primary" />
              Categories
            </motion.h3>
          )}
          {selectedCategory && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => handleCategoryChange(null)}
              >
                Clear
              </Button>
            </motion.div>
          )}
        </div>
        
        <ScrollArea className={`${isCollapsed ? "h-[400px] w-10" : "h-[400px]"}`}>
          {isLoading ? (
            <div className="flex justify-center items-center h-20">
              <div className="space-y-2">
                <Loader2 className="h-5 w-5 text-primary mx-auto" />
                {!isCollapsed && (
                  <p className="text-xs text-muted-foreground text-center">Loading categories...</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1 pr-2">
              <AnimatePresence>
                {displayCategories.map((category, index) => (
                  <motion.div 
                    key={category.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 2 }} 
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      className={`w-full justify-start transition-all duration-200 ${
                        isCollapsed ? "px-2 h-10" : "px-3 py-2 h-auto"
                      } ${
                        selectedCategory === category.id 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => {
                        console.log("Selecting category:", category.id)
                        handleCategoryChange(category.id)
                      }}
                      title={isCollapsed ? category.name : undefined}
                    >
                      {isCollapsed ? (
                        <div className="w-6 h-6 flex items-center justify-center font-semibold">
                          {category.name.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="flex justify-between w-full items-center">
                          <span className="text-sm font-medium">{category.name}</span>
                          <div className="flex items-center gap-2">
                            {category.courseCount !== undefined && (
                              <Badge 
                                variant={selectedCategory === category.id ? "secondary" : "outline"} 
                                className="text-xs px-2 py-0.5"
                              >
                                {category.courseCount}
                              </Badge>
                            )}
                            {selectedCategory === category.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                              </motion.div>
                            )}
                          </div>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Custom Rating Slider */}
      {!isCollapsed && (
        <motion.div
          variants={contentVariants}
          className="mb-6 w-full"
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Slider className="h-4 w-4 text-primary" />
            Custom Rating Filter
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                {renderStars(ratingFilter)}
                <span className="text-sm font-medium ml-2">({ratingFilter.toFixed(1)})</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
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
            <div className="space-y-2">
              <Slider
                id="rating-filter"
                min={0}
                max={5}
                step={0.5}
                value={[ratingFilter]}
                onValueChange={(value) => setRatingFilter(value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>2.5</span>
                <span>5</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Filters Summary */}
      {!isCollapsed && activeFiltersCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 w-full"
        >
          <Card className="bg-muted/50 border-muted">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Active Filters</span>
                <Badge variant="secondary" className="text-xs">
                  {activeFiltersCount}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {searchQuery && <div>• Search: "{searchQuery.slice(0, 20)}..."</div>}
                {selectedCategory && <div>• Category: {displayCategories.find(c => c.id === selectedCategory)?.name}</div>}
                {ratingFilter > 0 && <div>• Rating: {ratingFilter}+ stars</div>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Reset Filters */}
      {!isCollapsed && (
        <motion.div
          variants={contentVariants}
          className="mt-auto w-full"
        >
          <Button
            variant="outline"
            className="w-full transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
            onClick={resetFilters}
            disabled={activeFiltersCount === 0}
          >
            <Filter className="h-4 w-4 mr-2" />
            Reset All Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </motion.div>
      )}

      {/* Collapsed state indicator */}
      {isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-auto mb-4 flex flex-col items-center gap-2"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-0.5 bg-primary rounded-full" />
            <div className="w-4 h-0.5 bg-muted rounded-full" />
            <div className="w-2 h-0.5 bg-muted rounded-full" />
          </div>
          {activeFiltersCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

export default CourseSidebar

