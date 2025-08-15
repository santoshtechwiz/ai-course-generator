"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
        success: "border-transparent bg-success text-white hover:bg-success/80",
        warning: "border-transparent bg-warning text-white hover:bg-warning/80",
        info: "border-transparent bg-info text-white hover:bg-info/80",
        gradient: "border-transparent bg-gradient-to-r from-primary to-secondary text-white",
        glass: "border-white/20 bg-white/10 backdrop-blur-sm text-white",
        premium: "border-transparent bg-gradient-to-r from-yellow-400 to-orange-500 text-white",
        new: "border-transparent bg-gradient-to-r from-green-400 to-blue-500 text-white",
        featured: "border-transparent bg-gradient-to-r from-purple-400 to-pink-500 text-white",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
        xl: "px-4 py-1.5 text-base",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        spin: "animate-spin",
        ping: "animate-ping",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

export interface EnhancedBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  interactive?: boolean
  href?: string
}

const EnhancedBadge = React.forwardRef<HTMLDivElement, EnhancedBadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    icon,
    iconPosition = "left",
    interactive = false,
    href,
    children,
    ...props 
  }, ref) => {
    const badgeClasses = cn(badgeVariants({ variant, size, animation, className }))
    
    const badgeContent = (
      <>
        {icon && iconPosition === "left" && (
          <motion.span
            className="mr-1.5"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {icon}
          </motion.span>
        )}
        
        <span>{children}</span>
        
        {icon && iconPosition === "right" && (
          <motion.span
            className="ml-1.5"
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {icon}
          </motion.span>
        )}
      </>
    )

    if (href) {
      return (
        <motion.a
          href={href}
          className={cn(badgeClasses, "cursor-pointer")}
          ref={ref}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          {...props}
        >
          {badgeContent}
        </motion.a>
      )
    }

    if (!interactive) {
      return (
        <div className={badgeClasses} ref={ref} {...props}>
          {badgeContent}
        </div>
      )
    }

    return (
      <motion.div
        className={cn(badgeClasses, "cursor-pointer")}
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        {badgeContent}
      </motion.div>
    )
  }
)

EnhancedBadge.displayName = "EnhancedBadge"

// Specialized badge components for common use cases
export const StatusBadge: React.FC<{
  status: "success" | "warning" | "error" | "info" | "default"
  children: React.ReactNode
  className?: string
}> = ({ status, children, className }) => {
  const variantMap = {
    success: "success" as const,
    warning: "warning" as const,
    error: "destructive" as const,
    info: "info" as const,
    default: "secondary" as const,
  }

  return (
    <EnhancedBadge variant={variantMap[status]} className={className}>
      {children}
    </EnhancedBadge>
  )
}

export const FeatureBadge: React.FC<{
  feature: "new" | "premium" | "featured" | "beta"
  children: React.ReactNode
  className?: string
}> = ({ feature, children, className }) => {
  const variantMap = {
    new: "new" as const,
    premium: "premium" as const,
    featured: "featured" as const,
    beta: "info" as const,
  }

  return (
    <EnhancedBadge variant={variantMap[feature]} className={className}>
      {children}
    </EnhancedBadge>
  )
}

export { EnhancedBadge, badgeVariants }