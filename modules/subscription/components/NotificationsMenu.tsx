"use client"

import { Bell, CreditCard } from "lucide-react"
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
import { useState, useMemo } from "react"
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
            "relative h-10 w-10 border-6 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none",
            "shadow-[3px_3px_0_var(--shadow-color)]",
            "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--shadow-color)]",
            "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--shadow-color)]",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          )}
        >
          <motion.div
            variants={bellVariants}
            animate={creditStatus === "empty" ? "alert" : "idle"}
          >
            <Bell className="h-5 w-5" />
          </motion.div>

          <AnimatePresence>
            {creditStatus !== "good" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <div className={cn(
                  "h-3 w-3 rounded-none border-2 border-[var(--color-border)]",
                  creditStatus === "empty" && "bg-[var(--color-error)]",
                  creditStatus === "low" && "bg-[var(--color-warning)]",
                  creditStatus === "warning" && "bg-[var(--color-accent)]"
                )} />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        className="w-[90vw] sm:w-80 p-0 rounded-none bg-[var(--color-card)] border-6 border-[var(--color-border)] shadow-[8px_8px_0_var(--shadow-color)] z-[var(--z-index-modal)]"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-4 border-b-6 border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-none bg-[var(--color-primary)] border-4 border-[var(--color-border)] shadow-[2px_2px_0_var(--shadow-color)] flex-shrink-0">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-[var(--color-text)]">CREDIT USAGE</p>
              <p className="text-xs text-[var(--color-muted)]">Monitor your usage</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge
                  variant={isSubscribed ? "default" : "outline"}
                  className={cn(
                    "text-xs border-3 border-[var(--color-border)] font-black px-2 py-0.5 rounded-none",
                    isSubscribed
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-bg)] text-[var(--color-text)]",
                  )}
                >
                  {subscriptionPlan}
                </Badge>
                <div className="text-xs font-black text-[var(--color-muted)]">
                  {creditInfo.remainingCredits.toLocaleString()}/{creditInfo.totalCredits.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-4 border-b-6 border-[var(--color-border)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-black text-[var(--color-text)]">USAGE</span>
            <span className="text-sm font-black text-[var(--color-text)] tabular-nums">
              {creditInfo.usedCredits.toLocaleString()} / {creditInfo.totalCredits.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-[var(--color-muted)] rounded-none h-4 border-4 border-[var(--color-border)] shadow-[2px_2px_0_var(--shadow-color)] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${creditProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={cn(
                "h-full",
                creditStatus === "good" && "bg-[var(--color-success)]",
                creditStatus === "warning" && "bg-[var(--color-warning)]",
                creditStatus === "low" && "bg-[var(--color-accent)]",
                creditStatus === "empty" && "bg-[var(--color-error)]"
              )}
            />
          </div>
        </div>

        {/* Credit Stats */}
        <div className="p-4 border-b-6 border-[var(--color-border)]">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border-4 border-[var(--color-border)] text-center rounded-none bg-[var(--color-muted)] shadow-[2px_2px_0_var(--shadow-color)]">
              <div className="text-2xl font-black text-[var(--color-success)] tabular-nums">
                {creditInfo.remainingCredits.toLocaleString()}
              </div>
              <div className="text-xs font-black mt-1 text-[var(--color-text)]">AVAILABLE</div>
            </div>

            <div className="p-3 border-4 border-[var(--color-border)] text-center rounded-none bg-[var(--color-muted)] shadow-[2px_2px_0_var(--shadow-color)]">
              <div className="text-2xl font-black text-[var(--color-accent)] tabular-nums">
                {creditInfo.usedCredits.toLocaleString()}
              </div>
              <div className="text-xs font-black mt-1 text-[var(--color-text)]">USED</div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-3">
          {/* Subscription Status */}
          <div className="p-3 border-4 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none mb-3">
            <div className="flex w-full justify-between items-center mb-1">
              <span className="font-black text-sm text-[var(--color-text)]">SUBSCRIPTION</span>
              <Badge
                variant={isSubscribed ? "default" : "outline"}
                className={cn(
                  "border-3 border-[var(--color-border)] font-black rounded-none",
                  isSubscribed
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-bg)] text-[var(--color-text)]",
                )}
              >
                {subscriptionPlan}
              </Badge>
            </div>
            <p className="text-xs font-black text-[var(--color-muted)]">
              {isSubscribed ? "✓ ACTIVE" : "UPGRADE FOR MORE"}
            </p>
          </div>

          {/* Upgrade Button */}
          {!isSubscribed && (
            <Button
              className="w-full min-h-[44px] font-black uppercase tracking-wider border-4 border-[var(--color-border)] bg-[var(--color-primary)] text-white shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_var(--shadow-color)] transition-all duration-150 rounded-none"
              size="sm"
              onClick={() => window.open('/pricing', '_blank')}
            >
              💎 UPGRADE
            </Button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}