"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-none border-3 border-[hsl(var(--border))] transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-[hsl(var(--success))] data-[state=unchecked]:bg-[hsl(var(--muted))]",
      "shadow-neo hover:shadow-neo-hover",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-none border-2 border-[hsl(var(--border))]",
        "bg-[hsl(var(--background))] shadow-[2px_2px_0_hsl(var(--foreground)/.2)]",
        "transition-transform duration-200 ease-out",
        "data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0",
        "data-[state=checked]:bg-[hsl(var(--background))] data-[state=unchecked]:bg-[hsl(var(--foreground))]/20"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
