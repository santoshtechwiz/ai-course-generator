"use client"

import { LogOut, User, Crown, CreditCard, LogIn, Shield } from "lucide-react"
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
import type { ReactNode } from "react"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
// ✅ UNIFIED: Using unified auth system only
import { useAuth, useSubscription } from "@/modules/auth"
import { calculateCreditInfo } from "@/utils/credit-utils"

export function UserMenu({ children }: { children?: ReactNode }) {
  // ✅ UNIFIED: Using unified auth system - single source of truth
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth()
  const { subscription } = useSubscription()
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  // Calculate accurate credit information
  const creditInfo = calculateCreditInfo(
    user?.credits,
    user?.creditsUsed,
    subscription?.credits,
    subscription?.tokensUsed
  )

  const handleMenuOpen = (open: boolean) => {
    setIsMenuOpen(open)
  }

  const handleSignIn = () => {
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
  }

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      })
    } catch (error) {
      console.error("Sign out error:", error)
      // Fallback - force redirect if signOut fails
      router.push('/')
    } finally {
      setIsLoggingOut(false)
    }
  }
  const getSubscriptionBadge = () => {
    if (isAuthLoading) {
      return (
        <Badge variant="outline" className="ml-auto">
          <Skeleton className="h-4 w-16" />
        </Badge>
      )
    }

    const plan = subscription?.plan || "FREE"
    const status = subscription?.status || "inactive"
    
    // Show plan with status if not active (except for FREE plan)
    const displayText = plan !== "FREE" && status !== "active" 
      ? `${plan} ${status.charAt(0).toUpperCase() + status.slice(1)}` 
      : plan

    const variants = {
      PREMIUM: status === "active" ? "default" : "outline",
      PRO: status === "active" ? "default" : "outline", 
      BASIC: status === "active" ? "secondary" : "outline",
      FREE: "outline",
    } as const

    return (
      <Badge
        variant={variants[plan as keyof typeof variants] || "outline"}
        className="ml-auto"
      >
        {displayText}
      </Badge>
    )
  }
  const getCreditsDisplay = () => {
    if (isAuthLoading) {
      return <Skeleton className="h-4 w-16 ml-1" />
    }

    // Show used/remaining credits breakdown
    return (
      <div className="text-xs text-muted-foreground ml-1">
        <span className="font-medium">{creditInfo.remainingCredits}</span>
        <span className="mx-1">/</span>
        <span>{creditInfo.totalCredits}</span>
        <span className="ml-1">credits</span>
      </div>
    )
  }

  // Custom trigger for dropdown menu
  const menuTrigger = children || (
    <Button 
      variant="ghost" 
      className="relative h-8 w-8 rounded-full hover:bg-primary/10 transition-all duration-200"
      aria-label="User menu"
    >      <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200">
        <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />        <AvatarFallback className="bg-primary/5 text-primary">
          {isAuthLoading ? (
            <span className="sr-only">Loading</span>
          ) : user?.name?.[0] ?? "U"}
        </AvatarFallback>
      </Avatar>
    </Button>
  )  // Show loading state
  if (isAuthLoading) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
  <span className="sr-only">Loading</span>
      </Button>
    )
  }

  // Show sign in button for non-authenticated users
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

  // Don't render if not authenticated or no user
  if (!isAuthenticated || !user) {
    return null
  }

  const subscriptionData = subscription
  const isPremium = subscriptionData?.plan && subscriptionData.plan !== "FREE"
  const subscriptionPlan = subscriptionData?.plan || "FREE"
  const isAdmin = user?.isAdmin || false

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpen}>
      <DropdownMenuTrigger asChild>
        {menuTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-72 p-0" 
        align="end" 
        forceMount 
        side="bottom"
        sideOffset={8}
      >
        {/* User Info Header */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center space-x-3">            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {user?.name?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.name ?? "User"}
                </p>
                {user?.isAdmin && (
                  <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
              <div className="flex items-center mt-2">
                {getSubscriptionBadge()}
                {getCreditsDisplay()}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-2">
          <DropdownMenuGroup>
            <Link href="/dashboard/account">
              <DropdownMenuItem className="cursor-pointer p-3 hover:bg-primary/5">
                <User className="mr-3 h-4 w-4 text-primary" />
                <span className="font-medium">Account Settings</span>
              </DropdownMenuItem>
            </Link>
              <Link href="/dashboard/subscription">
              <DropdownMenuItem className="cursor-pointer p-3 hover:bg-primary/5">
                <CreditCard className="mr-3 h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">Subscription</span>
                  <span className="text-xs text-muted-foreground">
                    Manage your plan
                  </span>
                </div>
              </DropdownMenuItem>
            </Link>

            {/* Credits Summary */}
            <DropdownMenuLabel className="p-3 font-normal bg-muted/30">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Credit Usage</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {creditInfo.usedCredits} used • {creditInfo.remainingCredits} remaining
                  </span>
                  <span className="text-xs font-medium text-primary">
                    {creditInfo.totalCredits} total
                  </span>
                </div>
                {creditInfo.remainingCredits < 10 && creditInfo.totalCredits > 0 && (
                  <span className="text-xs text-orange-600 mt-1">
                    ⚠️ Running low on credits
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
           {user?.isAdmin && (
              <Link href="/dashboard/admin">
                <DropdownMenuItem className="cursor-pointer p-3 hover:bg-primary/5">
                  <CreditCard className="mr-3 h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-muted-foreground">
                      Manage admin settings
                    </span>
                  </div>
                </DropdownMenuItem>
              </Link>
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-2" />

          <DropdownMenuItem 
            className="cursor-pointer p-3 hover:bg-destructive/5 text-destructive"
            onClick={handleSignOut}
            disabled={isLoggingOut}
          >            {isLoggingOut ? (
              <div className="mr-3 h-4 w-4 flex items-center justify-center">
                <div className="rounded-full h-3 w-3 border-b-2 border-current opacity-60"></div>
              </div>
            ) : (
              <LogOut className="mr-3 h-4 w-4" />
            )}
            <span className="font-medium">
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserMenu
