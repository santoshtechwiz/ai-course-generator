import type { UseFormWatch } from "react-hook-form"
import { Badge } from "@/components/ui/badge"
import type { CreateCourseInput } from "@/schema/schema"
import { BookOpen } from "lucide-react"

interface PreviewStepProps {
  watch: UseFormWatch<CreateCourseInput>
}

export function PreviewStep({ watch }: PreviewStepProps) {
  const title = watch("title")
  const description = watch("description")
  const category = watch("category")
  const units = watch("units")

  return (
    <div className="space-y-6 w-full">
      <div className="space-y-2">
        <h3 className="text-base sm:text-lg font-bold text-foreground">Course Preview</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">This is how your course will appear to students.</p>
      </div>

      <div className="space-y-4 p-4 sm:p-6 bg-card rounded-none border-4 border-border shadow-neo">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground break-words">{title || "Course Title"}</h2>
          {category && (
            <Badge
              variant="secondary"
              className="text-xs sm:text-sm font-medium border-4 border-border whitespace-nowrap"
            >
              {category}
            </Badge>
          )}
        </div>
        <p className="text-sm sm:text-base text-muted-foreground break-words">{description || "Course Description"}</p>
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-accent flex-shrink-0" />
            Course Content
          </h3>
          <div className="space-y-2">
            {units.map((unit, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-none bg-accent text-background font-medium text-xs sm:text-sm font-black border-4 border-border flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-sm sm:text-base text-foreground break-words">{unit || `Unit ${index + 1}`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
