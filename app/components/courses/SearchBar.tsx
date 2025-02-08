import type React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X, Search } from "lucide-react"

interface SearchBarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleClearSearch: () => void
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, handleClearSearch }) => {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search courses..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-8 pr-8"
      />
      {searchQuery && (
        <Button variant="ghost" size="sm" className="absolute right-2 top-2 h-5 w-5 p-0" onClick={handleClearSearch}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

