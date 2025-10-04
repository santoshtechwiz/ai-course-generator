"use client"


import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/modules/auth"
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'
import { useState, useEffect } from "react"

interface NotificationsMenuProps {
  refreshCredits?: () => void
}

interface CreditInfo {
  hasCredits: boolean
  remainingCredits: number
  totalCredits: number
  usedCredits: number
}

export default function NotificationsMenu({ refreshCredits }: NotificationsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [creditInfo, setCreditInfo] = useState<CreditInfo>({
    hasCredits: false,
    remainingCredits: 0,
    totalCredits: 0,
    usedCredits: 0
  })
  
  const { user } = useAuth()
  const { subscription } = useUnifiedSubscription()

  // Use unified subscription as single source of truth - fixes sync issues
  useEffect(() => {
    if (subscription) {
      const totalCredits = subscription.credits || 0
      const usedCredits = subscription.tokensUsed || 0
      const remainingCredits = Math.max(0, totalCredits - usedCredits)
      
      setCreditInfo({
        hasCredits: remainingCredits > 0,
        remainingCredits: remainingCredits,
        totalCredits: totalCredits,
        usedCredits: usedCredits
      })
    } else {
      setCreditInfo({
        hasCredits: false,
        remainingCredits: 0,
        totalCredits: 0,
        usedCredits: 0
      })
    }
  }, [subscription?.credits, subscription?.tokensUsed, subscription?.id])

  const handleOpen = (open: boolean) => {
    setIsOpen(open)
    if (open && refreshCredits) {
      refreshCredits()
    }
  }
  
  const subscriptionPlan = subscription?.plan || "FREE"
  const isSubscribed = subscription?.isActive || false
  const subscriptionStatus = subscription?.status || "INACTIVE"

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-300"
        >
          <Bell className="h-4 w-4" />          <AnimatePresence>
            {creditInfo.remainingCredits > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute -top-1 -right-1"
              >
                <Badge
                  variant="default"
                  className="h-5 min-w-5 flex bg-accent items-center justify-center rounded-full px-1 text-[10px] font-medium"
                >
                  {creditInfo.remainingCredits}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-full max-w-sm sm:max-w-md md:max-w-lg rounded-xl p-3 sm:p-4 shadow-lg border border-border/50 backdrop-blur-sm bg-background/95"
      >        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Credit Usage</p>
            <p className="text-xs text-muted-foreground">
              {creditInfo.usedCredits} used of {creditInfo.totalCredits} total credits. {creditInfo.remainingCredits} remaining.
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer flex flex-col items-start p-4 sm:p-3 min-h-[44px] hover:bg-accent rounded-lg transition-colors duration-200 touch-manipulation">
          <div className="flex w-full justify-between items-center">
            <span className="font-medium">Subscription Status</span>
            <Badge variant="outline" className="ml-2">
              {subscriptionPlan} ({subscriptionStatus})
            </Badge>          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isSubscribed ? "Your subscription is active" : "Your subscription is inactive"}
          </p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
