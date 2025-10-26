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
  const [isHovering, setIsHovering] = useState(false)
  const [creditInfo, setCreditInfo] = useState<CreditInfo>({
    hasCredits: false,
    remainingCredits: 0,
    totalCredits: 0,
    usedCredits: 0
  })
  
  const { user } = useAuth()
  const { subscription } = useUnifiedSubscription()

  // Get Neobrutalism utility classes
  const { buttonIcon } = getColorClasses()

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
  
  const subscriptionPlan = subscription?.subscriptionPlan || "FREE"
  const isSubscribed = subscription?.isSubscribed || false
  const subscriptionStatus = subscription?.status || "INACTIVE"

  // Memoized credit progress calculation
  const creditProgress = useMemo(() => {
    if (creditInfo.totalCredits === 0) return 0
    return Math.min((creditInfo.usedCredits / creditInfo.totalCredits) * 100, 100)
  }, [creditInfo.usedCredits, creditInfo.totalCredits])

  // Credit status for visual indicators
  const creditStatus = useMemo(() => {
    if (creditInfo.remainingCredits === 0) return "empty"
    if (creditInfo.remainingCredits < 50) return "low"
    if (creditInfo.remainingCredits < 100) return "warning"
    return "good"
  }, [creditInfo.remainingCredits])

  // Bell animation variants based on credit status
  const bellVariants = {
    idle: { rotate: 0 },
    hover: { rotate: [-2, 2, -2, 2, 0], transition: { duration: 0.5 } },
    alert: { 
      rotate: [0, -15, 15, -15, 0], 
      transition: { duration: 0.6, repeat: creditStatus === "empty" ? Infinity : 0, repeatDelay: 3 } 
    },
    low: { 
      rotate: [0, -8, 8, 0], 
      transition: { duration: 0.4, repeat: 1, repeatDelay: 5 } 
    }
  }

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
            className={cn(
              "relative rounded-full border-6 border-transparent",
              buttonIcon,
              "hover:border-[var(--color-border)] hover:shadow-[var(--shadow-neo)]",
              "transition-all duration-150"
            )}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <motion.div
              variants={bellVariants}
              animate={
                creditStatus === "empty" ? "alert" : 
                creditStatus === "low" ? "low" : 
                isHovering ? "hover" : "idle"
              }
            >
              <Bell className="h-4 w-4" />
            </motion.div>
            
            <AnimatePresence>
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
                    className={cn(
                      "h-5 min-w-5 flex items-center justify-center rounded-full px-1 text-[10px] font-black border-6 border-[var(--color-border)]",
                      "shadow-[var(--shadow-neo)]",
                      creditStatus === "low" && "bg-[var(--color-warning)] text-[var(--color-text)]",
                      creditStatus === "empty" && "bg-[var(--color-error)] text-[var(--color-text)]"
                    )}
                  >
                    {creditInfo.remainingCredits > 99 ? "99+" : creditInfo.remainingCredits}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Low credit warning dot */}
            {creditStatus === "low" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--color-warning)] rounded-full border border-[var(--color-border)]"
              />
            )}

            {/* Empty credit warning dot */}
            {creditStatus === "empty" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2 }}
                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--color-error)] rounded-full border border-[var(--color-border)]"
              />
            )}

            <span className="sr-only">Notifications</span>
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className={cn(
          "w-full max-w-sm sm:max-w-md md:max-w-lg rounded-lg p-0",
          "border-4 border-border shadow-[8px_8px_0px_0px_hsl(var(--border))]",
          "bg-background"
        )}
      >
        {/* Header with enhanced styling */}
        <DropdownMenuLabel className="font-bold p-4 border-b-3 border-border bg-secondary-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-black">Credit Usage</span>
            </div>
            {creditStatus === "good" && (
              <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
            )}
            {creditStatus === "warning" && (
              <Sparkles className="h-4 w-4 text-[var(--color-warning)]" />
            )}
            {creditStatus === "low" && (
              <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />
            )}
            {creditStatus === "empty" && (
              <AlertTriangle className="h-4 w-4 text-[var(--color-error)]" />
            )}
          </div>
        </DropdownMenuLabel>

        {/* Credit Progress Bar */}
        <div className="px-4 pt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-muted-foreground">Usage Progress</span>
            <span className="text-xs font-black tabular-nums">
              {creditInfo.usedCredits} / {creditInfo.totalCredits}
            </span>
          </div>
          <div className="w-full bg-[var(--color-muted)] border-6 border-[var(--color-border)] rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${creditProgress}%` }}
              transition={{ duration: 0.8, type: "spring" }}
              className={cn(
                "h-full rounded-full transition-all duration-300",
                creditStatus === "good" && "bg-[var(--color-success)]",
                creditStatus === "warning" && "bg-[var(--color-warning)]",
                creditStatus === "low" && "bg-[var(--color-accent)]",
                creditStatus === "empty" && "bg-[var(--color-error)]"
              )}
            />
          </div>
        </div>

        <DropdownMenuSeparator className="bg-border h-[3px]" />

        {/* Credit Summary */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              className={cn(
                "p-3 border-6 border-[var(--color-border)] rounded-lg text-center",
                "bg-[var(--color-muted)] shadow-[var(--shadow-neo)]"
              )}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="text-xl font-black text-[var(--color-success)]">
                {creditInfo.remainingCredits.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-muted-foreground mt-1">
                Available
              </div>
            </motion.div>

            <motion.div 
              className={cn(
                "p-3 border-6 border-[var(--color-border)] rounded-lg text-center",
                "bg-[var(--color-muted)] shadow-[var(--shadow-neo)]"
              )}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="text-xl font-black text-[var(--color-accent)]">
                {creditInfo.usedCredits.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-muted-foreground mt-1">
                Used
              </div>
            </motion.div>
          </div>
        </div>

        {/* Subscription Status */}
        <DropdownMenuItem 
          className={cn(
            "cursor-pointer flex flex-col items-start p-4 min-h-[60px]",
            "border-t-3 border-border bg-background",
            "hover:bg-secondary-background transition-all duration-150",
            "focus:bg-secondary-background focus:shadow-[inset_2px_2px_0px_0px_hsl(var(--border))]"
          )}
        >
          <div className="flex w-full justify-between items-center">
            <span className="font-black text-sm">Subscription Plan</span>
            <Badge 
              variant="secondary" 
              className={cn(
                "ml-2 border-6 border-[var(--color-border)] font-black",
                "shadow-[var(--shadow-neo)]",
                isSubscribed ? "bg-[var(--color-success)] text-[var(--color-text)]" : "bg-[var(--color-muted)] text-[var(--color-text)]"
              )}
            >
              {subscriptionPlan}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-bold">
            {isSubscribed ? "🎉 Active subscription" : "💤 Inactive - upgrade for more credits"}
          </p>
          
          {/* Status indicator */}
          <div className="flex items-center mt-2">
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              isSubscribed ? "bg-[var(--color-success)] animate-pulse" : "bg-[var(--color-muted)]"
            )} />
            <span className="text-xs font-bold">
              Status: {subscriptionStatus}
            </span>
          </div>
        </DropdownMenuItem>

        {/* Action Button */}
        {!isSubscribed && (
          <div className="p-3 border-t-3 border-border">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                className={cn(
                  "w-full font-black border-6 border-[var(--color-border)]",
                  "shadow-[var(--shadow-neo)]",
                  "hover:shadow-[var(--shadow-neo-hover)]",
                  "active:shadow-[var(--shadow-neo-active)] active:translate-y-1",
                  "transition-all duration-150 bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-accent)]"
                )}
                size="sm"
                onClick={() => window.open('/pricing', '_blank')}
              >
                💎 Upgrade Plan
              </Button>
            </motion.div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}