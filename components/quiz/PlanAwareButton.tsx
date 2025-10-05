"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { useToast } from "@/hooks"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Loader2, Check, Lock, AlertCircle, Sparkles } from "lucide-react"
// ✅ UNIFIED: Using unified subscription system
import { useAuth } from "@/modules/auth"
import type { SubscriptionPlanType } from "@/types/subscription-plans"
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'

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
  expiredSubscription?: {
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
  requiredPlan?: SubscriptionPlanType
  currentPlan?: SubscriptionPlanType
  fallbackHref?: string
  onPlanRequired?: () => void
  onInsufficientCredits?: () => void
  onExpiredSubscription?: () => void
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
  onExpiredSubscription,
  customStates,
  className = "",
  showIcon = true,
  ...buttonProps
}: PlanAwareButtonProps) {
  const [isLoadingState, setIsLoading] = useState(false)
  const [creditInfo, setCreditInfo] = useState<{
    hasCredits: boolean;
    remainingCredits: number;
    hasEnoughCredits: (required: number) => boolean;
  }>({ hasCredits: false, remainingCredits: 0, hasEnoughCredits: () => false })
  const { toast } = useToast()
  const router = useRouter()

  // ✅ UNIFIED: Get subscription details from unified subscription hook
  const { isAuthenticated, user } = useAuth()
  const { subscription, isExpired, hasCredits: subscriptionHasCredits, needsUpgrade, plan } = useUnifiedSubscription()
  const canCreateQuiz = subscriptionHasCredits;
  const canCreateCourse = subscriptionHasCredits;
  const needsSubscriptionUpgrade = needsUpgrade;

  // Auto-detect authentication - prioritize internal auth state over prop
  const effectiveIsLoggedIn = isAuthenticated || (user?.id ? true : false)

  // Use unified subscription as single source of truth - fixes sync issues
  // Use stable primitive dependencies to prevent infinite loops
  const subscriptionCredits = subscription?.credits ?? 0
  const subscriptionTokensUsed = subscription?.tokensUsed ?? 0
  
  useEffect(() => {
    const totalCredits = subscriptionCredits
    const usedCredits = subscriptionTokensUsed
    const remainingCredits = Math.max(0, totalCredits - usedCredits)
    
    setCreditInfo({
      hasCredits: remainingCredits > 0,
      remainingCredits: remainingCredits,
      hasEnoughCredits: (required: number) => remainingCredits >= required
    })
  }, [subscriptionCredits, subscriptionTokensUsed])

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('PlanAwareButton Credit Info (SECURE):', {
      userId: user?.id,
      remainingCredits: creditInfo.remainingCredits,
      hasCredits: creditInfo.hasCredits,
      hasCreditsPassedProp: hasCredits,
      creditsRequired,
      effectiveHasCredits: hasCredits !== undefined ? hasCredits : creditInfo.hasEnoughCredits(creditsRequired)
    })
  }

  // Use provided hasCredits prop when present, but prefer the authoritative client-side
  // credit check. This prevents stale session-derived props from incorrectly marking
  // the user as out-of-credits while the client service shows available credits.
  const effectiveHasCredits = (() => {
    const clientSaysEnough = creditInfo.hasEnoughCredits(creditsRequired)
    if (hasCredits !== undefined) {
      // If prop says user has credits OR client service confirms enough, allow the action
      return Boolean(hasCredits) || clientSaysEnough
    }
    return clientSaysEnough
  })()

  // Use provided plan or get from unified auth state if not provided
  const effectivePlan = currentPlan || subscription?.subscriptionPlan || user?.subscriptionPlan || "FREE"
  const isAlreadySubscribed = subscription?.status === "ACTIVE" || false
  
  // Debug logging for plan detection issues
  if (process.env.NODE_ENV === 'development') {
    console.log('PlanAwareButton Plan Detection:', {
      currentPlan,
      subscriptionPlan: subscription?.subscriptionPlan,
      userSubscriptionPlan: user?.subscriptionPlan,
      effectivePlan,
      subscriptionStatus: subscription?.status,
      isAlreadySubscribed,
      requiredPlan
    })
  }
  
  // Enhanced subscription state checking
  const hasExpiredSubscription = isExpired || 
    (subscription?.status && 
     !["ACTIVE", "TRIALING"].includes(subscription.status) && 
     subscription.status !== "INACTIVE")

  // Check if the user's plan meets requirements
  const meetsRequirement = useMemo((): boolean => {
    // Plan hierarchy for comparison
    const planHierarchy: Record<SubscriptionPlanType, number> = {
      FREE: 0,
      BASIC: 1,
      PREMIUM: 2,
      ENTERPRISE: 3,
    }

    // Check if current plan is sufficient, using the effective plan
    return planHierarchy[effectivePlan as SubscriptionPlanType] >= planHierarchy[requiredPlan]
  }, [effectivePlan, requiredPlan])

  // Enhanced permission checking that considers both subscription status and credits
  const canPerformAction = useMemo((): boolean => {
    // Must be logged in
    if (!effectiveIsLoggedIn) return false
    
    // Must have active subscription (not expired)
    if (hasExpiredSubscription) return false
    
    // Must have sufficient plan
    if (!meetsRequirement) return false
    
    // Must have credits
    if (!effectiveHasCredits) return false
    
    // Must be enabled
    if (!isEnabled) return false
    
    return true
  }, [effectiveIsLoggedIn, hasExpiredSubscription, meetsRequirement, effectiveHasCredits, isEnabled])

  // Extract the button states based on conditions
  const getButtonState = useMemo(() => {
    // Processing state takes priority
    if (isLoading || isLoadingState) {
      return {
        label: loadingLabel,
        tooltip: "Please wait while we process your request",
        disabled: true,
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        variant: "default" as const,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
        },
      }
    }

    // Authentication check - show sign in for unauthenticated users
    if (!effectiveIsLoggedIn) {
      const notLoggedInState = customStates?.notLoggedIn ?? {}
      
      return {
        label: notLoggedInState.label ?? "Sign in to continue",
        tooltip: notLoggedInState.tooltip ?? "You need to be signed in to use this feature",
        disabled: false,
        icon: <Lock className="h-4 w-4" />,
        variant: "outline" as const,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
          router.push("/api/auth/signin?callbackUrl=/dashboard")
        },
      }
    }

    // Expired subscription check - takes priority over credits
    if (hasExpiredSubscription) {
      const expiredState = customStates?.expiredSubscription ?? {}
      
      return {
        label: expiredState.label ?? "Reactivate subscription",
        tooltip: expiredState.tooltip ?? "Your subscription has expired. Please reactivate to continue using this feature.",
        disabled: false,
        icon: <AlertCircle className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (onExpiredSubscription) {
            onExpiredSubscription()
          } else {
            toast({
              title: "Subscription Expired",
              description: "Your subscription has expired. Please reactivate to continue using this feature.",
              variant: "destructive",
            })
            router.push("/dashboard/subscription")
          }
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
        variant: "secondary" as const,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
        },
      }
    }

    // Credit check - now uses calculated remaining credits
    if (!effectiveHasCredits) {
      const noCreditsState = customStates?.noCredits ?? {}
      return {
        label: noCreditsState.label ?? `Need ${creditsRequired} credit${creditsRequired > 1 ? "s" : ""}`,
        tooltip:
          noCreditsState.tooltip ??
          `You need ${creditsRequired} credit${creditsRequired > 1 ? "s" : ""} to use this feature. You have ${creditInfo.remainingCredits} remaining.`,
        disabled: false,
        icon: <Sparkles className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (onInsufficientCredits) {
            onInsufficientCredits()
          } else {
            toast({
              title: "Insufficient Credits",
              description: `You need ${creditsRequired} credit${creditsRequired > 1 ? "s" : ""} for this action. You have ${creditInfo.remainingCredits} remaining.`,
              variant: "destructive",
            })
            router.push("/dashboard/subscription")
          }
        },
      }
    }

    // Plan requirement check
    if (!meetsRequirement) {
      // Check if already subscribed to prevent duplicate subscriptions
      if (isAlreadySubscribed && requiredPlan !== "FREE") {
        const alreadySubscribedState = customStates?.alreadySubscribed ?? {}
        return {
          label: alreadySubscribedState.label ?? "Already subscribed",
          tooltip:
            alreadySubscribedState.tooltip ??
            `You're already subscribed to ${effectivePlan}. Please wait for your subscription to be processed.`,
          disabled: true,
          icon: <Check className="h-4 w-4" />,
          variant: "secondary" as const,
          onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault()
          },
        }
      }

      // Find the next higher plan that the user should upgrade to
      const planHierarchy: SubscriptionPlanType[] = ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"]
      const currentPlanIndex = planHierarchy.indexOf(effectivePlan as SubscriptionPlanType)
      const requiredPlanIndex = planHierarchy.indexOf(requiredPlan)
      
      // Get the appropriate upgrade target
      // If user is already on the required plan or higher, suggest next tier
      // Otherwise, suggest the required plan
      let upgradeTarget: SubscriptionPlanType
      if (currentPlanIndex >= requiredPlanIndex) {
        // User is on required plan or higher, but still doesn't meet requirements
        // This could happen if subscription is inactive - suggest reactivation of current plan
        upgradeTarget = effectivePlan as SubscriptionPlanType
      } else {
        // User needs to upgrade to the required plan
        upgradeTarget = requiredPlan
      }

      const insufficientPlanState = customStates?.insufficientPlan ?? {}
      const upgradeLabel = currentPlanIndex >= requiredPlanIndex 
        ? `Reactivate ${upgradeTarget}` 
        : `Upgrade to ${upgradeTarget}`
      
      return {
        label: insufficientPlanState.label ?? upgradeLabel,
        tooltip: insufficientPlanState.tooltip ?? `This feature requires the ${requiredPlan} plan or higher. Current plan: ${effectivePlan}`,
        disabled: false,
        icon: <Lock className="h-4 w-4" />,
        variant: "outline" as const,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (onPlanRequired) {
            onPlanRequired()
          } else {
            toast({
              title: "Plan Upgrade Required",
              description: `This feature requires the ${requiredPlan} plan or higher. Current plan: ${effectivePlan}`,
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
      icon: <Sparkles className="h-4 w-4" />,
      variant: "default" as const,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        if (onClick) onClick(e)
      },
    }
  }, [
    isLoading,
    isLoadingState,
    loadingLabel,
    effectiveIsLoggedIn,
    hasExpiredSubscription,
    isEnabled,
    effectiveHasCredits,
    creditsRequired,
    creditInfo.remainingCredits,
    meetsRequirement,
    isAlreadySubscribed,
    effectivePlan,
    requiredPlan,
    label,
    onClick,
    onExpiredSubscription,
    onInsufficientCredits,
    onPlanRequired,
    fallbackHref,
    customStates,
    router,
    toast,
  ])

  const state = getButtonState

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={state.onClick}
            disabled={state.disabled}
            variant={state.variant}
            className={cn(
              "relative min-w-[120px] transition-all duration-200",
              (isLoading || isLoadingState) && "opacity-80 cursor-not-allowed",
              state.disabled && "opacity-70",
              className,
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
