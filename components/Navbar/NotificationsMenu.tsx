"use client"

import { Bell, CreditCard, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/modules/auth"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import { useState, useMemo, useCallback } from "react"
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

type CreditStatus = "empty" | "low" | "warning" | "good"

const bellVariants = {
  idle: { rotate: 0 },
  alert: { rotate: [0, -15, 15, -15, 0], transition: { duration: 0.6 } },
}

const statusConfig: Record<CreditStatus, { bg: string; text: string; icon: string }> = {
  empty: { bg: "bg-[var(--color-error)]", text: "text-[var(--color-error)]", icon: "🚨" },
  low: { bg: "bg-[var(--color-accent)]", text: "text-[var(--color-accent)]", icon: "⚠️" },
  warning: { bg: "bg-[var(--color-warning)]", text: "text-[var(--color-warning)]", icon: "⚡" },
  good: { bg: "bg-[var(--color-success)]", text: "text-[var(--color-success)]", icon: "✓" },
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
      usedCredits,
    }
  }, [subscription?.credits, subscription?.tokensUsed])

  const creditProgress = useMemo(() => {
    if (creditInfo.totalCredits === 0) return 0
    return Math.min((creditInfo.usedCredits / creditInfo.totalCredits) * 100, 100)
  }, [creditInfo.usedCredits, creditInfo.totalCredits])

  const creditStatus = useMemo((): CreditStatus => {
    if (creditInfo.remainingCredits === 0) return "empty"
    if (creditInfo.remainingCredits < 50) return "low"
    if (creditInfo.remainingCredits < 100) return "warning"
    return "good"
  }, [creditInfo.remainingCredits])

  const handleOpen = useCallback((open: boolean) => {
    setIsOpen(open)
    if (open && refreshCredits) refreshCredits()
  }, [refreshCredits])

  const subscriptionPlan = subscription?.subscriptionPlan || "FREE"
  const isSubscribed = subscription?.isSubscribed || false

  if (!user) return null

  const statusData = statusConfig[creditStatus]

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label="Credit notifications"
            className={cn(
              "relative h-10 w-10 border-3 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none",
              "shadow-[2px_2px_0_var(--shadow-color)]",
              "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--shadow-color)]",
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
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="absolute -top-1 -right-1"
                >
                  <div
                    className={cn(
                      "h-3 w-3 rounded-none border-2 border-[var(--color-border)]",
                      statusData.bg
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={cn(
          "w-[90vw] sm:w-96 p-0 rounded-none",
          "bg-[var(--color-card)] border-4 border-[var(--color-border)]",
          "shadow-[4px_4px_0_var(--shadow-color)]",
          "z-[99]"
        )}
        align="end"
        side="bottom"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-4 border-b-4 border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="flex items-start gap-3">
            <motion.div
              className="p-2 rounded-none bg-[var(--color-primary)] border-3 border-[var(--color-border)] shadow-[2px_2px_0_var(--shadow-color)] flex-shrink-0"
              whileHover={{ scale: 1.05 }}
            >
              <CreditCard className="h-5 w-5 text-[var(--color-text)]" />
            </motion.div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-[var(--color-text)] uppercase tracking-wide">
                Credit Usage
              </p>
              <p className="text-xs text-[var(--color-muted)]">Monitor your account status</p>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge
                  variant={isSubscribed ? "default" : "outline"}
                  className={cn(
                    "text-xs border-2 border-[var(--color-border)] font-black px-2 py-1 rounded-none uppercase",
                    isSubscribed
                      ? "bg-[var(--color-primary)] text-[var(--color-text)]"
                      : "bg-[var(--color-bg)] text-[var(--color-text)]"
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

        {/* Status Alert */}
        {creditStatus !== "good" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 border-b-3 border-[var(--color-border)] bg-[var(--color-error)]/5"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className={cn("h-4 w-4 flex-shrink-0 mt-0.5", statusData.text)} />
              <div className="text-xs font-black text-[var(--color-text)]">
                {creditStatus === "empty" && "⚠️ No credits remaining. Upgrade to continue."}
                {creditStatus === "low" && "⚡ Running low on credits. Consider upgrading soon."}
                {creditStatus === "warning" && "⚠️ Less than 100 credits remaining."}
              </div>
            </div>
          </motion.div>
        )}

        {/* Progress Bar */}
        <div className="p-4 border-b-3 border-[var(--color-border)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black text-[var(--color-text)] uppercase">Usage</span>
            <span className="text-xs font-black text-[var(--color-muted)] tabular-nums">
              {creditInfo.usedCredits.toLocaleString()} / {creditInfo.totalCredits.toLocaleString()}
            </span>
          </div>

          <div className="w-full bg-[var(--color-muted)] rounded-none h-3 border-3 border-[var(--color-border)] shadow-[2px_2px_0_var(--shadow-color)] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${creditProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={cn(
                "h-full transition-colors duration-300",
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
            <motion.div
              className="p-3 border-3 border-[var(--color-border)] text-center rounded-none bg-[var(--color-muted)] shadow-[2px_2px_0_var(--shadow-color)]"
              whileHover={{ translateY: -2 }}
            >
              <div className={cn("text-2xl font-black tabular-nums", statusData.text)}>
                {creditInfo.remainingCredits.toLocaleString()}
              </div>
              <div className="text-xs font-black mt-2 text-[var(--color-muted)] uppercase">Available</div>
            </motion.div>

            <motion.div
              className="p-3 border-3 border-[var(--color-border)] text-center rounded-none bg-[var(--color-muted)] shadow-[2px_2px_0_var(--shadow-color)]"
              whileHover={{ translateY: -2 }}
            >
              <div className="text-2xl font-black text-[var(--color-accent)] tabular-nums">
                {creditInfo.usedCredits.toLocaleString()}
              </div>
              <div className="text-xs font-black mt-2 text-[var(--color-muted)] uppercase">Used</div>
            </motion.div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="p-3 border-b-3 border-[var(--color-border)]">
          <div className="p-3 border-3 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none">
            <div className="flex w-full justify-between items-center">
              <span className="font-black text-sm text-[var(--color-text)] uppercase">Subscription</span>
              <Badge
                className={cn(
                  "border-2 border-[var(--color-border)] font-black rounded-none text-xs uppercase",
                  isSubscribed
                    ? "bg-[var(--color-primary)] text-[var(--color-text)]"
                    : "bg-[var(--color-bg)] text-[var(--color-text)]"
                )}
              >
                {isSubscribed ? "✓ Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs font-black text-[var(--color-muted)] mt-2">
              {isSubscribed ? subscriptionPlan : "Upgrade for more credits"}
            </p>
          </div>
        </div>

        {/* Upgrade Button */}
        {!isSubscribed && (
          <motion.div
            className="p-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              className="w-full min-h-[44px] font-black uppercase tracking-wider border-3 border-[var(--color-border)] bg-[var(--color-primary)] text-[var(--color-text)] shadow-[3px_3px_0_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_var(--shadow-color)] transition-all duration-150 rounded-none text-sm"
              onClick={() => window.open("/pricing", "_blank")}
            >
              💎 Upgrade Plan
            </Button>
          </motion.div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}