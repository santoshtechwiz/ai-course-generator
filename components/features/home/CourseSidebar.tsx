"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { motion } from "framer-motion"
import { XCircle } from "lucide-react"
import type React from "react"
import type { CategoryId } from "@/config/categories"
import { CourseSearchBar } from "./CourseSearchBar"
import { cn } from "@/lib/utils"

interface CourseSidebarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: CategoryId | null
  handleCategoryChange: (categoryId: CategoryId | null) => void
  handleClearSearch: () => void
  resetFilters: () => void
  isPending: boolean
  courseTypes: Array<{
    id: CategoryId
    label: string
    icon: React.ElementType
    color: string
  }>
}

type ColorConfig = {
  selected: string
  default: string
  icon: string
}

type ColorMap = {
  [key: string]: ColorConfig
}

const categoryColorMap: ColorMap = {
  red: {
    selected:
      "bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-400",
    default: "hover:bg-red-500/10 text-red-700 dark:text-red-400",
    icon: "text-red-500",
  },
  blue: {
    selected:
      "bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 dark:text-blue-400",
    default: "hover:bg-blue-500/10 text-blue-700 dark:text-blue-400",
    icon: "text-blue-500",
  },
  green: {
    selected:
      "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-400",
    default: "hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: "text-emerald-500",
  },
  yellow: {
    selected:
      "bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-400",
    default: "hover:bg-amber-500/10 text-amber-700 dark:text-amber-400",
    icon: "text-amber-500",
  },
  purple: {
    selected:
      "bg-violet-500/20 hover:bg-violet-500/30 text-violet-700 dark:bg-violet-500/20 dark:hover:bg-violet-500/30 dark:text-violet-400",
    default: "hover:bg-violet-500/10 text-violet-700 dark:text-violet-400",
    icon: "text-violet-500",
  },
  // Fallback colors if none match
  default: {
    selected:
      "bg-primary/20 hover:bg-primary/30 text-primary dark:bg-primary/20 dark:hover:bg-primary/30 dark:text-primary",
    default: "hover:bg-primary/10 text-primary dark:text-primary",
    icon: "text-primary",
  },
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  handleCategoryChange,
  handleClearSearch,
  resetFilters,
  courseTypes,
}) => {
  const getColorConfig = (color: string): ColorConfig => {
    return categoryColorMap[color] || categoryColorMap.default
  }

  return (
    <aside className="flex flex-col w-full lg:w-[300px] h-[calc(100vh-4rem)] border-r bg-card">
      <div className="flex flex-col flex-grow p-4 space-y-4">
        {/* Search Section */}
        <div className="space-y-2">
          <CourseSearchBar
            search={searchQuery}
            onSearchChange={(e) => setSearchQuery(e.target.value)}
            onClearSearch={handleClearSearch}
            isSearching={searchQuery.trim() !== ""}
          />
          {searchQuery.trim() !== "" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between px-2 py-1.5 text-sm text-muted-foreground"
            >
              <span>Search results for: {searchQuery}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={handleClearSearch}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Categories Section */}
        <div className="space-y-2">
          
          <ScrollArea className="h-[calc(100vh-16rem)] pr-4">
            <div className="space-y-1.5 p-1">
              {courseTypes.map((type) => {
                const isSelected = selectedCategory === type.id
                const colorConfig = getColorConfig(type.color)

                return (
                  <Button
                    key={type.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "active:scale-[0.98] active:transition-none",
                      isSelected ? colorConfig.selected : colorConfig.default,
                    )}
                    onClick={() => handleCategoryChange(type.id)}
                  >
                    <type.icon
                      className={cn("mr-2 h-4 w-4 transition-colors", isSelected ? "text-current" : colorConfig.icon)}
                    />
                    {type.label}
                  </Button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        <div className="mt-auto pt-4">
          <Button
            onClick={resetFilters}
            variant="outline"
            size="sm"
            className="w-full font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Reset Filters
          </Button>
        </div>
      </div>
    </aside>
  )
}

