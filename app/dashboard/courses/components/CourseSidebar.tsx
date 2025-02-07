import React from "react"
import { Input } from "@/components/ui/input"
import { type CategoryId, categories } from "@/config/categories"
import { Search, X } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CourseSidebarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategories: CategoryId[]
  toggleCategory: (categoryId: CategoryId) => void
  handleClearSearch: () => void
  isPending: boolean
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategories,
  toggleCategory,
  handleClearSearch,
  isPending,
}) => {
  return (
    <aside className="w-80 bg-background border-r px-4 py-6 overflow-y-auto h-screen">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="pl-9 w-full bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search courses"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="space-y-1">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.id)
            const Icon = category.icon

            return (
              <motion.button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  category.color,
                  isSelected ? "bg-accent text-accent-foreground" : "text-foreground/60",
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{category.label}</span>
              </motion.button>
            )
          })}
        </nav>
      </div>
      {isPending && <div className="mt-4 text-sm text-muted-foreground px-3">Loading more courses...</div>}
    </aside>
  )
}

export default React.memo(CourseSidebar)

