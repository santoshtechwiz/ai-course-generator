"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/modules/auth"

interface NotificationsMenuProps {
  refreshCredits?: () => void
}

export default function NotificationsMenu({ refreshCredits }: NotificationsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { subscription } = useAuth()

  const handleOpen = (open: boolean) => {
    setIsOpen(open)
    if (open && refreshCredits) {
      refreshCredits()
    }
  }

  const creditCount = subscription?.credits || 0
  const tokensUsed = subscription?.tokensUsed || 0
  const subscriptionPlan = subscription?.plan || "FREE"
  const isSubscribed = subscription?.isSubscribed || false
  const isExpired = subscription?.status === "CANCELED"
  const subscriptionStatus = isExpired ? "Expired" : subscription?.status || "INACTIVE"

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
            </Badge>          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isSubscribed ? "Your subscription is active" : "Your subscription is inactive"}
          </p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
