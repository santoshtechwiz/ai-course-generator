"use client"

import type React from "react"
import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { useToast } from "@/hooks"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Loader2, Check, Lock, AlertCircle } from "lucide-react"
import { type PlanType } from "../../../../hooks/useQuizPlan"
// ✅ UNIFIED: Using unified auth system
import { useAuth, useSubscription } from "@/modules/auth"
import { calculateCreditInfo, getCreditMessage } from "@/utils/credit-utils"

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
  alreadySubscribed?: {
    label?: string
    tooltip?: string
  }
}

interface PlanAwareButtonProps extends Omit<ButtonProps, "onClick"> {
  label: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  isLoggedIn?: boolean // Optional - will be auto-detected if not provided
  isLoading?: boolean
  isEnabled?: boolean
  hasCredits?: boolean // This will be auto-calculated if not provided
  creditsRequired?: number // Number of credits required for this action
  loadingLabel?: string
  requiredPlan?: PlanType
  currentPlan?: PlanType
  fallbackHref?: string
  onPlanRequired?: () => void
  onInsufficientCredits?: () => void
  customStates?: CustomButtonStates
  showIcon?: boolean
}

export default function PlanAwareButton({
  label,
  onClick,
  isLoggedIn, // Will be auto-detected if not provided
  isLoading = false,
  isEnabled = true,
  hasCredits, // Will be auto-calculated if not provided
  creditsRequired = 1, // Default to 1 credit required
  loadingLabel = "Processing...",
  requiredPlan = "FREE",
  currentPlan,
  fallbackHref = "/dashboard/subscription",
  onPlanRequired,
  onInsufficientCredits,
  customStates,
  className = "",
  showIcon = true,
  ...buttonProps
}: PlanAwareButtonProps) {
  const [isLoadingState, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  // ✅ UNIFIED: Get subscription details from unified auth system
  const { isAuthenticated, user } = useAuth()
  const { subscription } = useSubscription()
  
  // Auto-detect authentication if not explicitly provided
  const effectiveIsLoggedIn = isLoggedIn !== undefined ? isLoggedIn : isAuthenticated
    // Calculate remaining credits automatically using utility
  const creditInfo = calculateCreditInfo(
    user?.credits,
    user?.creditsUsed,
    subscription?.credits,
    subscription?.tokensUsed
  )
  
  // Use provided hasCredits or calculate automatically based on credits required
  const effectiveHasCredits = hasCredits !== undefined 
    ? hasCredits 
    : creditInfo.hasEnoughCredits(creditsRequired)  // Debug info in development
  if (process.env.NODE_ENV === 'development') {
    console.log('PlanAwareButton Debug:', {
      isLoggedIn,
      effectiveIsLoggedIn,
      isAuthenticated,
      creditInfo,
      creditsRequired,
      effectiveHasCredits,
      hasCredits,
      userCredits: user?.credits,
      userCreditsUsed: user?.creditsUsed,
      subscriptionCredits: subscription?.credits,
      subscriptionTokensUsed: subscription?.tokensUsed
    })
  }// Use provided plan or get from unified auth state if not provided
  const effectivePlan = currentPlan || subscription?.plan || "FREE"
  const isAlreadySubscribed = subscription?.status === 'ACTIVE' || false
  
  // Check if the user's plan meets requirements
  const meetsRequirement = (): boolean => {
    // Plan hierarchy for comparison
    const planHierarchy: Record<PlanType, number> = {
      FREE: 0,
      BASIC: 1,
      PREMIUM: 2,
      ULTIMATE: 3,
    }

    // Check if current plan is sufficient, using the effective plan
    return planHierarchy[effectivePlan as PlanType] >= planHierarchy[requiredPlan]
  }

  // Extract the button states based on conditions
  const getButtonState = () => {
    // Processing state takes priority
    if (isLoading || isLoadingState) {
      return {
        label: loadingLabel,
        tooltip: "Please wait while we process your request",
        disabled: true,
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
        },
      }
    }    // Authentication check - only show if definitely not logged in
    if (effectiveIsLoggedIn === false) {
      const notLoggedInState = customStates?.notLoggedIn ?? {}
      return {
        label: notLoggedInState.label ?? "Sign in to continue",
        tooltip: notLoggedInState.tooltip ?? "You need to be signed in to use this feature",
        disabled: false,
        icon: <Lock className="h-4 w-4" />,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
          router.push("/api/auth/signin?callbackUrl=/dashboard")
        },
      }
    }

    // Feature availability check
    if (!isEnabled) {
      const notEnabledState = customStates?.notEnabled ?? {}
      return {
        label: notEnabledState.label ?? "Not available",
        tooltip: notEnabledState.tooltip ?? "This option is not available right now",
        disabled: true,
        icon: <AlertCircle className="h-4 w-4" />,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
        },
      }
    }    // Credit check - now uses calculated remaining credits
    if (!effectiveHasCredits) {
      const noCreditsState = customStates?.noCredits ?? {}
      return {
        label: noCreditsState.label ?? `Need ${creditsRequired} credit${creditsRequired > 1 ? 's' : ''}`,
        tooltip: noCreditsState.tooltip ?? `You need ${creditsRequired} credit${creditsRequired > 1 ? 's' : ''} to use this feature. You have ${creditInfo.remainingCredits} remaining.`,
        disabled: false,
        icon: <AlertCircle className="h-4 w-4" />,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (onInsufficientCredits) {
            onInsufficientCredits()
          } else {
            toast({
              title: "Insufficient Credits",
              description: `You need ${creditsRequired} credit${creditsRequired > 1 ? 's' : ''} for this action. You have ${creditInfo.remainingCredits} remaining.`,
              variant: "destructive",
            })
            router.push("/dashboard/subscription")
          }
        },
      }
    }
    
    // Plan requirement check
    if (!meetsRequirement()) {
      // Check if already subscribed to prevent duplicate subscriptions
      if (isAlreadySubscribed && requiredPlan !== "FREE") {
        const alreadySubscribedState = customStates?.alreadySubscribed ?? {}
        return {
          label: alreadySubscribedState.label ?? "Already subscribed",
          tooltip: alreadySubscribedState.tooltip ?? `You're already subscribed to ${effectivePlan}. Please wait for your subscription to be processed.`,
          disabled: true,
          icon: <Check className="h-4 w-4" />,
          onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault()
          },
        }
      }

      const insufficientPlanState = customStates?.insufficientPlan ?? {}
      return {
        label: insufficientPlanState.label ?? "Upgrade plan",
        tooltip: insufficientPlanState.tooltip ?? `This feature requires the ${requiredPlan} plan or higher`,
        disabled: false,
        icon: <Lock className="h-4 w-4" />,
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
      icon: null,
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
              "relative min-w-[120px] transition-all duration-300 rounded-md",
              (isLoading || isLoadingState) && "opacity-80 cursor-not-allowed",
              state.disabled && "opacity-70",
              className
            )}
            {...buttonProps}
          >
            {showIcon && state.icon && <span className="mr-2">{state.icon}</span>}
            {(isLoading || isLoadingState) && !state.icon && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
