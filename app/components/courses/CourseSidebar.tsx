import React from "react"
import { Button } from "@/components/ui/button"
import { categories, type CategoryId } from "@/config/categories"

interface CourseSidebarProps {
  selectedCategory: CategoryId | null
  handleCategoryChange: (categoryId: CategoryId | null) => void
  resetFilters: () => void
  isPending: boolean
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
  selectedCategory,
  handleCategoryChange,
  resetFilters,
  isPending,
}) => {
  return (
    <div className="space-y-4">
      {/* <h3 className="font-semibold mb-2">Categories</h3> */}
      <div className="space-y-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(category.id === selectedCategory ? null : category.id)}
            className="w-full justify-start text-left"
          >
            {React.createElement(category.icon)}
            {category.label}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={resetFilters}
        disabled={isPending || !selectedCategory}
        className="w-full mt-4"
      >
        Reset Filters
      </Button>
    </div>
  )
}

