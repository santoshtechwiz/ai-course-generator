"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface SliderProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "defaultValue"> {
  defaultValue?: number[]
  value?: number[]
  onValueChange?: (value: number[]) => void
  max?: number
  min?: number
  step?: number
}

const Slider = React.forwardRef<HTMLSpanElement, SliderProps>(
  ({ className, defaultValue, value, onValueChange, max = 100, min = 0, step = 1, ...props }, ref) => {
    const [val, setVal] = React.useState(value || defaultValue || [0])

    React.useEffect(() => {
      if (value !== undefined) {
        setVal(value)
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number.parseFloat(e.target.value)
      if (isNaN(newValue)) return

      const clampedValue = Math.max(min, Math.min(max, newValue))
      setVal([clampedValue])
      onValueChange?.([clampedValue])
    }

    return (
      <div className="relative flex items-center">
        <input
          type="range"
          className={cn(
            "peer h-2 w-full appearance-none rounded-lg bg-primary/20 outline-none dark:bg-primary/80",
            className,
          )}
          defaultValue={defaultValue?.[0]}
          value={val[0]}
          onChange={handleChange}
          max={max}
          min={min}
          step={step}
          {...props}
        />
        <span className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-primary/20 dark:bg-primary/80">
          <span
            className="absolute h-0.5 bg-primary dark:bg-primary"
            style={{
              left: `${(min / max) * 100}%`,
              right: `${100 - (val[0] / max) * 100}%`,
            }}
          />
        </span>
        <output
          className="absolute left-1/2 top-full mt-2 w-10 -translate-x-1/2 text-center text-sm text-muted-foreground peer-focus:text-primary"
          htmlFor="range"
        >
          {val[0]}
        </output>
      </div>
    )
  },
)
Slider.displayName = "Slider"

export { Slider }
