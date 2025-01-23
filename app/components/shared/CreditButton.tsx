"use client"

import React from "react"
import { useRouter, usePathname } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Loader2, Lock, CheckCircle, User } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { usePlanAware } from "@/hooks/usePlanAware"

export interface CreditButtonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void
  actionType: "courses" | "mcq" | "openEnded" | "fillInTheBlanks"
  loadingLabel?: string
  isEnabled?: boolean
}

export function CreditButton({
  label,
  onClick,
  actionType,
  loadingLabel = "Processing...",
  isEnabled = true,
  ...props
}: CreditButtonButtonProps) {
  const [isActionLoading, setIsActionLoading] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, currentPlan, subscriptionStatus } = usePlanAware()

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsActionLoading(true)

    try {
      if (!isAuthenticated) {
        const callbackUrl = encodeURIComponent(pathname || "/")
        await signIn("credentials", { callbackUrl: `/auth/signin?callbackUrl=${callbackUrl}` })
        return
      }

      const currentCount = subscriptionStatus?.[actionType] || 0
      const limit = currentPlan.limits[actionType]

      if (currentCount >= limit) {
        router.push("/dashboard/subscription")
        return
      }

      if (onClick) {
        await onClick(e)
      }
    } catch (error) {
      console.error("Error in PlanAwareButton onClick:", error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const currentCount = subscriptionStatus?.[actionType] || 0
  const limit = currentPlan.limits[actionType]
  const isWithinLimit = currentCount < limit
  const isDisabled = isActionLoading || isLoading || !isAuthenticated || !isWithinLimit || !isEnabled

  const getButtonContent = () => {
    if (isActionLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {loadingLabel}
        </>
      )
    }
    if (!isAuthenticated) return <User className="h-4 w-4 mr-2" />
    if (!isWithinLimit) return <Lock className="h-4 w-4 mr-2" />
    return <CheckCircle className="h-4 w-4 mr-2" />
  }

  const getTooltipContent = () => {
    if (isLoading) return "Loading subscription status..."
    if (!isAuthenticated) return "Sign in to proceed."
    if (!isWithinLimit) return `You've reached the limit for ${actionType} in your current plan.`
    if (!isEnabled) return "This action is currently disabled."
    return ""
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleClick} disabled={isDisabled} {...props}>
            {getButtonContent()}
            {!isActionLoading && label}
          </Button>
        </TooltipTrigger>
        {isDisabled && (
          <TooltipContent>
            <p>{getTooltipContent()}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

