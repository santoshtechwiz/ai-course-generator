"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, onValueChange, value, ...props }, ref) => {
  // Handle value changes in a stable way to prevent infinite update loops
  const handleValueChange = React.useCallback((newValue: string) => {
    if (typeof onValueChange === 'function' && newValue !== value) {
      onValueChange(newValue)
    }
  }, [onValueChange, value])
  
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      onValueChange={handleValueChange}
      value={value}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  // Using React.useMemo to prevent unnecessary re-renders and stabilize props
  const stableProps = React.useMemo(
    () => ({
      className: cn(
        "aspect-square h-5 w-5 rounded-sm border-2 border-border bg-background shadow-[2px_2px_0px_0px_var(--border)] text-main ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-main data-[state=checked]:text-main-foreground transition-none",
        className
      ),
      ...props
    }),
    [className, props]
  )
  
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      {...stableProps}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-3 w-3 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
      {children}
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
