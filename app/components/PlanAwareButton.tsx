"use client"

import type React from "react"
import { useMemo, useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Lock, CheckCircle, User, Loader2, CreditCard } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface PlanAwareButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void
  isLoggedIn: boolean
  isEnabled?: boolean
  hasCredits?: boolean
  loadingLabel?: string
}

const PlanAwareButton: React.FC<PlanAwareButtonProps> = ({
  label,
  onClick,
  isLoggedIn,
  isEnabled = true,
  hasCredits = true,
  loadingLabel = "Processing...",
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false)

  const isDisabled = useMemo(
    () => isLoading || !isLoggedIn || !isEnabled || !hasCredits,
    [isLoading, isLoggedIn, isEnabled, hasCredits],
  )

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      if (isDisabled) return

      setIsLoading(true)
      try {
        if (onClick) {
          await onClick(e)
        }
      } catch (error) {
        console.error("Error in PlanAwareButton handleClick:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [isDisabled, onClick],
  )

  

  const buttonLabel = useMemo(() => {
    if (isLoading) return loadingLabel
    if (!isLoggedIn) return "Sign in to create"
    if (!hasCredits) return "Subscribe or buy more"
    if (!isEnabled) return "Upgrade to unlock"
    return label
  }, [isLoading, loadingLabel, isLoggedIn, isEnabled, hasCredits, label])

  const tooltipContent = useMemo(() => {
    if (isLoading) return "Action in progress, please wait."
    if (!isLoggedIn) return "You must sign in to create or use this feature."
    if (!hasCredits) return "You've used up all your credits. Upgrade or buy more to continue."
    if (!isEnabled) return "This feature is not available on your current plan. Please upgrade."
    return "Ready to go!"
  }, [isLoading, isLoggedIn, isEnabled, hasCredits])

  const buttonStyle = useMemo(() => {
    if (isLoading) return "bg-blue-500 hover:bg-blue-600 text-white opacity-80 shadow-md shadow-blue-300/50"
    if (!isLoggedIn) return "bg-gray-200 hover:bg-gray-300 text-orange-500 border-2 border-orange-500"
    if (!hasCredits) return "bg-white hover:bg-gray-100 text-red-500 border-2 border-red-500"
    if (!isEnabled) return "bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-2 border-yellow-500"
    return "bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white shadow-md shadow-green-300/50"
  }, [isLoading, isLoggedIn, isEnabled, hasCredits])
  const buttonContent = useMemo(() => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {loadingLabel}
        </>
      )
    }
    if (!isLoggedIn)
      return (
        <>
          <User className="h-4 w-4 mr-2" />
          {buttonLabel}
        </>
      )
    if (!hasCredits)
      return (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          {buttonLabel}
        </>
      )
    if (!isEnabled)
      return (
        <>
          <Lock className="h-4 w-4 mr-2" />
          {buttonLabel}
        </>
      )
    return (
      <>
        <CheckCircle className="h-4 w-4 mr-2" />
        {label}
      </>
    )
  }, [isLoading, loadingLabel, isLoggedIn, isEnabled, hasCredits, buttonLabel, label])
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            className={`transition-all duration-300 ease-in-out font-medium rounded-lg px-4 py-2 ${buttonStyle}`}
            disabled={isDisabled}
            {...props}
          >
            {buttonContent}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          className={`rounded-md p-2 text-sm font-medium text-white ${
            isLoading
              ? "bg-blue-500"
              : !isLoggedIn
                ? "bg-orange-500"
                : !hasCredits
                  ? "bg-red-500"
                  : !isEnabled
                    ? "bg-yellow-500"
                    : "bg-green-500"
          }`}
        >
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

PlanAwareButton.displayName = "PlanAwareButton"

export { PlanAwareButton }

