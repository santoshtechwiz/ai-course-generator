"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import type React from "react"
import { memo } from "react"

interface SearchBarProps {
  search: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearSearch: () => void
  isSearching: boolean
}

function SearchBarComponent({ search, onSearchChange, onClearSearch, isSearching }: SearchBarProps) {
  return (
    <div className="relative w-full group">
      {/* Left Search Icon */}
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Search Input */}
      <Input
        type="search"
        placeholder="Search quizzes..."
        value={search}
        onChange={onSearchChange}
        className="pl-10 pr-10 w-full h-11 rounded-md border border-input focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
      />

      {/* Clear Search Button */}
      {isSearching && (
        <button
          onClick={onClearSearch}
          className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const SearchBar = memo(SearchBarComponent)
