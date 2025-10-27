import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-black uppercase tracking-wider border-4 border-border neo-shadow neo-hover-lift neo-press focus-ring gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "text-background bg-primary border-border",
        primary:
          "text-background bg-primary border-border",
        secondary:
          "text-background bg-secondary border-border",
        accent:
          "text-background bg-accent border-border",
        outline:
          "text-foreground bg-transparent border-border hover:bg-muted",
        ghost:
          "text-foreground bg-transparent border-transparent hover:bg-muted",
        neutral:
          "text-foreground bg-surface border-border",
        reverse:
          "text-background bg-primary border-border hover:translate-x-reverseBoxShadowX hover:translate-y-reverseBoxShadowY hover:shadow-shadow",
        noShadow: "text-background bg-primary border-border shadow-none",
      },
      size: {
        default: "h-11 px-6 py-3 min-h-[44px]",
        sm: "h-9 px-4 min-h-[36px]",
        lg: "h-12 px-8 min-h-[48px]",
        icon: "size-11 min-h-[44px]",
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