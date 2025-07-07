"use client"

import { type Control, Controller, type FieldErrors, type UseFormSetValue, type UseFormWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

import type { CreateCourseInput } from "@/schema/schema"
import { useToast } from "@/hooks"

interface ContentStepProps {
  control: Control<CreateCourseInput>
  errors: FieldErrors<CreateCourseInput>
  watch: UseFormWatch<CreateCourseInput>
  setValue: UseFormSetValue<CreateCourseInput>
}

export function ContentStep({ control, errors, watch, setValue }: ContentStepProps) {
  const { toast } = useToast()
  const units = watch("units")

  const handleAddUnit = () => {
    if (units.length >= 3) {
      toast({
        title: "Maximum Units Reached",
        description: "You can only add up to 3 units per course.",
        variant: "destructive",
      })
      return
    }
    setValue("units", [...units, ""])
  }

  const handleRemoveUnit = (index: number) => {
    setValue(
      "units",
      units.filter((_, i) => i !== index),
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Course Units</h3>
        <p className="text-sm text-muted-foreground">Add up to 3 units for your course.</p>
      </div>

      {units.map((unit, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor={`unit-${index}`} className="text-base font-medium">
                Unit {index + 1}
              </Label>
              <Controller
                name={`units.${index}`}
                control={control}
                render={({ field }) => (
                  <Input
                    id={`unit-${index}`}
                    placeholder="Enter unit title"
                    className="transition-all duration-200 focus:ring-2 focus:ring-ring"
                    {...field}
                    spellCheck="true"
                  />
                )}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleRemoveUnit(index)}
              disabled={units.length === 1}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove unit</span>
            </Button>
          </div>
          {errors.units?.[index] && <p className="text-sm text-destructive">{errors.units[index]?.message}</p>}
        </div>
      ))}

      <Button type="button" onClick={handleAddUnit} variant="outline" className="w-full" disabled={units.length >= 3}>
        <Plus className="w-5 h-5 mr-2" />
        Add Unit ({3 - units.length} remaining)
      </Button>
    </div>
  )
}
