import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius)] text-sm font-black ring-offset-background transition-all duration-150 gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 border-4 border-[var(--color-border)] shadow-neo",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none",
        secondary:
          "bg-card text-foreground hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg hover:bg-muted active:translate-x-1 active:translate-y-1 active:shadow-none",
        accent:
          "bg-accent text-foreground hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none",
        outline:
          "bg-background text-foreground border-4 border-border hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg hover:bg-muted active:translate-x-1 active:translate-y-1 active:shadow-none",
        ghost:
          "bg-transparent text-foreground border-0 hover:bg-muted shadow-none hover:shadow-neo-sm",
        destructive:
          "bg-error text-white hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none",
        success:
          "bg-success text-white hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none",
        // Legacy variants for backward compatibility
        neutral: "bg-muted text-foreground hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none",
        reverse: "bg-accent text-foreground hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none",
        noShadow: "bg-primary text-white border-4 border-border shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }
