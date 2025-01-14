import { Control, Controller, FieldErrors } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { CreateCourseInput } from "@/schema/schema"
import { CategorySelector } from "./CategorySelector"

interface BasicInfoStepProps {
  control: Control<CreateCourseInput>
  errors: FieldErrors<CreateCourseInput>
}

export function BasicInfoStep({ control, errors }: BasicInfoStepProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-lg font-medium text-gray-900">
          Course Title
        </Label>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="title"
              placeholder="Enter course title"
              className="h-12 text-lg text-gray-900"
              spellCheck="true"
            />
          )}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description" className="text-lg font-medium text-gray-900">
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
              className="min-h-[150px] text-lg text-gray-900"
              spellCheck="true"
            />
          )}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <Label className="text-lg font-medium text-gray-900">Category</Label>
          <p className="text-sm text-muted-foreground">
            Choose the category that best describes your course
          </p>
        </div>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <CategorySelector
              value={field.value}
              onChange={field.onChange}
              error={!!errors.category}
            />
          )}
        />
        {errors.category && (
          <p className="text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>
    </div>
  )
}

