import { Badge } from "@/components/ui/badge"
import { Tag } from "lucide-react"

interface TagsDisplayProps {
  tags: string[]
  maxVisible?: number
}

export function TagsDisplay({ tags, maxVisible = 3 }: TagsDisplayProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  const visibleTags = tags.slice(0, maxVisible)
  const remainingTagsCount = tags.length - visibleTags.length

  return (
    <div className="flex flex-wrap gap-2">
      {visibleTags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="text-xs sm:text-sm bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 whitespace-nowrap shadow-sm"
        >
          <Tag className="w-3 h-3 mr-1 flex-shrink-0" />
          {tag}
        </Badge>
      ))}
      {remainingTagsCount > 0 && (
        <Badge
          variant="secondary"
          className="text-xs sm:text-sm bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 whitespace-nowrap shadow-sm"
        >
          +{remainingTagsCount} more
        </Badge>
      )}
    </div>
  )
}
