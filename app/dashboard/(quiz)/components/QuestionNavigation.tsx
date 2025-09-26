"use client"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface QuestionNavigationProps {
  currentIndex: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export function QuestionNavigation({ currentIndex, total, onPrev, onNext }: QuestionNavigationProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrev}
        disabled={currentIndex === 0}
        className="flex items-center gap-2 bg-transparent min-h-[44px] px-4"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="px-3 py-1 text-sm">
          <span className="hidden sm:inline">Question </span>{currentIndex + 1}<span className="hidden sm:inline"> of {total}</span>
        </Badge>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(total, 10) }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === currentIndex ? "bg-primary" : i < currentIndex ? "bg-primary/50" : "bg-muted-foreground/30"
              }`}
            />
          ))}
          {total > 10 && <span className="text-xs text-muted-foreground ml-1">...</span>}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={currentIndex === total - 1}
        className="flex items-center gap-2 bg-transparent min-h-[44px] px-4"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
