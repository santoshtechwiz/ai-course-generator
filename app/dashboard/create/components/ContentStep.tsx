'use client';
import { Control, Controller, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { CreateCourseInput } from "./schema"

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
    setValue("units", units.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {units.map((unit, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex-1">
            <Controller
              name={`units.${index}`}
              control={control}
              render={({ field }) => (
                <Input
                  id={`unit-${index}`}
                  placeholder="Enter unit title"
                  className="h-12 text-lg"
                  {...field}
                  spellCheck="true"
                />
              )}
            />
            {errors.units?.[index] && (
              <p className="text-sm text-destructive mt-1">{errors.units[index]?.message}</p>
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => handleRemoveUnit(index)}
            disabled={units.length === 1}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        onClick={handleAddUnit}
        variant="outline"
        className="w-full h-12"
        disabled={units.length >= 3}
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Unit ({3 - units.length} remaining)
      </Button>
    </div>
  )
}

