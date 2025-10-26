"use client"

import { type Control, Controller, type FieldErrors, type UseFormSetValue, type UseFormWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, GripVertical } from "lucide-react"

import type { CreateCourseInput } from "@/schema/schema"
import { useToast } from "@/hooks"
import { cn } from "@/lib/utils"

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
    if (units.length === 1) {
      toast({
        title: "Cannot Remove",
        description: "You must have at least one unit.",
        variant: "destructive",
      })
      return
    }
    setValue(
      "units",
      units.filter((_, i) => i !== index),
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-3 pb-4 border-b-3 border-border">
        <h3 className="text-xl font-black text-foreground">Course Units</h3>
        <p className="text-sm font-medium text-muted-foreground">
          Add up to 3 units to organize your course content. Each unit will contain multiple chapters.
        </p>
      </div>

      <div className="space-y-4">
        {units.map((unit, index) => (
          <div 
            key={index} 
            className={cn(
              "group relative p-4 border-3 border-border rounded-none shadow-neo bg-card transition-all",
              "hover:shadow-neo-hover hover:translate-x-0.5 hover:translate-y-0.5"
            )}
          >
            {/* Drag Handle Visual (decorative) */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-muted/30 border-r-3 border-border flex items-center justify-center">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="pl-10 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`unit-${index}`} className="text-base font-black text-foreground flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-none bg-primary text-background text-sm border-2 border-border">
                      {index + 1}
                    </span>
                    Unit {index + 1}
                  </Label>
                  <Controller
                    name={`units.${index}`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        id={`unit-${index}`}
                        placeholder="Enter unit title (e.g., 'Introduction to React')"
                        className="border-3 border-border rounded-none font-medium focus:border-primary focus:ring-0 transition-all h-11 text-base shadow-neo"
                        {...field}
                        spellCheck="true"
                      />
                    )}
                  />
                  {errors.units?.[index] && (
                    <p className="text-sm font-bold text-danger flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-danger"></span>
                      {errors.units[index]?.message}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveUnit(index)}
                  disabled={units.length === 1}
                  className={cn(
                    "shrink-0 w-11 h-11 border-3 rounded-none font-black transition-all",
                    units.length === 1 
                      ? "border-border/50 text-muted-foreground cursor-not-allowed" 
                      : "border-danger text-danger hover:bg-danger hover:text-background shadow-neo hover:shadow-neo-hover"
                  )}
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Remove unit</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button 
        type="button" 
        onClick={handleAddUnit} 
        variant="outline" 
        className={cn(
          "w-full h-12 font-black border-3 rounded-none transition-all",
          units.length >= 3 
            ? "border-border/50 text-muted-foreground cursor-not-allowed" 
            : "border-primary text-primary hover:bg-primary hover:text-background shadow-neo hover:shadow-neo-hover"
        )}
        disabled={units.length >= 3}
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Unit ({3 - units.length} remaining)
      </Button>

      {/* Helper card */}
      <div className="mt-6 p-4 border-3 border-success/30 bg-success/5 rounded-none">
        <h4 className="font-black text-sm text-foreground mb-2">📚 Unit Organization Tips</h4>
        <ul className="space-y-1 text-xs font-medium text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success mt-1 flex-shrink-0"></span>
            <span>Structure units progressively from basics to advanced topics</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success mt-1 flex-shrink-0"></span>
            <span>Each unit should focus on a specific theme or learning objective</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success mt-1 flex-shrink-0"></span>
            <span>Use clear, descriptive names that indicate what students will learn</span>
          </li>
        </ul>
      </div>
    </div>
  )
}