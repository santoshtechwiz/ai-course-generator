"use client"

import { type Control, Controller, type FieldErrors } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

import type { CreateCourseInput } from "@/schema/schema"
import { useToast } from "@/hooks"

interface ContentStepProps {
  control: Control<CreateCourseInput>
  errors: FieldErrors<CreateCourseInput>
  watchedFields: Partial<CreateCourseInput>
}

export function ContentStep({ control, errors, watchedFields }: ContentStepProps) {
  const { toast } = useToast()
  const units = watchedFields.units || []

  const handleAddUnit = () => {
    if (units.length >= 3) {
      toast({
        title: "Maximum Units Reached",
        description: "You can only add up to 3 units per course.",
        variant: "destructive",
      })
      return
    }
    // Use the controller setValue method instead
  }

  const handleRemoveUnit = (index: number) => {
    // Use the controller setValue method instead
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Course Units</h3>
        <p className="text-sm text-muted-foreground">Add up to 3 units for your course.</p>
      </div>

      {units.map((unit, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center gap-3">
            <Label htmlFor={`unit-${index}`} className="text-base font-medium flex-shrink-0">
              Unit {index + 1}
            </Label>
            {index > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveUnit(index)}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
          <Controller
            name={`units.${index}`}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={`unit-${index}`}
                placeholder={`Enter unit ${index + 1} title`}
                className="transition-all duration-200"
              />
            )}
          />
          {errors.units && errors.units[index] && (
            <p className="text-sm text-destructive">{errors.units[index]?.message}</p>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleAddUnit}
        disabled={units.length >= 3}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Unit
      </Button>
    </div>
  )
}
