import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "neo-badge w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary overflow-hidden",
  {
    variants: {
      variant: {
        default: "neo-badge-primary",
        primary: "neo-badge-primary",
        secondary: "bg-card text-foreground",
        accent: "bg-accent text-foreground",
        success: "neo-badge-success",
        warning: "neo-badge-warning",
        error: "neo-badge-error",
        neutral: "bg-muted text-foreground",
        outline: "bg-background text-foreground border-2",
      },
      size: {
        default: "px-3 py-1 text-sm",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-4 py-2 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge,  }
