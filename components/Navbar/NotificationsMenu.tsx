"use client"

import { useState, useEffect } from "react"
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
import { useSession } from "next-auth/react"
import { useAuth } from "@/hooks/useAuth"

import useSubscription from "@/hooks/use-subscription"

interface NotificationsMenuProps {
  initialCount?: number
  refreshCredits?: () => void
}

export default function NotificationsMenu({ initialCount = 0, refreshCredits }: NotificationsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [creditCount, setCreditCount] = useState(initialCount)
  const { data, setRefreshing } = useSubscription()
  const [isClient, setIsClient] = useState(false)
  const { data: session } = useSession()
  const { user } = useAuth()

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true)
  }, [])
  // Update credit count when subscription status changes
  useEffect(() => {
    // First check subscription data
    if (data && typeof data.credits === "number") {
      setCreditCount(data.credits - (data.tokensUsed ?? 0))
    } 
    // Then check user data from Redux
    else if (user?.credits) {
      setCreditCount(user.credits)
    }
    // Then check session data
    else if (session?.user?.credits) {
      setCreditCount(session.user.credits)
    }
    // Fallback to initialCount
    else if (initialCount > 0) {
      setCreditCount(initialCount)
    }
  }, [data, user, session, initialCount])

  // Refresh credits when the dropdown is opened
  const handleOpen = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setRefreshing(true)
      if (refreshCredits) {
        refreshCredits()
      }
    }
  }

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
            <p className="text-xs text-muted-foreground">You have {creditCount} credits remaining</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          <DropdownMenuItem className="cursor-pointer flex flex-col items-start p-3 hover:bg-accent rounded-lg transition-colors duration-200">
            <div className="flex w-full justify-between items-center">
              <span className="font-medium">Subscription Status</span>
              <Badge variant="outline" className="ml-2">
                {data?.subscriptionPlan || "FREE"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.isSubscribed ? "Your subscription is active" : "Your subscription is inactive"}
            </p>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
