"use client"

import type * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CourseSearchBarProps {
  search: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearSearch: () => void
  isSearching: boolean
}

export function CourseSearchBar({ search, onSearchChange, onClearSearch, isSearching }: CourseSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={search}
        onChange={onSearchChange}
        placeholder="Search courses..."
        className={cn(
          "pl-9 pr-9 bg-background",
          "focus-visible:ring-1 focus-visible:ring-offset-0",
          "transition-colors",
        )}
      />
      {isSearching && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={onClearSearch}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

