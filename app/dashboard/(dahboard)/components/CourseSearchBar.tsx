import type React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface CourseSearchBarProps {
  search: string
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClearSearch: () => void
  isSearching: boolean
}

export const CourseSearchBar: React.FC<CourseSearchBarProps> = ({
  search,
  onSearchChange,
  onClearSearch,
  isSearching,
}) => {
  return (
    <div className="relative">
      <Input type="text" placeholder="Search courses..." value={search} onChange={onSearchChange} className="pr-10" />
      {isSearching ? (
        <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={onClearSearch}>
          <X className="h-4 w-4" />
        </Button>
      ) : (
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      )}
    </div>
  )
}

