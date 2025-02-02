"use client"

import { type Control, Controller, type FieldErrors } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CreateCourseInput } from "@/schema/schema"
import { CategorySelector } from "./CategorySelector"

interface BasicInfoStepProps {
  control: Control<CreateCourseInput>
  errors: FieldErrors<CreateCourseInput>
}

export function BasicInfoStep({ control, errors }: BasicInfoStepProps) {
  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-background  rounded-lg shadow-sm">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Course Information</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title" className="text-base font-medium">
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
                className="transition-all duration-200 focus:ring-2 focus:ring-ring"
              />
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
                className="min-h-[120px] transition-all duration-200 focus:ring-2 focus:ring-ring"
              />
            )}
          />
          {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <Label className="text-base font-medium">Category</Label>
            <p className="text-sm text-muted-foreground">Choose the category that best describes your course</p>
          </div>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <CategorySelector value={field.value} onChange={field.onChange} error={!!errors.category} />
            )}
          />
          {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
        </div>
      </div>
    </div>
  )
}

