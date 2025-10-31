"use client"

import { LogOut, User, CreditCard, Shield, LogIn } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useAuth } from "@/modules/auth"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import { useState, useCallback, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface CreditInfo {
  hasCredits: boolean
  remainingCredits: number
  totalCredits: number
  usedCredits: number
}

export function UserMenu() {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth()
  const { subscription, plan } = useUnifiedSubscription()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [creditInfo, setCreditInfo] = useState<CreditInfo>({
    hasCredits: false,
    remainingCredits: 0,
    totalCredits: 0,
    usedCredits: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const totalCredits = subscription?.credits ?? 0
    const usedCredits = subscription?.tokensUsed ?? 0
    const remainingCredits = Math.max(0, totalCredits - usedCredits)

    setCreditInfo((prev) => {
      if (
        prev.totalCredits === totalCredits &&
        prev.usedCredits === usedCredits &&
        prev.remainingCredits === remainingCredits
      ) {
        return prev
      }
      return {
        hasCredits: remainingCredits > 0,
        remainingCredits,
        totalCredits,
        usedCredits,
      }
    })
  }, [subscription?.credits, subscription?.tokensUsed])

  const handleSignIn = useCallback(() => {
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/"
    const callbackUrl = encodeURIComponent(currentPath)
    router.push(`/auth/signin?callbackUrl=${callbackUrl}`)
  }, [router])

  const handleSignOut = useCallback(async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await signOut({ callbackUrl: "/dashboard/explore", redirect: true })
    } catch {
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard/explore"
      }
    } finally {
      setIsLoggingOut(false)
    }
  }, [isLoggingOut])

  const subscriptionPlan = useMemo(() => plan || "FREE", [plan])
  const isPremium = useMemo(() => subscriptionPlan !== "FREE", [subscriptionPlan])

  if (isAuthLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-10 w-10 rounded-none border-3 border-[var(--color-border)] bg-[var(--color-muted)] shadow-[2px_2px_0_var(--shadow-color)]"
      >
        <div className="animate-pulse w-full h-full bg-[var(--color-border)] rounded-none" />
      </motion.div>
    )
  }

  if (!isAuthenticated) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button
          onClick={handleSignIn}
          size="sm"
          className={cn(
            "bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-[var(--color-text)]",
            "font-black border-3 border-[var(--color-border)] shadow-[2px_2px_0_var(--shadow-color)]",
            "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--shadow-color)]",
            "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--shadow-color)]",
            "transition-all duration-150 rounded-none uppercase tracking-wider"
          )}
        >
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </motion.div>
    )
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild suppressHydrationWarning>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            variant="ghost"
            className={cn(
              "relative h-10 w-10 rounded-none border-3 border-[var(--color-border)]",
              "shadow-[2px_2px_0_var(--shadow-color)]",
              "hover:shadow-[3px_3px_0_var(--shadow-color)]",
              "hover:translate-y-[-1px]",
              "transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            )}
            suppressHydrationWarning
            aria-label="User menu"
          >
            <Avatar className="h-8 w-8 border-2 border-[var(--color-border)]">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
              <AvatarFallback className="bg-[var(--color-primary)] text-[var(--color-text)] font-black text-sm">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </motion.div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={cn(
          "w-full sm:w-80 p-0 rounded-none",
          "bg-[var(--color-card)] border-4 border-[var(--color-border)]",
          "shadow-[4px_4px_0_var(--shadow-color)]",
          "z-[99]"
        )}
        align="end"
        side="bottom"
        sideOffset={8}
      >
        {/* Header Section */}
        <div className="p-4 border-b-4 border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-3 border-[var(--color-border)] shadow-[2px_2px_0_var(--shadow-color)] flex-shrink-0">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
              <AvatarFallback className="bg-[var(--color-primary)] text-[var(--color-text)] font-black">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-[var(--color-text)] truncate">{user?.name}</p>
              <p className="text-xs text-[var(--color-muted)] truncate">{user?.email}</p>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge
                  variant={isPremium ? "default" : "outline"}
                  className={cn(
                    "text-xs border-2 border-[var(--color-border)] font-black px-2 py-1 rounded-none",
                    isPremium
                      ? "bg-[var(--color-primary)] text-[var(--color-text)]"
                      : "bg-[var(--color-bg)] text-[var(--color-text)]"
                  )}
                >
                  {subscriptionPlan}
                </Badge>

                <div className="text-xs font-black text-[var(--color-muted)]">
                  {creditInfo?.remainingCredits.toLocaleString() ?? 0}/{creditInfo?.totalCredits.toLocaleString() ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-3 space-y-2">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/account"
                className={cn(
                  "flex items-center gap-3 px-3 py-3 font-black text-sm rounded-none",
                  "border-2 border-transparent",
                  "hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]",
                  "hover:shadow-[2px_2px_0_var(--shadow-color)]",
                  "transition-all duration-150 cursor-pointer uppercase tracking-wide",
                  "text-[var(--color-text)]"
                )}
              >
                <User className="h-4 w-4 flex-shrink-0" />
                <span>Account Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/subscription"
                className={cn(
                  "flex items-center gap-3 px-3 py-3 font-black text-sm rounded-none",
                  "border-2 border-transparent",
                  "hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]",
                  "hover:shadow-[2px_2px_0_var(--shadow-color)]",
                  "transition-all duration-150 cursor-pointer uppercase tracking-wide",
                  "text-[var(--color-text)]"
                )}
              >
                <CreditCard className="h-4 w-4 flex-shrink-0" />
                <span>Subscription</span>
              </Link>
            </DropdownMenuItem>

            {user?.isAdmin && (
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/admin"
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 font-black text-sm rounded-none",
                    "border-2 border-transparent",
                    "hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]",
                    "hover:shadow-[2px_2px_0_var(--shadow-color)]",
                    "transition-all duration-150 cursor-pointer uppercase tracking-wide",
                    "text-[var(--color-text)]"
                  )}
                >
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  <span>Admin Panel</span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-[var(--color-border)] h-[2px] my-2" />

          {/* Sign Out */}
          <DropdownMenuItem
            className={cn(
              "cursor-pointer px-3 py-3 font-black text-sm rounded-none",
              "border-2 border-transparent",
              "hover:border-[var(--color-error)] hover:bg-[var(--color-error)]/10",
              "hover:shadow-[2px_2px_0_var(--color-error)]",
              "text-[var(--color-error)] transition-all duration-150 uppercase tracking-wide",
              "flex items-center gap-3",
              isLoggingOut && "opacity-50 cursor-not-allowed"
            )}
            onClick={handleSignOut}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current flex-shrink-0" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span>Sign Out</span>
              </>
            )}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserMenu