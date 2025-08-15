"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-xl border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      size: {
        sm: "h-9 px-3 py-2 text-sm",
        default: "h-11 px-4 py-3 text-base",
        lg: "h-12 px-4 py-3 text-lg",
        xl: "h-14 px-6 py-4 text-xl",
      },
      variant: {
        default: "border-border/50 focus:border-primary/50 focus:shadow-lg focus:shadow-primary/10",
        outline: "border-2 border-primary/20 focus:border-primary/50 focus:shadow-lg focus:shadow-primary/10",
        filled: "border-0 bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/50",
        ghost: "border-0 bg-transparent focus:ring-2 focus:ring-primary/50",
      },
      state: {
        default: "",
        error: "border-destructive focus:border-destructive focus:ring-destructive",
        success: "border-success focus:border-success focus:ring-success",
        warning: "border-warning focus:border-warning focus:ring-warning",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
      state: "default",
    },
  }
)

export interface EnhancedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  success?: string
  warning?: string
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  helperText?: string
  required?: boolean
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    className, 
    size, 
    variant,
    state,
    label,
    error,
    success,
    warning,
    icon,
    iconPosition = "left",
    helperText,
    required,
    id,
    ...props 
  }, ref) => {
    const inputId = id || React.useId()
    const hasError = !!error
    const hasSuccess = !!success
    const hasWarning = !!warning
    
    // Determine the state based on props
    const inputState = hasError ? "error" : hasSuccess ? "success" : hasWarning ? "warning" : state || "default"
    
    // Determine helper text
    const displayHelperText = error || success || warning || helperText
    const helperTextColor = hasError ? "text-destructive" : hasSuccess ? "text-success" : hasWarning ? "text-warning" : "text-muted-foreground"

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium text-foreground flex items-center gap-1"
          >
            {label}
            {required && <span className="text-destructive">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === "left" && (
            <motion.div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>
          )}
          
          <motion.input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ size, variant, state: inputState, className }),
              icon && iconPosition === "left" && "pl-10",
              icon && iconPosition === "right" && "pr-10"
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileFocus={{ scale: 1.01 }}
            {...props}
          />
          
          {icon && iconPosition === "right" && (
            <motion.div
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>
          )}
          
          {/* Focus ring animation */}
          <motion.div
            className="absolute inset-0 rounded-xl ring-2 ring-primary/20 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            whileFocus={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          />
        </div>
        
        {displayHelperText && (
          <motion.p
            className={cn("text-sm", helperTextColor)}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {displayHelperText}
          </motion.p>
        )}
      </div>
    )
  }
)

EnhancedInput.displayName = "EnhancedInput"

export { EnhancedInput, inputVariants }