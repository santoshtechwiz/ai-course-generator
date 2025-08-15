"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-border/50 hover:border-primary/30",
        elevated: "border-border/50 hover:border-primary/30 shadow-lg hover:shadow-xl hover:-translate-y-1",
        glass: "border-white/20 bg-background/80 backdrop-blur-md",
        gradient: "border-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5",
        outline: "border-2 border-primary/20 hover:border-primary/40",
        ghost: "border-0 shadow-none hover:shadow-sm",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      animation: {
        none: "",
        fadeIn: "animate-fade-in",
        slideUp: "animate-slide-up",
        scaleIn: "animate-scale-in",
        bounceIn: "animate-bounce-in",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

const cardHeaderVariants = cva("flex flex-col space-y-1.5", {
  variants: {
    alignment: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    spacing: {
      tight: "mb-2",
      default: "mb-4",
      loose: "mb-6",
    },
  },
  defaultVariants: {
    alignment: "left",
    spacing: "default",
  },
})

const cardTitleVariants = cva("text-2xl font-bold leading-none tracking-tight", {
  variants: {
    variant: {
      default: "text-foreground",
      gradient: "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent",
      muted: "text-muted-foreground",
    },
    size: {
      sm: "text-lg",
      default: "text-xl",
      lg: "text-2xl",
      xl: "text-3xl",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

const cardDescriptionVariants = cva("text-sm text-muted-foreground", {
  variants: {
    size: {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export interface EnhancedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode
  interactive?: boolean
  hoverEffect?: "none" | "lift" | "glow" | "scale"
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    interactive = false,
    hoverEffect = "none",
    children,
    ...props 
  }, ref) => {
    const cardClasses = cn(cardVariants({ variant, size, animation, className }))
    
    if (!interactive) {
      return (
        <div className={cardClasses} ref={ref} {...props}>
          {children}
        </div>
      )
    }

    const hoverVariants = {
      none: {},
      lift: {
        hover: { y: -8, transition: { duration: 0.3 } },
        tap: { y: -4, transition: { duration: 0.1 } }
      },
      glow: {
        hover: { 
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          transition: { duration: 0.3 }
        }
      },
      scale: {
        hover: { scale: 1.02, transition: { duration: 0.2 } },
        tap: { scale: 0.98, transition: { duration: 0.1 } }
      }
    }

    return (
      <motion.div
        className={cn(cardClasses, "cursor-pointer")}
        ref={ref}
        variants={hoverVariants[hoverEffect]}
        whileHover="hover"
        whileTap="tap"
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

EnhancedCard.displayName = "EnhancedCard"

const EnhancedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardHeaderVariants>
>(({ className, alignment, spacing, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardHeaderVariants({ alignment, spacing, className }))}
    {...props}
  />
))
EnhancedCardHeader.displayName = "EnhancedCardHeader"

const EnhancedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & VariantProps<typeof cardTitleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(cardTitleVariants({ variant, size, className }))}
    {...props}
  />
))
EnhancedCardTitle.displayName = "EnhancedCardTitle"

const EnhancedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & VariantProps<typeof cardDescriptionVariants>
>(({ className, size, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(cardDescriptionVariants({ size, className }))}
    {...props}
  />
))
EnhancedCardDescription.displayName = "EnhancedCardDescription"

const EnhancedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
))
EnhancedCardContent.displayName = "EnhancedCardContent"

const EnhancedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-6", className)}
    {...props}
  />
))
EnhancedCardFooter.displayName = "EnhancedCardFooter"

export { 
  EnhancedCard, 
  EnhancedCardHeader, 
  EnhancedCardFooter, 
  EnhancedCardTitle, 
  EnhancedCardDescription, 
  EnhancedCardContent,
  cardVariants,
  cardHeaderVariants,
  cardTitleVariants,
  cardDescriptionVariants
}