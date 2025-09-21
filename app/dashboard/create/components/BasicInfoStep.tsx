"use client"

import { type Control, Controller, type FieldErrors } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CreateCourseInput } from "@/schema/schema"
import type { QueryParams } from "@/app/types/types"

interface BasicInfoStepProps {
  control: Control<CreateCourseInput>
  errors: FieldErrors<CreateCourseInput>
  params?: QueryParams
}

export function BasicInfoStep({ control, errors, params }: BasicInfoStepProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-medium">
          Course Title
        </Label>
        <Controller
          name="title"
          control={control}
          defaultValue={params?.title || ""}
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
        <div className="flex flex-col gap-1">
          <Label htmlFor="category" className="text-base font-medium">Category</Label>
          <p className="text-sm text-muted-foreground">Enter a category that describes your course (e.g., "web development", "data science")</p>
        </div>
        <Controller
          name="category"
          control={control}
          defaultValue={params?.category || ""}
          render={({ field }) => (
            <Input 
              {...field} 
              id="category" 
              placeholder="e.g., programming, mathematics, design" 
              className="transition-all duration-200" 
            />
          )}
        />
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
      </div>
    </div>
  )
}
