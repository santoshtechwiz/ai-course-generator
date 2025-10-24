import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius)] text-sm font-base ring-offset-white transition-all gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--color-border)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--color-border)]",
        outline:
          "bg-[var(--color-bg)] text-[var(--color-text)] border-4 border-[var(--color-border)] hover:bg-[var(--color-muted)]",
        ghost:
          "bg-transparent text-[var(--color-text)] border-0 hover:bg-[var(--color-muted)] shadow-none",
        noShadow: "bg-[var(--color-primary)] text-white border-4 border-[var(--color-border)] shadow-none",
        neutral:
          "bg-[var(--color-muted)] text-[var(--color-text)] border-4 border-[var(--color-border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--color-border)]",
        reverse:
          "bg-[var(--color-accent)] text-white border-4 border-[var(--color-border)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--shadow-neo-lg)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "size-10",
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
