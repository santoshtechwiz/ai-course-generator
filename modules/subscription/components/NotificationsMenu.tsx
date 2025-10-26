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
import { cn, getColorClasses } from "@/lib/utils"

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
  const { buttonIcon } = getColorClasses()

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
          variant="outline"
          size="icon"
          className={cn(
            "relative rounded-full border-2 ",
            buttonIcon,
            "hover:border-[var(--color-border)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
                  variant="default"
                  className={cn(
                    "h-5 min-w-5 flex items-center justify-center rounded-full px-1 text-[10px] font-black border-2",
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
        align="end"
        className={cn(
          "w-80 rounded-none border-2 p-0",
          "bg-background  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        )}
      >
        {/* Header */}
        <DropdownMenuLabel className="font-black p-4 border-b-2 border-border bg-secondary-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>CREDIT USAGE</span>
            </div>
            {creditStatus === "good" && <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />}
            {creditStatus === "warning" && <Sparkles className="h-4 w-4 text-[var(--color-warning)]" />}
            {(creditStatus === "low" || creditStatus === "empty") && (
              <AlertTriangle className="h-4 w-4 text-[var(--color-error)]" />
            )}
          </div>
        </DropdownMenuLabel>

        {/* Progress Bar */}
        <div className="px-4 pt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black">USAGE</span>
            <span className="text-xs font-black">
              {creditInfo.usedCredits} / {creditInfo.totalCredits}
            </span>
          </div>
          <div className="w-full bg-[var(--color-muted)] rounded-none h-3 border border-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${creditProgress}%` }}
              className={cn(
                "h-full border-r border-border",
                creditStatus === "good" && "bg-[var(--color-success)]",
                creditStatus === "warning" && "bg-[var(--color-warning)]",
                creditStatus === "low" && "bg-[var(--color-accent)]",
                creditStatus === "empty" && "bg-[var(--color-error)]"
              )}
            />
          </div>
        </div>

        <DropdownMenuSeparator className="bg-border h-[2px]" />

        {/* Credit Stats */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className={cn(
              "p-3 border-2 border-border text-center",
              "bg-[var(--color-muted)]"
            )}>
              <div className="text-xl font-black text-[var(--color-success)]">
                {creditInfo.remainingCredits}
              </div>
              <div className="text-xs font-black mt-1">AVAILABLE</div>
            </div>

            <div className={cn(
              "p-3 border-2 border-border text-center",
              "bg-[var(--color-muted)]"
            )}>
              <div className="text-xl font-black text-[var(--color-accent)]">
                {creditInfo.usedCredits}
              </div>
              <div className="text-xs font-black mt-1">USED</div>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <DropdownMenuItem className="flex flex-col items-start p-4 border-t-2 border-border cursor-default">
          <div className="flex w-full justify-between items-center">
            <span className="font-black text-sm">SUBSCRIPTION</span>
            <Badge 
              variant="secondary" 
              className={cn(
                "ml-2 border border-border font-black",
                isSubscribed ? "bg-[var(--color-success)]" : "bg-[var(--color-muted)]"
              )}
            >
              {subscriptionPlan}
            </Badge>
          </div>
          <p className="text-xs font-black mt-1">
            {isSubscribed ? "ACTIVE" : "UPGRADE FOR MORE"}
          </p>
        </DropdownMenuItem>

        {/* Upgrade Button */}
        {!isSubscribed && (
          <div className="p-3 border-t-2 border-border">
            <Button
              className={cn(
                "w-full font-black border-2 border-border",
                "bg-[var(--color-primary)] hover:bg-[var(--color-accent)]",
                "hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              )}
              size="sm"
              onClick={() => window.open('/pricing', '_blank')}
            >
              💎 UPGRADE
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}