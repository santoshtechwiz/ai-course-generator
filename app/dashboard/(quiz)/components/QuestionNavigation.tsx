import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface QuestionNavigationProps {
  currentIndex: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export function QuestionNavigation({ currentIndex, total, onPrev, onNext }: QuestionNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={onPrev}
        disabled={currentIndex === 0}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {total}
        </p>
        <Progress 
          value={((currentIndex + 1) / total) * 100} 
          className="w-32 h-2 mt-1"
        />
      </div>
      <Button
        variant="outline"
        onClick={onNext}
        disabled={currentIndex === total - 1}
        className="flex items-center gap-2"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
