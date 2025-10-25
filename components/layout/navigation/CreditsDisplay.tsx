"use client"

import { motion } from "framer-motion"
import { Zap, Brain } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface CreditsDisplayProps {
  availableCredits: number | null
  subscriptionPlan: string
  isPremium: boolean
  prefersReducedMotion: boolean
}

export function CreditsDisplay({
  availableCredits,
  subscriptionPlan,
  isPremium,
  prefersReducedMotion
}: CreditsDisplayProps) {
  // Show skeleton only when credits are null (loading), not when they're 0
  if (availableCredits === null || availableCredits === undefined) {
    return (
      <motion.div
        className="flex items-center space-x-2 text-xs sm:text-sm"
        variants={prefersReducedMotion ? {} : {
          hidden: { opacity: 0, y: -10 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
        }}
        initial={prefersReducedMotion ? {} : "hidden"}
        animate={prefersReducedMotion ? {} : "visible"}
      >
        <Skeleton className="h-8 w-24 rounded-lg bg-muted border-4 border-border shadow-neo" />
      </motion.div>
    )
  }

  const isLowCredits = availableCredits < 5 // Lowered threshold for better UX

  return (
    <motion.div
      className={cn(
        "flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border-4 transition-all duration-300 text-xs sm:text-sm",
        "bg-primary/10",
        "border-primary/40 shadow-neo",
        "hover:shadow-neo-xl"
      )}
      data-testid="credits-display"
      variants={prefersReducedMotion ? {} : {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
      }}
      initial={prefersReducedMotion ? {} : "hidden"}
      animate={prefersReducedMotion ? {} : "visible"}
      whileHover={prefersReducedMotion ? {} : {
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
    >
      <motion.div
        className="relative"
        variants={prefersReducedMotion ? {} : {
          idle: { opacity: 0.6, scale: 1 },
          hover: { opacity: 1, scale: 1.05, transition: { duration: 0.3 } }
        }}
        initial={prefersReducedMotion ? {} : "idle"}
        whileHover={prefersReducedMotion ? {} : "hover"}
      >
        <Zap className="h-4 w-4 text-primary" />
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm" />
      </motion.div>
      <span
        className={cn(
          "text-sm font-medium tabular-nums text-primary",
          isLowCredits ? "text-destructive" : ""
        )}
      >
        {availableCredits.toLocaleString()}
      </span>
      {isPremium && (
        <motion.div
          initial={prefersReducedMotion ? {} : { scale: 0 }}
          animate={prefersReducedMotion ? {} : { scale: 1 }}
          transition={prefersReducedMotion ? {} : {
            delay: 0.2,
            type: "spring",
            stiffness: 500
          }}
        >
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium ml-2 px-2 py-0.5",
              "bg-secondary text-secondary-foreground border-4 border-secondary shadow-[4px_4px_0px_0px_hsl(var(--border))]",
              "border border-secondary/20 shadow-sm"
            )}
          >
            <Brain className="h-3 w-3 mr-1" />
            {subscriptionPlan}
          </Badge>
        </motion.div>
      )}
    </motion.div>
  )
}
