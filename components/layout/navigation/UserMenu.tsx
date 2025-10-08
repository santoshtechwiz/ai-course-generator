"use client"

import { LogOut, User, Crown, CreditCard, Shield, LogIn } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useAuth } from "@/modules/auth"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import { useState, useCallback, useEffect } from "react"

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
    usedCredits: 0
  })
  const router = useRouter()

  // Use unified subscription as single source of truth - fixes sync issues
  useEffect(() => {
    // Derive primitives so effect only runs when meaningful values change
    const totalCredits = subscription?.credits ?? 0;
    const usedCredits = subscription?.tokensUsed ?? 0;
    const remainingCredits = Math.max(0, totalCredits - usedCredits);

    setCreditInfo(prev => {
      // Avoid state update if nothing actually changed
      if (
        prev.totalCredits === totalCredits &&
        prev.usedCredits === usedCredits &&
        prev.remainingCredits === remainingCredits
      ) {
        return prev;
      }
      return {
        hasCredits: remainingCredits > 0,
        remainingCredits,
        totalCredits,
        usedCredits
      };
    });
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
      // Redirect to explore page (Quiz/Course page) instead of homepage
      await signOut({ callbackUrl: "/dashboard/explore", redirect: true })
    } catch {
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard/explore"
      }
    } finally {
      setIsLoggingOut(false)
    }
  }, [isLoggingOut])

  if (isAuthLoading) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled>
        <div className="animate-pulse w-6 h-6 bg-muted rounded-full" />
        <span className="sr-only">Loading user menu</span>
      </Button>
    )
  }

  if (!isAuthenticated) {
    return (
      <Button
        onClick={handleSignIn}
        size="sm"
        className="bg-primary hover:bg-primary/90 text-white font-medium"
      >
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Button>
    )
  }

  if (!user) return null

  const subscriptionPlan = plan || "FREE"
  const isPremium = subscriptionPlan !== "FREE"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild suppressHydrationWarning>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
          suppressHydrationWarning
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
            <AvatarFallback>
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-72 p-0 shadow-lg border border-border/50"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={isPremium ? "default" : "outline"} className="text-xs">
                  {subscriptionPlan}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {creditInfo?.remainingCredits ?? 0}/{creditInfo?.totalCredits ?? 0} credits
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-2">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/account" className="flex items-center w-full p-3">
                <User className="mr-3 h-4 w-4" />
                Account Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/dashboard/subscription" className="flex items-center w-full p-3">
                <CreditCard className="mr-3 h-4 w-4" />
                Subscription
              </Link>
            </DropdownMenuItem>

            {user?.isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin" className="flex items-center w-full p-3">
                  <Shield className="mr-3 h-4 w-4" />
                  Admin
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer p-3 hover:bg-destructive/5 text-destructive"
            onClick={handleSignOut}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-3" />
            ) : (
              <LogOut className="mr-3 h-4 w-4" />
            )}
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserMenu
