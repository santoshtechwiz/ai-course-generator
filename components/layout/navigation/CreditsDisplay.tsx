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
  if (availableCredits === null) {
    return (
      <motion.div
        className="hidden lg:flex items-center space-x-2"
        variants={prefersReducedMotion ? {} : {
          hidden: { opacity: 0, y: -10 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
        }}
        initial={prefersReducedMotion ? {} : "hidden"}
        animate={prefersReducedMotion ? {} : "visible"}
      >
        <Skeleton className="h-8 w-24 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20" />
      </motion.div>
    )
  }

  const isLowCredits = availableCredits < 100

  return (
    <motion.div
      className={cn(
        "hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all duration-300",
        "bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10",
        "border-primary/20 hover:border-primary/40",
        "hover:shadow-lg hover:shadow-primary/10",
        "backdrop-blur-sm"
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
          "text-sm font-medium tabular-nums bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent",
          isLowCredits ? "from-destructive to-destructive" : ""
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
              "bg-gradient-to-r from-secondary to-accent text-secondary-foreground",
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
