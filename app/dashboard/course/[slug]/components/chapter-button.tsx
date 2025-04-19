import React from 'react'
import { cn } from "@/lib/utils"
import { Lock, CheckCircle, BookOpen, PlayCircle } from 'lucide-react'


interface ChapterButtonProps {
  chapter: Chapter
  unitIndex: number
  chapterIndex: number
  isCompleted: boolean
  isCurrentlyPlaying: boolean
  isSelected: boolean
  onSelect: () => void
}

export function ChapterButton({
  chapter,
  unitIndex,
  chapterIndex,
  isCompleted,
  isCurrentlyPlaying,
  isSelected,
  onSelect,
}: ChapterButtonProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-md transition-all duration-200",
        isCurrentlyPlaying && "bg-primary/10 text-primary",
        isSelected && !isCurrentlyPlaying && "bg-accent text-accent-foreground",
        isCompleted && !isCurrentlyPlaying && !isSelected && "bg-secondary/50 text-secondary-foreground",
        !isCompleted && !isCurrentlyPlaying && !isSelected && "hover:bg-muted",
        !chapter.videoId && "opacity-50 cursor-not-allowed"
      )}
      disabled={!chapter.videoId}
    >
      <ChapterIcon
        isCompleted={isCompleted && !isCurrentlyPlaying}
        isSelected={isSelected && !isCurrentlyPlaying}
        isCurrentlyPlaying={isCurrentlyPlaying}
      />
      <div className="flex flex-col items-start">
        <span
          className={cn(
            "text-xs",
            isCurrentlyPlaying
              ? "text-primary"
              : "text-muted-foreground"
          )}>
          Chapter {unitIndex + 1}.{chapterIndex + 1}
        </span>
        <span
          className={cn(
            "font-medium text-left text-sm",
            isCurrentlyPlaying
              ? "text-primary"
              : isSelected
              ? "text-accent-foreground"
              : "text-foreground"
          )}>
          {chapter.name}
        </span>
      </div>
    </button>
  )
}

interface ChapterIconProps {
  isCompleted: boolean
  isSelected: boolean
  isCurrentlyPlaying: boolean
}

const ChapterIcon = React.memo<ChapterIconProps>(
  ({ isCompleted, isSelected, isCurrentlyPlaying }) => {
    if (isCurrentlyPlaying) {
      return <PlayCircle className="h-5 w-5 flex-shrink-0 text-primary" />
    }
    if (isCompleted && !isCurrentlyPlaying) {
      return <CheckCircle className="h-5 w-5 flex-shrink-0 text-secondary" />
    }
    if (isSelected && !isCurrentlyPlaying) {
      return <BookOpen className="h-5 w-5 flex-shrink-0 text-accent-foreground" />
    }
    return <Lock className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
  }
)

ChapterIcon.displayName = "ChapterIcon"

