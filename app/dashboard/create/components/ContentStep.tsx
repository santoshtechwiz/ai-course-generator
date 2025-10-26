"use client"

import { type Control, Controller, type FieldErrors, type UseFormSetValue, type UseFormWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, AlertCircle } from "lucide-react"

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
          <div className="flex items-start gap-3">
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
                    className="transition-all duration-200 border-4 border-border focus:ring-2 focus:ring-ring focus:border-ring"
                    {...field}
                    spellCheck="true"
                    aria-invalid={!!errors.units?.[index]}
                    aria-describedby={errors.units?.[index] ? `unit-${index}-error` : undefined}
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
              className="shrink-0 mt-8 border-4 border-border"
              aria-label={`Remove unit ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {errors.units?.[index] && (
            <div
              id={`unit-${index}-error`}
              className="flex items-center gap-2 p-2 bg-destructive/10 rounded border border-destructive/30"
            >
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{errors.units[index]?.message}</p>
            </div>
          )}
        </div>
      ))}

      <Button
        type="button"
        onClick={handleAddUnit}
        className="w-full bg-accent text-background border-4 border-border shadow-neo font-black uppercase"
        disabled={units.length >= 3}
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Unit ({3 - units.length} remaining)
      </Button>
    </div>
  )
}
