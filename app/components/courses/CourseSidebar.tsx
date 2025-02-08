"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { type CategoryId, categories } from "@/config/categories"
import { Search, X } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useCallback, useMemo, useId } from "react"

interface CourseSidebarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: CategoryId | null
  handleCategoryChange: (categoryId: CategoryId | null) => void
  handleClearSearch: () => void
  resetFilters: () => void
  isPending: boolean
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  handleCategoryChange,
  handleClearSearch,
  resetFilters,
  isPending,
}) => {
  const searchId = useId()

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
    },
    [setSearchQuery],
  )

  const categoryButtons = useMemo(
    () =>
      categories.map((category) => {
        const isSelected = selectedCategory === category.id
        const Icon = category.icon

        return (
          <motion.button
            key={category.id}
            onClick={() => handleCategoryChange(isSelected ? null : category.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              category.color,
              isSelected ? "bg-accent text-accent-foreground" : "text-foreground/60",
            )}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            aria-label={`${category.label} category ${isSelected ? "selected" : ""}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{category.label}</span>
          </motion.button>
        )
      }),
    [selectedCategory, handleCategoryChange],
  )

  return (
    <aside className="w-80 bg-background border-r px-4 py-6 overflow-y-auto h-screen">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="pl-9 w-full bg-background"
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search courses"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="space-y-1">{categoryButtons}</nav>

        {(searchQuery || selectedCategory) && (
          <button
            onClick={resetFilters}
            className="w-full px-3 py-2 text-sm font-medium text-blue-500 hover:text-blue-600"
          >
            Clear all filters
          </button>
        )}
      </div>
      {isPending && <div className="mt-4 text-sm text-muted-foreground px-3">Loading more courses...</div>}
    </aside>
  )
}

