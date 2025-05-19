"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useAppSelector } from "@/store"
import { selectSubscription } from "@/store/slices/subscription-slice"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/tailwindUtils"
import { Loader2 } from "lucide-react"

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
}

interface PlanAwareButtonProps {
  label: string
  onClick: () => void
  isLoggedIn: boolean
  isLoading?: boolean
  isEnabled?: boolean
  hasCredits?: boolean
  loadingLabel?: string
  className?: string
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
  className = "",
  customStates,
}: PlanAwareButtonProps) {
  const { data: session } = useSession()
  const subscription = useAppSelector(selectSubscription)
  const [isLoadingState, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Extract the button states based on conditions
  const getButtonState = () => {
    if (isLoading) {
      return {
        label: loadingLabel,
        tooltip: "Please wait while we process your request",
        disabled: true,
        onClick: () => {},
      }
    }

    if (!isLoggedIn) {
      const notLoggedInState = customStates?.notLoggedIn ?? {}
      return {
        label: notLoggedInState.label ?? "Sign in to continue",
        tooltip: notLoggedInState.tooltip ?? "You need to be signed in to use this feature",
        disabled: false,
        onClick: () => router.push("/auth/signin?callbackUrl=/dashboard"),
      }
    }

    if (!isEnabled) {
      const notEnabledState = customStates?.notEnabled ?? {}
      return {
        label: notEnabledState.label ?? "Not available",
        tooltip: notEnabledState.tooltip ?? "This option is not available right now",
        disabled: true,
        onClick: () => {},
      }
    }

    if (!hasCredits) {
      const noCreditsState = customStates?.noCredits ?? {}
      return {
        label: noCreditsState.label ?? "Upgrade plan",
        tooltip: noCreditsState.tooltip ?? "You need more credits to use this feature",
        disabled: false,
        onClick: () => router.push("/dashboard/subscription"),
      }
    }

    // Default state when everything is OK
    const defaultState = customStates?.default ?? {}
    return {
      label: defaultState.label ?? label,
      tooltip: defaultState.tooltip ?? "Click to proceed",
      disabled: false,
      onClick,
    }
  }

  const state = getButtonState()

  // Function to check if the user's plan meets the requirements
  const meetsRequirement = () => {
    if (!session?.user) return false

    // If no subscription data is available, default to not meeting requirements
    if (!subscription) return requiredPlan === "FREE"

    const currentPlan = subscription.subscriptionPlan as keyof typeof planHierarchy
    const isActive = subscription.isSubscribed

    // If the subscription is not active, only allow FREE features
    if (!isActive && requiredPlan !== "FREE") return false

    // Plan hierarchy for comparison
    const planHierarchy = {
      FREE: 0,
      BASIC: 1,
      PRO: 2,
      ULTIMATE: 3,
    }

    // Check if current plan is sufficient
    return planHierarchy[currentPlan] >= planHierarchy[requiredPlan]
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!session?.user) {
      e.preventDefault()
      setIsLoading(true)

      toast({
        title: "Authentication Required",
        description: "Please sign in to access this feature",
        variant: "destructive",
      })

      setTimeout(() => {
        router.push("/api/auth/signin")
        setIsLoading(false)
      }, 1500)
      return
    }

    if (!meetsRequirement()) {
      e.preventDefault()
      setIsLoading(true)

      if (onPlanRequired) {
        onPlanRequired()
      } else {
        toast({
          title: "Plan Upgrade Required",
          description: `This feature requires the ${requiredPlan} plan or higher`,
          variant: "destructive",
        })

        setTimeout(() => {
          router.push(fallbackHref)
          setIsLoading(false)
        }, 1500)
      }
      return
    }

    // If the original button had an onClick handler, call it
    if (props.onClick) {
      props.onClick(e)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={state.onClick}
            disabled={state.disabled}
            className={cn(
              "relative min-w-[120px] transition-all duration-200",
              isLoadingState && "opacity-80 cursor-not-allowed",
              className
            )}
          >
            {isLoadingState && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
