import { UseFormWatch } from "react-hook-form"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateCourseInput } from "./schema"

interface PreviewStepProps {
  watch: UseFormWatch<CreateCourseInput>
}

export function PreviewStep({ watch }: PreviewStepProps) {
  const title = watch("title")
  const description = watch("description")
  const units = watch("units")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">{title || "Course Title"}</CardTitle>
        <CardDescription className="text-lg text-gray-700">
          {description || "Course Description"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Units:</h3>
        <div className="space-y-3">
          {units.map((unit, index) => (
            <div key={index} className="flex items-center space-x-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                {index + 1}
              </span>
              <span className="text-lg text-gray-700">{unit || `Unit ${index + 1}`}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

