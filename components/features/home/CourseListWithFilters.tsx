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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId as CategoryId | null)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory(null)
  }

  const hasActiveFilters = searchQuery || selectedCategory

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
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <Card className="sticky top-6 h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" aria-hidden="true" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary border-primary/20">
                  {(searchQuery ? 1 : 0) + (selectedCategory ? 1 : 0)} active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto sidebar-scroll">
            <SidebarContent />
          </CardContent>
        </Card>
      </div>

      {/* Mobile Filter Trigger */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex items-center gap-2 transition-colors",
                  hasActiveFilters && "border-primary/50 bg-primary/5 text-primary"
                )}
                aria-label={`Open filters ${hasActiveFilters ? `(${hasActiveFilters ? (searchQuery ? 1 : 0) + (selectedCategory ? 1 : 0) : 0} active)` : ''}`}
              >
                <Filter className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <Badge className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {(searchQuery ? 1 : 0) + (selectedCategory ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <div className="py-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {(searchQuery ? 1 : 0) + (selectedCategory ? 1 : 0)} active
                    </Badge>
                  )}
                </div>

                {/* Mobile Search - Full width */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground" htmlFor="mobile-course-search">
                    Search Courses
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
                    <Input
                      id="mobile-course-search"
                      placeholder="Search courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={cn(
                        "pl-10 transition-colors",
                        searchQuery && "border-primary/50 bg-primary/5"
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Mobile Categories - Responsive grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-foreground">Categories</label>
                    {selectedCategory && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                        className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Mobile Categories Grid - 2 columns on larger mobile screens */}
                  <div className="mobile-categories-grid">
                    {/* All Categories Option */}
                    <Button
                      variant={selectedCategory === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategorySelect(null)}
                      className={cn(
                        "justify-start h-auto p-3 transition-all duration-200 col-span-2",
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

                    {/* Individual Categories - 2 per row on larger screens */}
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
                          <div className="flex items-center gap-2 w-full">
                            <div className={cn(
                              "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0",
                              isSelected
                                ? "bg-primary-foreground/20"
                                : "bg-muted"
                            )}>
                              <category.icon className={cn(
                                "w-3 h-3",
                                isSelected ? "text-primary-foreground" : "text-muted-foreground"
                              )} />
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <div className="font-medium text-xs truncate">{category.label}</div>
                            </div>
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Mobile Clear All Filters */}
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
            </SheetContent>
          </Sheet>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4 mr-1" aria-hidden="true" />
              <span className="hidden sm:inline">Clear all</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <CourseList
          url={url}
          userId={userId}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
        />
      </div>
    </div>
  )
}
