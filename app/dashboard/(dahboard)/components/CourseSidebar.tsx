import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type React from "react"
import type { CategoryId } from "@/config/categories"
import { CourseSearchBar } from "./CourseSearchBar"

interface CourseSidebarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: CategoryId | null
  handleCategoryChange: (categoryId: CategoryId | null) => void
  handleClearSearch: () => void
  resetFilters: () => void
  isPending: boolean
  courseTypes: Array<{ id: CategoryId; label: string; icon: React.ElementType; color: string }>
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
  return (
    <div className="w-full lg:w-[300px] space-y-6 p-4 bg-gray-100 h-full">
      <CourseSearchBar
        search={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        onClearSearch={handleClearSearch}
        isSearching={searchQuery.trim() !== ""}
      />
      <h3 className="text-lg font-semibold mb-2">Categories</h3>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-2">
          {courseTypes.map((type) => (
            <Button
              key={type.id}
              variant={selectedCategory === type.id ? "default" : "outline"}
              size="sm"
              className={`w-full justify-start transition-all duration-200 ${
                selectedCategory === type.id
                  ? `bg-${type.color}-500 hover:bg-${type.color}-600 text-white`
                  : `hover:bg-${type.color}-100`
              }`}
              onClick={() => handleCategoryChange(type.id)}
            >
              <type.icon
                className={`mr-2 h-4 w-4 ${selectedCategory === type.id ? "text-white" : `text-${type.color}-500`}`}
              />
              {type.label}
            </Button>
          ))}
        </div>
      </ScrollArea>
      <Button onClick={resetFilters} variant="outline" className="w-full">
        Reset Filters
      </Button>
    </div>
  )
}

