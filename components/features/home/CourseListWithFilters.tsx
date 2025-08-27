"use client"

import React, { useState } from "react"
import { Search, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import CourseList from "./CourseLists"
import { CategoryTagCloud } from "./CategoryTagCloud"
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

  // Sidebar content component
  const SidebarContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Search Courses</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Separator />

      {/* Categories */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Categories</label>
          {selectedCategory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="h-6 px-2 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
        <div className="space-y-2">
          <CategoryTagCloud
            selectedCategory={selectedCategory}
            onSelect={handleCategorySelect}
            enableClear={false}
          />
        </div>
      </div>

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full"
            size="sm"
          >
            <X className="w-4 h-4 mr-2" />
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
        <Card className="sticky top-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SidebarContent />
          </CardContent>
        </Card>
      </div>

      {/* Mobile Filter Trigger */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {(searchQuery ? 1 : 0) + (selectedCategory ? 1 : 0)}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="py-6">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear all
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
