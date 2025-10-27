"use client"

import React, { ReactNode } from "react"
import { Search, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface BaseListLayoutProps {
  // Header content
  title: string
  description: string
  icon?: ReactNode

  // Search
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  resultCount?: number

  // Filters sidebar
  filterSidebar: ReactNode

  // Content grid
  contentGrid: ReactNode

  // Actions
  onCreateClick?: () => void
  createButtonText?: string

  // Layout options
  showFiltersOnMobile?: boolean
  className?: string
}

export function BaseListLayout({
  title,
  description,
  icon,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  resultCount,
  filterSidebar,
  contentGrid,
  onCreateClick,
  createButtonText = "Create",
  showFiltersOnMobile = false,
  className,
}: BaseListLayoutProps) {
  return (
    <div className={cn("relative min-h-screen bg-[hsl(var(--background))]", className)}>
      {/* Header Section */}
      <div className="border-b border-border bg-background p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Title and Description */}
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,0.9)]">
                    {icon}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-[hsl(var(--foreground))] leading-tight">
                    {title}
                  </h1>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] font-medium mt-1">
                    {description}
                  </p>
                </div>
              </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md lg:max-w-sm">
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <Search className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                </div>
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-12 pl-12 pr-20 text-base font-medium bg-[hsl(var(--background))] border-4 border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] shadow-[4px_4px_0_0_rgba(0,0,0,0.9)] rounded-2xl transition-all duration-200"
                  aria-label="Search"
                  autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  {searchValue && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSearchChange("")}
                      className="h-8 w-8 p-0 hover:bg-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive-foreground))] rounded-full"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {resultCount !== undefined && (
                    <Badge
                      variant="default"
                      className="px-3 py-1 text-sm font-bold bg-[hsl(var(--secondary))] border-2 border-[hsl(var(--border))] shadow-[2px_2px_0_0_rgba(0,0,0,0.9)]"
                    >
                      {resultCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 xl:gap-10">
          {/* Filter Sidebar */}
          <div className={cn(
            showFiltersOnMobile ? "block" : "hidden lg:block"
          )}>
            {filterSidebar}
          </div>

          {/* Content Grid */}
          <div className="min-w-0">
            {contentGrid}
          </div>
        </div>
      </div>
    </div>
  )
}