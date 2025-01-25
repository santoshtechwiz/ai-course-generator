"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Lock, CheckCircle, User, Loader2, CreditCard } from "lucide-react"

export interface PlanAwareButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void
  isLoggedIn: boolean
  isEnabled?: boolean
  hasCredits?: boolean
  loadingLabel?: string
  customStates?: {
    default?: Partial<ButtonState>
    loading?: Partial<ButtonState>
    notLoggedIn?: Partial<ButtonState>
    noCredits?: Partial<ButtonState>
    notEnabled?: Partial<ButtonState>
  }
}

interface ButtonState {
  label: string
  icon: React.ReactNode
  variant: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"
  tooltip: string
}

const defaultStates: Record<string, ButtonState> = {
  default: {
    label: "Create",
    icon: <CheckCircle className="h-4 w-4 mr-2" />,
    variant: "default",
    tooltip: "Ready to go!",
  },
  loading: {
    label: "Processing...",
    icon: <Loader2 className="h-4 w-4 animate-spin mr-2" />,
    variant: "outline",
    tooltip: "Action in progress, please wait.",
  },
  notLoggedIn: {
    label: "Sign in to create",
    icon: <User className="h-4 w-4 mr-2" />,
    variant: "secondary",
    tooltip: "You must sign in to create or use this feature.",
  },
  noCredits: {
    label: "Subscribe or buy more",
    icon: <CreditCard className="h-4 w-4 mr-2" />,
    variant: "destructive",
    tooltip: "You've used up all your credits. Upgrade or buy more to continue.",
  },
  notEnabled: {
    label: "Upgrade to unlock",
    icon: <Lock className="h-4 w-4 mr-2" />,
    variant: "outline",
    tooltip: "This feature is not available on your current plan. Please upgrade.",
  },
}

export const PlanAwareButton: React.FC<PlanAwareButtonProps> = ({
  label,
  onClick,
  isLoggedIn,
  isEnabled = true,
  hasCredits = true,
  loadingLabel = "Processing...",
  customStates = {},
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false)

  const currentState = useMemo(() => {
    if (isLoading) return { ...defaultStates.loading, ...customStates.loading }
    if (!isLoggedIn) return { ...defaultStates.notLoggedIn, ...customStates.notLoggedIn }
    if (!hasCredits) return { ...defaultStates.noCredits, ...customStates.noCredits }
    if (!isEnabled) return { ...defaultStates.notEnabled, ...customStates.notEnabled }
    return { ...defaultStates.default, ...customStates.default, label }
  }, [isLoading, isLoggedIn, hasCredits, isEnabled, label, customStates])

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (isLoading || !isLoggedIn || !isEnabled || !hasCredits || !onClick) return

    setIsLoading(true)
    try {
      await onClick(e)
    } catch (error) {
      console.error("Error in PlanAwareButton handleClick:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            variant={currentState.variant}
            disabled={isLoading || !isLoggedIn || !isEnabled || !hasCredits}
            {...props}
          >
            {currentState.icon}
            {isLoading ? loadingLabel : currentState.label}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{currentState.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

PlanAwareButton.displayName = "PlanAwareButton"

