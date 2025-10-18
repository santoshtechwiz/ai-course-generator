import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full border-4 border-primary bg-background px-3 py-2 text-base font-medium shadow-[4px_4px_0px_0px_hsl(var(--primary))] transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-[4px_4px_0px_0px_hsl(var(--accent))] focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:shadow-[6px_6px_0px_0px_hsl(var(--primary))]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
