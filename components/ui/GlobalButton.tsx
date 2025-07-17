"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { useGlobalLoader } from '@/store/global-loader'
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-600 text-white hover:bg-green-700",
        warning: "bg-orange-600 text-white hover:bg-orange-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      state: {
        idle: "",
        loading: "cursor-wait",
        success: "bg-green-600 hover:bg-green-600",
        error: "bg-red-600 hover:bg-red-600",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "idle",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
  state?: "idle" | "loading" | "success" | "error"
  successText?: string
  errorText?: string
  showStateIcon?: boolean
  resetStateAfter?: number // milliseconds to auto-reset state
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    isLoading,
    loadingText,
    state: externalState,
    successText,
    errorText,
    showStateIcon = true,
    resetStateAfter = 2000,
    children,
    disabled,
    onClick,
    ...props 
  }, ref) => {
    const [internalState, setInternalState] = React.useState<"idle" | "loading" | "success" | "error">("idle")
    const timeoutRef = React.useRef<NodeJS.Timeout>()
    
    // Use external state if provided, otherwise use internal state
    const currentState = externalState || (isLoading ? "loading" : internalState)
    
    React.useEffect(() => {
      if (currentState === "success" || currentState === "error") {
        timeoutRef.current = setTimeout(() => {
          if (!externalState) {
            setInternalState("idle")
          }
        }, resetStateAfter)
      }
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [currentState, resetStateAfter, externalState])
    
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (currentState === "loading" || disabled) {
          e.preventDefault()
          return
        }
        
        if (!externalState) {
          setInternalState("loading")
        }
          if (onClick) {
          // Create a promise wrapper to handle state transitions
          try {
            const result = onClick(e) as any
            
            // If onClick returns a promise, handle success/error states
            if (result && typeof result === 'object' && typeof result.then === 'function') {
              (result as Promise<any>)
                .then(() => {
                  if (!externalState) {
                    setInternalState("success")
                  }
                })
                .catch(() => {
                  if (!externalState) {
                    setInternalState("error")
                  }
                })
            } else {
              // If not a promise, assume success after a short delay
              if (!externalState) {
                setTimeout(() => setInternalState("success"), 100)
              }
            }
          } catch (error) {
            if (!externalState) {
              setInternalState("error")
            }
          }
        }
      },
      [onClick, currentState, disabled, externalState]
    )
    
    const getButtonContent = () => {
      switch (currentState) {
        case "loading":
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {loadingText || ""}
            </motion.div>
          )
        case "success":
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              {showStateIcon && <CheckCircle2 className="w-4 h-4" />}
              {successText || "Success!"}
            </motion.div>
          )
        case "error":
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              {showStateIcon && <XCircle className="w-4 h-4" />}
              {errorText || "Error"}
            </motion.div>
          )
        default:
          return children
      }
    }
    
    // Add background animation for state changes
    const getBackgroundAnimation = () => {
      if (currentState === "success") {
        return (
          <motion.div
            className="absolute inset-0 bg-green-600"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )
      }
      
      if (currentState === "error") {
        return (
          <motion.div
            className="absolute inset-0 bg-red-600"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )
      }
      
      return null
    }
    
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, state: currentState, className }))}
        ref={ref}
        disabled={disabled || currentState === "loading"}
        onClick={handleClick}
        {...props}
      >
        <AnimatePresence mode="wait">
          {getBackgroundAnimation()}
        </AnimatePresence>
        <span className="relative z-10">
          <AnimatePresence mode="wait">
            {getButtonContent()}
          </AnimatePresence>
        </span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
