"use client"

import type React from "react"
import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { type PlanType } from "../../../../hooks/useQuizPlan"

interface CustomButtonStates {
  default?: {
    label?: string
    tooltip?: string
  }
  notEnabled?: {
    label?: string
    tooltip?: string
  }
  noCredits?: {
    label?: string
    tooltip?: string
  }
  notLoggedIn?: {
    label?: string
    tooltip?: string
  }
  insufficientPlan?: {
    label?: string
    tooltip?: string
  }
}

interface PlanAwareButtonProps extends Omit<ButtonProps, "onClick"> {
  label: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  isLoggedIn: boolean
  isLoading?: boolean
  isEnabled?: boolean
  hasCredits?: boolean
  loadingLabel?: string
  requiredPlan?: PlanType
  currentPlan?: PlanType
  fallbackHref?: string
  onPlanRequired?: () => void
  onInsufficientCredits?: () => void
  customStates?: CustomButtonStates
}

export default function PlanAwareButton({
  label,
  onClick,
  isLoggedIn,
  isLoading = false,
  isEnabled = true,
  hasCredits = true,
  loadingLabel = "Processing...",
  requiredPlan = "FREE",
  currentPlan = "FREE",
  fallbackHref = "/dashboard/subscription",
  onPlanRequired,
  onInsufficientCredits,
  customStates,
  className = "",
  ...buttonProps
}: PlanAwareButtonProps) {
  const [isLoadingState, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Check if the user's plan meets requirements
  const meetsRequirement = (): boolean => {
    // Plan hierarchy for comparison
    const planHierarchy: Record<PlanType, number> = {
      FREE: 0,
      BASIC: 1,
      PRO: 2,
      ULTIMATE: 3,
    }

    // Check if current plan is sufficient
    return planHierarchy[currentPlan] >= planHierarchy[requiredPlan]
  }

  // Extract the button states based on conditions
  const getButtonState = () => {
    if (isLoading || isLoadingState) {
      return {
        label: loadingLabel,
        tooltip: "Please wait while we process your request",
        disabled: true,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
        },
      }
    }

    if (!isLoggedIn) {
      const notLoggedInState = customStates?.notLoggedIn ?? {}
      return {
        label: notLoggedInState.label ?? "Sign in to continue",
        tooltip: notLoggedInState.tooltip ?? "You need to be signed in to use this feature",
        disabled: false,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
          router.push("/api/auth/signin?callbackUrl=/dashboard")
        },
      }
    }

    if (!isEnabled) {
      const notEnabledState = customStates?.notEnabled ?? {}
      return {
        label: notEnabledState.label ?? "Not available",
        tooltip: notEnabledState.tooltip ?? "This option is not available right now",
        disabled: true,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
        },
      }
    }

    if (!hasCredits) {
      const noCreditsState = customStates?.noCredits ?? {}
      return {
        label: noCreditsState.label ?? "Get more credits",
        tooltip: noCreditsState.tooltip ?? "You need more credits to use this feature",
        disabled: false,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (onInsufficientCredits) {
            onInsufficientCredits()
          } else {
            router.push("/dashboard/subscription")
          }
        },
      }
    }
    
    if (!meetsRequirement()) {
      const insufficientPlanState = customStates?.insufficientPlan ?? {}
      return {
        label: insufficientPlanState.label ?? "Upgrade plan",
        tooltip: insufficientPlanState.tooltip ?? `This feature requires the ${requiredPlan} plan or higher`,
        disabled: false,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (onPlanRequired) {
            onPlanRequired()
          } else {
            toast({
              title: "Plan Upgrade Required",
              description: `This feature requires the ${requiredPlan} plan or higher`,
              variant: "destructive",
            })
            router.push(fallbackHref)
          }
        },
      }
    }

    // Default state when everything is OK
    const defaultState = customStates?.default ?? {}
    return {
      label: defaultState.label ?? label,
      tooltip: defaultState.tooltip ?? "Click to proceed",
      disabled: false,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        if (onClick) onClick(e)
      },
    }
  }

  const state = getButtonState()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={state.onClick}
            disabled={state.disabled}
            className={cn(
              "relative min-w-[120px] transition-all duration-200",
              (isLoading || isLoadingState) && "opacity-80 cursor-not-allowed",
              className
            )}
            {...buttonProps}
          >
            {(isLoading || isLoadingState) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {state.label}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{state.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
