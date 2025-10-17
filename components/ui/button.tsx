import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-base font-semibold border-2 border-border transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-main text-main-foreground shadow-[var(--shadow)] hover:translate-x-[3px] hover:translate-y-[-3px] hover:shadow-none active:translate-x-[4px] active:translate-y-[-4px]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--shadow)] hover:translate-x-[3px] hover:translate-y-[-3px] hover:shadow-none",
        outline:
          "bg-background hover:bg-secondary-background",
        secondary:
          "bg-secondary-background hover:bg-main/10",
        ghost: "border-transparent hover:border-border hover:bg-secondary-background",
        link: "text-main underline-offset-4 hover:underline border-transparent",
      },
      size: {
        default: "h-12 px-4 py-2",
        sm: "h-11 px-3",
        lg: "h-12 px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
