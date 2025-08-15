"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl hover:shadow-primary/25",
        destructive: "bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground hover:from-destructive/90 hover:to-destructive/80 shadow-lg hover:shadow-xl hover:shadow-destructive/25",
        outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md transition-all duration-200",
        secondary: "bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/80 shadow-lg hover:shadow-xl hover:shadow-secondary/25",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        accent: "bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:from-accent/90 hover:to-accent/80 shadow-lg hover:shadow-xl hover:shadow-accent/25",
        success: "bg-gradient-to-r from-success to-success/90 text-white hover:from-success/90 hover:to-success/80 shadow-lg hover:shadow-xl hover:shadow-success/25",
        warning: "bg-gradient-to-r from-warning to-warning/90 text-white hover:from-warning/90 hover:to-warning/80 shadow-lg hover:shadow-xl hover:shadow-warning/25",
        info: "bg-gradient-to-r from-info to-info/90 text-white hover:from-info/90 hover:to-info/80 shadow-lg hover:shadow-xl hover:shadow-info/25",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8 py-3 text-base",
        xl: "h-14 rounded-xl px-10 py-4 text-lg",
        icon: "h-10 w-10",
      },
      animation: {
        none: "",
        scale: "hover:scale-105 active:scale-95",
        lift: "hover:-translate-y-1 hover:shadow-xl",
        glow: "hover:shadow-lg hover:shadow-primary/25",
        bounce: "hover:animate-bounce",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "scale",
    },
  }
)

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  children: React.ReactNode
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    asChild = false, 
    loading = false,
    icon,
    iconPosition = "left",
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading

    const buttonContent = (
      <>
        {loading && (
          <motion.div
            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
        
        {icon && iconPosition === "left" && !loading && (
          <motion.span
            className="mr-2"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {icon}
          </motion.span>
        )}
        
        <motion.span
          initial={{ opacity: loading ? 0.5 : 1 }}
          animate={{ opacity: loading ? 0.5 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.span>
        
        {icon && iconPosition === "right" && !loading && (
          <motion.span
            className="ml-2"
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {icon}
          </motion.span>
        )}
      </>
    )

    if (animation === "none") {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, animation, className }))}
          ref={ref}
          disabled={isDisabled}
          {...props}
        >
          {buttonContent}
        </Comp>
      )
    }

    return (
      <motion.div
        whileHover={!isDisabled ? { scale: 1.05 } : {}}
        whileTap={!isDisabled ? { scale: 0.95 } : {}}
        transition={{ duration: 0.2 }}
      >
        <Comp
          className={cn(buttonVariants({ variant, size, animation, className }))}
          ref={ref}
          disabled={isDisabled}
          {...props}
        >
          {buttonContent}
        </Comp>
      </motion.div>
    )
  }
)

EnhancedButton.displayName = "EnhancedButton"

export { EnhancedButton, buttonVariants }