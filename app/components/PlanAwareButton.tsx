"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Lock, CheckCircle, User, Loader2, CreditCard } from "lucide-react"
import useSubscriptionStore from "@/store/useSubscriptionStore"


export interface PlanAwareButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void
  isLoggedIn?: boolean
  isEnabled?: boolean
  hasCredits?: boolean
  loadingLabel?: string
  disableInternalCreditCheck?: boolean
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
  hasCredits,
  loadingLabel = "Processing...",
  disableInternalCreditCheck = false,
  customStates = {},
  className = "",
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const { subscriptionStatus } = useSubscriptionStore()

  const currentState = useMemo(() => {
    if (isLoading) return { ...defaultStates.loading, ...customStates.loading }
    if (isLoggedIn === false) return { ...defaultStates.notLoggedIn, ...customStates.notLoggedIn }
    if (!disableInternalCreditCheck && subscriptionStatus && subscriptionStatus.credits <= 0) {
      return { ...defaultStates.noCredits, ...customStates.noCredits }
    }
    if (hasCredits === false) return { ...defaultStates.noCredits, ...customStates.noCredits }
    if (!isEnabled) return { ...defaultStates.notEnabled, ...customStates.notEnabled }
    return { ...defaultStates.default, ...customStates.default, label }
  }, [
    isLoading,
    isLoggedIn,
    hasCredits,
    isEnabled,
    label,
    customStates,
    subscriptionStatus,
    disableInternalCreditCheck,
  ])

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (isLoading || isLoggedIn === false || !isEnabled || hasCredits === false || !onClick) return
    if (!disableInternalCreditCheck && subscriptionStatus && subscriptionStatus.credits <= 0) return

    setIsLoading(true)
    try {
      await onClick(e)
    } catch (error) {
      console.error("Error in PlanAwareButton handleClick:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled: boolean =
    isLoading ||
    isLoggedIn === false ||
    !isEnabled ||
    hasCredits === false ||
    (!disableInternalCreditCheck && subscriptionStatus && subscriptionStatus.credits <= 0) || false

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={`w-full justify-center py-2 px-4 text-sm sm:text-base md:text-lg lg:py-3 lg:px-6 ${className}`}
            onClick={handleClick}
            variant={currentState.variant}
            disabled={isDisabled}
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

export default PlanAwareButton

