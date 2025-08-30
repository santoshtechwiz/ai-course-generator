"use client"

import React, { useState } from "react"
import { Search, Filter, X, Grid3X3, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { categories } from "@/config/categories"
import CourseList from "./CourseLists"
import type { CategoryId } from "@/config/categories"

interface CourseListWithFiltersProps {
  url: string
  userId?: string
}

export default function CourseListWithFilters({ url, userId }: CourseListWithFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null)
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "newest" | "price-low" | "price-high">("popular")
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId as CategoryId | null)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory(null)
    setSortBy("popular")
  }

  const hasActiveFilters = searchQuery || selectedCategory || sortBy !== "popular"

  // Simplified Categories Component
  const CategoriesSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">Categories</label>
        {selectedCategory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Clear category filter`}
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Categories Grid - Responsive */}
      <div className="grid grid-cols-1 gap-2">
        {/* All Categories Option */}
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => handleCategorySelect(null)}
          className={cn(
            "justify-start h-auto p-3 transition-all duration-200 category-button",
            selectedCategory === null
              ? "bg-primary text-primary-foreground shadow-sm"
              : "hover:bg-muted/50"
          )}
        >
          <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Grid3X3 className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="font-medium text-sm">All Categories</div>
              <div className="text-xs text-muted-foreground">Browse all courses</div>
            </div>
          </div>
        </Button>

        {/* Individual Categories */}
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategorySelect(isSelected ? null : category.id)}
              className={cn(
                "justify-start h-auto p-3 transition-all duration-200 category-button",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  isSelected
                    ? "bg-primary-foreground/20"
                    : "bg-muted"
                )}>
                  <category.icon className={cn(
                    "w-4 h-4",
                    isSelected ? "text-primary-foreground" : "text-muted-foreground"
                  )} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{category.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{category.description}</div>
                </div>
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )

  // Sidebar content component
  const SidebarContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="course-search">
          Search Courses
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
          <Input
            id="course-search"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 transition-colors",
              searchQuery && "border-primary/50 bg-primary/5"
            )}
            aria-describedby={searchQuery ? "search-active" : undefined}
          />
          {searchQuery && (
            <span id="search-active" className="sr-only">
              Search filter active: {searchQuery}
            </span>
          )}
        </div>
      </div>

      <Separator />

      {/* Categories */}
      <CategoriesSection />

      {/* Sort By - New Section Added */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Sort By</label>
        <div className="flex flex-col gap-2">
          {/* Sort Options - Mobile Friendly */}
          <Button
            variant={sortBy === "popular" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("popular")}
            className={cn(
              "justify-start h-auto p-3 transition-all duration-200",
              sortBy === "popular"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted/50"
            )}
          >
            Popular
          </Button>
          <Button
            variant={sortBy === "rating" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("rating")}
            className={cn(
              "justify-start h-auto p-3 transition-all duration-200",
              sortBy === "rating"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted/50"
            )}
          >
            Rating
          </Button>
          <Button
            variant={sortBy === "newest" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("newest")}
            className={cn(
              "justify-start h-auto p-3 transition-all duration-200",
              sortBy === "newest"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted/50"
            )}
          >
            Newest
          </Button>
          <Button
            variant={sortBy === "price-low" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("price-low")}
            className={cn(
              "justify-start h-auto p-3 transition-all duration-200",
              sortBy === "price-low"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted/50"
            )}
          >
            Price: Low to High
          </Button>
          <Button
            variant={sortBy === "price-high" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("price-high")}
            className={cn(
              "justify-start h-auto p-3 transition-all duration-200",
              sortBy === "price-high"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted/50"
            )}
          >
            Price: High to Low
          </Button>
        </div>
      </div>

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
            size="sm"
          >
            <X className="w-4 h-4 mr-2" aria-hidden="true" />
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
              <p className="text-gray-600 mt-1">Expand your knowledge with our expert-led courses</p>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md lg:max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategorySelect(null)}
                className={cn(
                  "rounded-full",
                  selectedCategory === null
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                All Categories
              </Button>
              {categories.slice(0, 6).map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategorySelect(selectedCategory === category.id ? null : category.id)}
                  className={cn(
                    "rounded-full",
                    selectedCategory === category.id
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseList
          url={url}
          userId={userId}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          sortBy={sortBy}
        />
      </div>
    </div>
  )
}
