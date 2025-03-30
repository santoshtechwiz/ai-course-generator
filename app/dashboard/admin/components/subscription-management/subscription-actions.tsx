"use client"

import { useState, useCallback, type MouseEvent } from "react"
import { MoreHorizontal, RefreshCw, Ban, CreditCard, LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ResetSubscriptionDialog } from "./reset-subscription-dialog"
import { User } from "@prisma/client"


interface SubscriptionActionsProps {
  user: User
}

export function SubscriptionActions({ user }: SubscriptionActionsProps) {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [resetType, setResetType] = useState<"free" | "inactive">("free")

  const handleResetToFree = useCallback((e: MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling
    setResetType("free")
    setIsResetDialogOpen(true)
  }, [])

  const handleSetInactive = useCallback((e: MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling
    setResetType("inactive")
    setIsResetDialogOpen(true)
  }, [])

  const handleAdjustCredits = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation() // Prevent event bubbling
      // Signal to the form that we want to focus on credits tab
      const event = new CustomEvent("adjust-credits", { detail: { userId: user.id } })
      window.dispatchEvent(event)
    },
    [user.id],
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()} // Prevent event bubbling
          >
            <span className="sr-only">Open subscription menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Current Plan: <span className="font-medium text-foreground">{user.userType}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleResetToFree}>
            <RefreshCw className="mr-2 h-4 w-4 text-blue-500" />
            <span>Reset to Free Tier</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSetInactive}>
            <Ban className="mr-2 h-4 w-4 text-red-500" />
            <span>Set Inactive</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleAdjustCredits}>
            <CreditCard className="mr-2 h-4 w-4 text-green-500" />
            <span>Adjust Credits</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              // Open user profile with subscription settings
              window.open(`/dashboard/admin/users/${user.id}/subscription`, "_blank")
            }}
          >
            <LifeBuoy className="mr-2 h-4 w-4 text-purple-500" />
            <span>Manage Subscription</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResetSubscriptionDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        user={user}
        resetType={resetType}
      />
    </>
  )
}

