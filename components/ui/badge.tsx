import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border-2 border-border px-2.5 py-0.5 text-xs font-black transition-none focus:outline-none focus:ring-2 focus:ring-ring rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]",
  {
    variants: {
      variant: {
        default:
          "bg-main text-main-foreground border-border",
        secondary:
          "bg-secondary-background text-foreground border-border",
        destructive:
          "bg-destructive text-destructive-foreground border-border",
        success:
          "bg-success text-success-foreground border-border",
        outline: "text-foreground bg-background border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
