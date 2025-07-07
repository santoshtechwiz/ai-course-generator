"use client"

import { type Control, Controller, type FieldErrors } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CreateCourseInput } from "@/schema/schema"
import { CategorySelector } from "@/app/dashboard/create/components/CategorySelector"

interface BasicInfoStepProps {
  control: Control<CreateCourseInput>
  errors: FieldErrors<CreateCourseInput>
  titleDefaultValue?: string
  categoryDefaultValue?: string
}

export function BasicInfoStep({ control, errors, titleDefaultValue, categoryDefaultValue }: BasicInfoStepProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-medium">
          Course Title
        </Label>
        <Controller
          name="title"
          control={control}
          defaultValue={titleDefaultValue || ""}
          render={({ field }) => (
            <Input {...field} id="title" placeholder="Enter course title" className="transition-all duration-200" />
          )}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-medium">
          Course Description
        </Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              id="description"
              placeholder="Enter course description"
              className="min-h-[120px] transition-all duration-200"
            />
          )}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-base font-medium">Course Category</Label>
        <Controller
          name="category"
          control={control}
          defaultValue={categoryDefaultValue || ""}
          render={({ field }) => <CategorySelector {...field} />}
        />
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
      </div>
    </div>
  )
}
