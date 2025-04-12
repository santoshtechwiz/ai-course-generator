"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { motion } from "framer-motion"
import { Filter, Search, XCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import type React from "react"
import type { CategoryId } from "@/config/categories"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  isCollapsed?: boolean
  toggleSidebar?: () => void
}

type ColorConfig = {
  selected: string
  default: string
  icon: string
  hover: string
}

type ColorMap = {
  [key: string]: ColorConfig
}

const categoryColorMap: ColorMap = {
  red: {
    selected: "bg-red-500/20 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    default: "text-red-700 dark:text-red-400",
    icon: "text-red-500",
    hover: "hover:bg-red-500/10",
  },
  blue: {
    selected: "bg-blue-500/20 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    default: "text-blue-700 dark:text-blue-400",
    icon: "text-blue-500",
    hover: "hover:bg-blue-500/10",
  },
  green: {
    selected: "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    default: "text-emerald-700 dark:text-emerald-400",
    icon: "text-emerald-500",
    hover: "hover:bg-emerald-500/10",
  },
  yellow: {
    selected: "bg-amber-500/20 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    default: "text-amber-700 dark:text-amber-400",
    icon: "text-amber-500",
    hover: "hover:bg-amber-500/10",
  },
  purple: {
    selected: "bg-violet-500/20 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
    default: "text-violet-700 dark:text-violet-400",
    icon: "text-violet-500",
    hover: "hover:bg-violet-500/10",
  },
  // Fallback colors if none match
  default: {
    selected: "bg-primary/20 text-primary dark:bg-primary/20 dark:text-primary",
    default: "text-primary dark:text-primary",
    icon: "text-primary",
    hover: "hover:bg-primary/10",
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
  isCollapsed = false,
  toggleSidebar,
}) => {
  const getColorConfig = (color: string): ColorConfig => {
    return categoryColorMap[color] || categoryColorMap.default
  }

  const [isFilterOpen, setIsFilterOpen] = useState(true)

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="flex flex-col w-full h-full bg-card relative overflow-hidden">
        {toggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-4 h-6 w-6 rounded-full border bg-background z-10 shadow-sm"
            onClick={toggleSidebar}
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
        )}

        <div className="flex flex-col h-full p-4 space-y-4 overflow-hidden">
          {/* Search Section - Only show when not collapsed */}
          {!isCollapsed && (
            <>
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Search className="h-4 w-4" />
                  </div>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search courses..."
                    className={cn(
                      "pl-9 pr-9 bg-background",
                      "focus-visible:ring-1 focus-visible:ring-offset-0",
                      "transition-colors rounded-full border-muted",
                    )}
                  />
                  {searchQuery.trim() !== "" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded-full"
                      onClick={handleClearSearch}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {searchQuery.trim() !== "" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between px-2 py-1.5 text-sm text-muted-foreground"
                  >
                    <span className="truncate">Search: {searchQuery}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground flex-shrink-0"
                      onClick={handleClearSearch}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </div>

              <Separator className="my-2" />
            </>
          )}

          {/* Categories Section */}
          <div className="space-y-2 flex-1 overflow-y-auto">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Categories</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 p-0"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <motion.div animate={{ rotate: isFilterOpen ? 0 : 180 }} transition={{ duration: 0.2 }}>
                    <Filter className="h-4 w-4" />
                  </motion.div>
                </Button>
              </div>
            )}

            {(isFilterOpen || isCollapsed) && (
              <motion.div
                initial={isCollapsed ? {} : { opacity: 0, height: 0 }}
                animate={isCollapsed ? {} : { opacity: 1, height: "auto" }}
                exit={isCollapsed ? {} : { opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1 px-1"
              >
                {courseTypes.map((type) => {
                  const isSelected = selectedCategory === type.id
                  const colorConfig = getColorConfig(type.color)

                  return (
                    <Tooltip key={type.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-start font-medium transition-colors",
                            "active:scale-[0.98] active:transition-none",
                            isSelected ? colorConfig.selected : colorConfig.default,
                            !isSelected && colorConfig.hover,
                            isCollapsed && "p-2 justify-center",
                          )}
                          onClick={() => handleCategoryChange(type.id)}
                        >
                          <type.icon
                            className={cn(
                              "transition-colors",
                              isSelected ? "text-current" : colorConfig.icon,
                              isCollapsed ? "mr-0" : "mr-2",
                              "h-4 w-4",
                            )}
                          />
                          {!isCollapsed && <span>{type.label}</span>}
                        </Button>
                      </TooltipTrigger>
                      {isCollapsed && <TooltipContent side="right">{type.label}</TooltipContent>}
                    </Tooltip>
                  )
                })}
              </motion.div>
            )}
          </div>

          {!isCollapsed && (
            <div className="pt-4">
              <Button
                onClick={resetFilters}
                variant="outline"
                size="sm"
                className="w-full font-medium gap-2 rounded-full"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
