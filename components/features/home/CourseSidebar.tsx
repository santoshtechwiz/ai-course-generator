"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Filter, Search, XCircle, RefreshCw } from "lucide-react"
import type { CategoryId } from "@/config/categories"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CourseSidebarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: CategoryId | null
  handleCategoryChange: (categoryId: CategoryId | null) => void
  resetFilters: () => void
  courseTypes: Array<{
    id: CategoryId
    label: string
    icon: React.ElementType
    color: string
  }>
  isCollapsed?: boolean
}

// Simple color mapping
const COLOR_MAP = {
  red: { bg: "bg-red-500/20", text: "text-red-700", icon: "text-red-500", hover: "hover:bg-red-500/10" },
  blue: { bg: "bg-blue-500/20", text: "text-blue-700", icon: "text-blue-500", hover: "hover:bg-blue-500/10" },
  green: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-700",
    icon: "text-emerald-500",
    hover: "hover:bg-emerald-500/10",
  },
  yellow: { bg: "bg-amber-500/20", text: "text-amber-700", icon: "text-amber-500", hover: "hover:bg-amber-500/10" },
  purple: { bg: "bg-violet-500/20", text: "text-violet-700", icon: "text-violet-500", hover: "hover:bg-violet-500/10" },
  default: { bg: "bg-primary/20", text: "text-primary", icon: "text-primary", hover: "hover:bg-primary/10" },
}

export function CourseSidebar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  handleCategoryChange,
  resetFilters,
  courseTypes,
  isCollapsed = false,
}: CourseSidebarProps) {
  const getColorStyle = (color: string) => {
    return COLOR_MAP[color as keyof typeof COLOR_MAP] || COLOR_MAP.default
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full w-full bg-card flex flex-col">
        {/* Search Section - Always at the top */}
        <div className="p-4 border-b">
          {!isCollapsed && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="pl-9 pr-9 rounded-full border-muted"
                aria-label="Search courses"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Categories Section */}
        <div className="flex-1 overflow-y-auto p-4">
          {!isCollapsed && (
            <div className="flex items-center px-2 mb-2">
              <Filter className="h-4 w-4 text-muted-foreground mr-2" />
              <h3 className="text-sm font-medium">Categories</h3>
            </div>
          )}

          <div className="space-y-1 px-1">
            {courseTypes.map((type) => {
              const isSelected = selectedCategory === type.id
              const colorStyle = getColorStyle(type.color)

              return (
                <Tooltip key={type.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start font-medium",
                        isSelected ? `${colorStyle.bg} ${colorStyle.text}` : "",
                        !isSelected && colorStyle.hover,
                        isCollapsed && "p-2 justify-center",
                      )}
                      onClick={() => handleCategoryChange(type.id)}
                    >
                      <type.icon
                        className={cn(
                          isSelected ? "text-current" : colorStyle.icon,
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
          </div>
        </div>

        {/* Reset Filters Button - At the bottom */}
        {!isCollapsed && (
          <div className="p-4 border-t">
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
    </TooltipProvider>
  )
}
