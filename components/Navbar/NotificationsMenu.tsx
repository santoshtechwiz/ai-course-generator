"use client"

import { useState, useEffect } from "react"
import { Bell, RefreshCcw } from "lucide-react"
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
import { useAppSelector, useAppDispatch } from "@/store"
import { selectSubscription, fetchSubscription } from "@/store/slices/subscription-slice"
import { syncSubscriptionData } from "@/store/slices/auth-slice"
import { logger } from "@/lib/logger"

interface NotificationsMenuProps {
  refreshCredits?: () => void
}

export default function NotificationsMenu({ refreshCredits }: NotificationsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const subscription = useAppSelector(selectSubscription)
  const dispatch = useAppDispatch()
  useEffect(() => {
    // Fetch subscription data on mount and sync with auth state
    dispatch(fetchSubscription())
      .unwrap()
      .then(data => {
        // Sync the subscription data to auth state
        dispatch(syncSubscriptionData(data))
      })
      .catch(error => {
        logger.error("Failed to fetch subscription on mount:", error)
      })
  }, [dispatch])

  const handleOpen = (open: boolean) => {
    setIsOpen(open)
    if (open && refreshCredits) {
      refreshCredits()
    }
  }
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const data = await dispatch(fetchSubscription()).unwrap()
      // Sync the subscription data to auth state to ensure consistency
      dispatch(syncSubscriptionData(data))
    } catch (error) {
      logger.error("Failed to refresh subscription:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const creditCount = subscription?.data?.credits || 0
  const tokensUsed = subscription?.data?.tokensUsed || 0
  const subscriptionPlan = subscription?.data?.subscriptionPlan || "FREE"
  const isSubscribed = subscription?.data?.isSubscribed || false
  const isExpired = subscription?.data?.status === "EXPIRED"
  const subscriptionStatus = isExpired ? "Expired" : subscription?.data?.status || "Inactive"

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-300"
        >
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {creditCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute -top-1 -right-1"
              >
                <Badge
                  variant="default"
                  className="h-5 min-w-5 flex bg-red-500 items-center justify-center rounded-full px-1 text-[10px] font-medium"
                >
                  {creditCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 rounded-xl p-2 shadow-lg border border-border/50 backdrop-blur-sm bg-background/95"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Credits Available</p>
            <p className="text-xs text-muted-foreground">
              You have {creditCount} credits remaining. Tokens used: {tokensUsed}.
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer flex flex-col items-start p-3 hover:bg-accent rounded-lg transition-colors duration-200">
          <div className="flex w-full justify-between items-center">
            <span className="font-medium">Subscription Status</span>
            <Badge variant="outline" className="ml-2">
              {subscriptionPlan} ({subscriptionStatus})
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isSubscribed ? "Your subscription is active" : "Your subscription is inactive"}
          </p>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer flex items-center justify-center p-3 hover:bg-accent rounded-lg transition-colors duration-200"
          onClick={handleRefresh}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
