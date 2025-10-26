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
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Course Preview</h3>
        <p className="text-sm text-muted-foreground">This is how your course will appear to students.</p>
      </div>

      <div className="space-y-4 p-6 bg-card rounded-lg border-4 border-border shadow-neo">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">{title || "Course Title"}</h2>
          {category && (
            <Badge variant="secondary" className="text-xs font-medium border-4 border-border">
              {category}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">{description || "Course Description"}</p>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <BookOpen className="mr-2 h-5 w-5 text-accent" />
            Course Content
          </h3>
          <div className="space-y-2">
            {units.map((unit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent text-background font-medium text-sm font-black border-4 border-border">
                  {index + 1}
                </span>
                <span className="text-base text-foreground">{unit || `Unit ${index + 1}`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
