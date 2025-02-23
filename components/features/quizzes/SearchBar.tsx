import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import type React from "react" // Added import for React

interface SearchBarProps {
  search: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearSearch: () => void
  isSearching: boolean
}

export function SearchBar({ search, onSearchChange, onClearSearch, isSearching }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search quizzes..."
        value={search}
        onChange={onSearchChange}
        className="pl-10 w-full"
      />
      {isSearching && (
        <button
          onClick={onClearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

