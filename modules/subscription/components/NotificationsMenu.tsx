"use client"

import { Bell, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react"
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
import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"

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
  const { user } = useAuth()
  const { subscription } = useUnifiedSubscription()

  // Memoized credit calculation
  const creditInfo = useMemo((): CreditInfo => {
    if (!subscription) {
      return { hasCredits: false, remainingCredits: 0, totalCredits: 0, usedCredits: 0 }
    }

    const totalCredits = subscription.credits || 0
    const usedCredits = subscription.tokensUsed || 0
    const remainingCredits = Math.max(0, totalCredits - usedCredits)

    return {
      hasCredits: remainingCredits > 0,
      remainingCredits,
      totalCredits,
      usedCredits
    }
  }, [subscription?.credits, subscription?.tokensUsed])

  const creditProgress = useMemo(() => {
    if (creditInfo.totalCredits === 0) return 0
    return Math.min((creditInfo.usedCredits / creditInfo.totalCredits) * 100, 100)
  }, [creditInfo.usedCredits, creditInfo.totalCredits])

  const creditStatus = useMemo(() => {
    if (creditInfo.remainingCredits === 0) return "empty"
    if (creditInfo.remainingCredits < 50) return "low"
    if (creditInfo.remainingCredits < 100) return "warning"
    return "good"
  }, [creditInfo.remainingCredits])

  const handleOpen = (open: boolean) => {
    setIsOpen(open)
    if (open && refreshCredits) refreshCredits()
  }

  const subscriptionPlan = subscription?.subscriptionPlan || "FREE"
  const isSubscribed = subscription?.isSubscribed || false

  // Brutal animation variants
  const bellVariants = {
    idle: { rotate: 0 },
    alert: { rotate: [0, -15, 15, -15, 0], transition: { duration: 0.6 } }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="neutral"
          className={cn(
            "relative h-10 w-10 rounded-none border-3 border-[var(--color-border)]",
            "shadow-[2px_2px_0px_0px_var(--color-border)]",
            "hover:shadow-[4px_4px_0px_0px_var(--color-border)]",
            "hover:translate-y-[-2px]",
            "transition-all duration-100",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
          )}
        >
          <motion.div
            variants={bellVariants}
            animate={creditStatus === "empty" ? "alert" : "idle"}
          >
            <Bell className="h-4 w-4" />
          </motion.div>

          <AnimatePresence>
            {creditInfo.remainingCredits > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge
                  variant={creditStatus === "low" ? "neutral" : creditStatus === "empty" ? "destructive" : "default"}
                  className={cn(
                    "h-5 min-w-5 flex items-center justify-center rounded-none px-1 text-[10px] font-black border-2 border-[var(--color-border)]",
                    creditStatus === "low" && "bg-[var(--color-warning)]",
                    creditStatus === "empty" && "bg-[var(--color-error)]"
                  )}
                >
                  {creditInfo.remainingCredits > 99 ? "99+" : creditInfo.remainingCredits}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status indicator dots */}
          {(creditStatus === "low" || creditStatus === "empty") && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--color-warning)] rounded-full border border-[var(--color-border)]" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        className={cn(
          "w-72 p-0 rounded-none",
          "modal",
          "z-[var(--z-index-modal)]",
        )}
        align="end"
        side="bottom"
        sideOffset={12}
      >
        {/* Header */}
        <div className="p-4 border-b-3 border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-none bg-[var(--color-primary)] border-3 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] flex-shrink-0">
              <Bell className="h-5 w-5 text-[var(--color-text)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--color-text)]">Credit Usage</p>
              <p className="text-xs text-[var(--color-muted)]">Monitor your usage</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={isSubscribed ? "default" : "neutral"}
                  className={cn(
                    "text-xs border-2 border-[var(--color-border)] font-black px-2 py-0.5 rounded-none",
                    isSubscribed
                      ? "bg-[var(--color-primary)] text-[var(--color-text)]"
                      : "bg-[var(--color-bg)] text-[var(--color-text)]",
                  )}
                >
                  {subscriptionPlan}
                </Badge>
                <div className="text-xs font-bold text-[var(--color-muted)]">
                  {creditInfo.remainingCredits}/{creditInfo.totalCredits} credits
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-4 border-b-3 border-[var(--color-border)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-[var(--color-text)]">Usage</span>
            <span className="text-sm font-bold text-[var(--color-text)]">
              {creditInfo.usedCredits} / {creditInfo.totalCredits}
            </span>
          </div>
          <div className="w-full bg-[var(--color-muted)] rounded-none h-3 border-2 border-[var(--color-border)] shadow-[1px_1px_0px_0px_var(--color-border)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${creditProgress}%` }}
              className={cn(
                "h-full border-r-2 border-[var(--color-border)]",
                creditStatus === "good" && "bg-[var(--color-success)]",
                creditStatus === "warning" && "bg-[var(--color-warning)]",
                creditStatus === "low" && "bg-[var(--color-accent)]",
                creditStatus === "empty" && "bg-[var(--color-error)]"
              )}
            />
          </div>
        </div>

        {/* Credit Stats */}
        <div className="p-4 border-b-3 border-[var(--color-border)]">
          <div className="grid grid-cols-2 gap-3">
            <div className={cn(
              "p-3 border-3 border-[var(--color-border)] text-center rounded-none",
              "bg-[var(--color-muted)] shadow-[2px_2px_0px_0px_var(--color-border)]"
            )}>
              <div className="text-xl font-black text-[var(--color-success)]">
                {creditInfo.remainingCredits}
              </div>
              <div className="text-xs font-black mt-1 text-[var(--color-text)]">AVAILABLE</div>
            </div>

            <div className={cn(
              "p-3 border-3 border-[var(--color-border)] text-center rounded-none",
              "bg-[var(--color-muted)] shadow-[2px_2px_0px_0px_var(--color-border)]"
            )}>
              <div className="text-xl font-black text-[var(--color-accent)]">
                {creditInfo.usedCredits}
              </div>
              <div className="text-xs font-black mt-1 text-[var(--color-text)]">USED</div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-2">
          {/* Subscription Status */}
          <DropdownMenuItem className="flex flex-col items-start cursor-default p-3">
            <div className="flex w-full justify-between items-center">
              <span className="font-bold text-sm text-[var(--color-text)]">Subscription</span>
              <Badge
                variant={isSubscribed ? "default" : "neutral"}
                className={cn(
                  "border-2 border-[var(--color-border)] font-black rounded-none",
                  isSubscribed
                    ? "bg-[var(--color-primary)] text-[var(--color-text)]"
                    : "bg-[var(--color-bg)] text-[var(--color-text)]",
                )}
              >
                {subscriptionPlan}
              </Badge>
            </div>
            <p className="text-xs font-bold mt-1 text-[var(--color-muted)]">
              {isSubscribed ? "ACTIVE" : "UPGRADE FOR MORE"}
            </p>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-[var(--color-border)] h-[3px] my-2" />

          {/* Upgrade Button */}
          {!isSubscribed && (
            <div className="p-3">
              <Button
                className="btn btn-primary w-full font-black"
                size="sm"
                onClick={() => window.open('/pricing', '_blank')}
              >
                💎 UPGRADE
              </Button>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}