"use client"

import type { UseFormWatch } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
        <h2 className="text-2xl font-semibold tracking-tight">Course Preview</h2>
        <p className="text-sm text-muted-foreground">This is how your course will appear to students.</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">{title || "Course Title"}</CardTitle>
            {category && (
              <Badge variant="secondary" className="text-xs font-medium">
                {category}
              </Badge>
            )}
          </div>
          <CardDescription className="text-base">{description || "Course Description"}</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Course Content
          </h3>
          <div className="space-y-4">
            {units.map((unit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-medium text-sm">
                  {index + 1}
                </span>
                <span className="text-base">{unit || `Unit ${index + 1}`}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

