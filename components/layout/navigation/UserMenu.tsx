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
import { useState, useCallback } from "react"
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

  // Calculate accurate credit information with error handling
  const creditInfo = calculateCreditInfo(
    user?.credits,
    user?.creditsUsed,
    subscription?.credits,
    subscription?.tokensUsed
  )

  // FIXED: Enhanced menu open handler with debugging
  const handleMenuOpen = useCallback((open: boolean) => {
    console.log('UserMenu: handleMenuOpen called with:', open)
    try {
      setIsMenuOpen(open)
    } catch (error) {
      console.error('Error setting menu open state:', error)
    }
  }, [])

  // FIXED: Enhanced sign-in handler with better navigation
  const handleSignIn = useCallback(() => {
    try {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
      const callbackUrl = encodeURIComponent(currentPath)
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`)
    } catch (error) {
      console.error('Sign in navigation error:', error)
      // Fallback
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin'
      }
    }
  }, [router])

  // FIXED: Enhanced sign-out handler with better error handling
  const handleSignOut = useCallback(async () => {
    if (isLoggingOut) return // Prevent double-clicks
    
    setIsLoggingOut(true)
    try {
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      })
    } catch (error) {
      console.error("Sign out error:", error)
      // Fallback - force redirect if signOut fails
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } finally {
      setIsLoggingOut(false)
    }
  }, [isLoggingOut])

  // FIXED: Enhanced subscription badge with better error handling
  const getSubscriptionBadge = useCallback(() => {
    try {
      if (isAuthLoading) {
        return (
          <Badge variant="outline" className="ml-auto">
            <Skeleton className="h-3 w-12" />
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
          className="ml-auto text-xs"
        >
          {displayText}
        </Badge>
      )
    } catch (error) {
      console.warn('Error rendering subscription badge:', error)
      return (
        <Badge variant="outline" className="ml-auto text-xs">
          FREE
        </Badge>
      )
    }
  }, [isAuthLoading, subscription])

  // FIXED: Enhanced credits display with better error handling
  const getCreditsDisplay = useCallback(() => {
    try {
      if (isAuthLoading) {
        return <Skeleton className="h-3 w-16 ml-1" />
      }

      // Show used/remaining credits breakdown
      return (
        <div className="text-xs text-muted-foreground ml-1">
          <span className="font-medium">{creditInfo?.remainingCredits || 0}</span>
          <span className="mx-1">/</span>
          <span>{creditInfo?.totalCredits || 0}</span>
          <span className="ml-1">credits</span>
        </div>
      )
    } catch (error) {
      console.warn('Error rendering credits display:', error)
      return (
        <div className="text-xs text-muted-foreground ml-1">
          <span>0 credits</span>
        </div>
      )
    }
  }, [isAuthLoading, creditInfo])

  // FIXED: Enhanced menu item click handler to prevent menu closure issues
  const handleMenuItemClick = useCallback((callback?: () => void) => {
    return (e: Event) => {
      try {
        // Don't prevent default for Link components
        if (callback) {
          callback()
        }
        // Close menu after a brief delay to allow navigation
        setTimeout(() => {
          setIsMenuOpen(false)
        }, 100)
      } catch (error) {
        console.error('Menu item click error:', error)
      }
    }
  }, [])

  // FIXED: Custom trigger with better click handling
  const menuTrigger = children || (
    <Button 
      variant="ghost" 
      className="relative h-8 w-8 rounded-full hover:bg-primary/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
      aria-label="User menu"
      aria-expanded={isMenuOpen}
      aria-haspopup="menu"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('UserMenu trigger clicked, current state:', isMenuOpen)
        handleMenuOpen(!isMenuOpen)
      }}
    >
      <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200">
        <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
        <AvatarFallback className="bg-primary/5 text-primary">
          {isAuthLoading ? (
            <div className="animate-pulse w-4 h-4 bg-primary/20 rounded" />
          ) : (
            user?.name?.[0]?.toUpperCase() ?? "U"
          )}
        </AvatarFallback>
      </Avatar>
    </Button>
  )

  // Show loading state
  if (isAuthLoading) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled>
        <div className="animate-pulse w-6 h-6 bg-muted rounded-full" />
        <span className="sr-only">Loading user menu</span>
      </Button>
    )
  }

  // Show sign in button for non-authenticated users
  if (!isAuthenticated) {
    return (
      <Button 
        onClick={handleSignIn}
        size="sm" 
        className="bg-primary hover:bg-primary/90 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
        type="button"
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
    <DropdownMenu 
      open={isMenuOpen} 
      onOpenChange={handleMenuOpen}
      modal={false} // FIXED: Prevent modal behavior that might interfere
    >
      <DropdownMenuTrigger asChild>
        {menuTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-72 p-0 shadow-lg border border-border/50" 
        align="end" 
        side="bottom"
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={10}
        // FIXED: Add onCloseAutoFocus to prevent focus issues
        onCloseAutoFocus={(e) => {
          e.preventDefault()
        }}
      >
        {/* User Info Header */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.name ?? "User"}
                </p>
                {user?.isAdmin && (
                  <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" title="Administrator" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
              <div className="flex items-center mt-2 gap-2">
                {getSubscriptionBadge()}
                {getCreditsDisplay()}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-2">
          <DropdownMenuGroup>
            {/* FIXED: Account Settings Link */}
            <DropdownMenuItem asChild className="cursor-pointer p-0">
              <Link 
                href="/dashboard/account"
                className="flex items-center w-full p-3 hover:bg-primary/5 transition-colors focus:outline-none focus:bg-primary/5"
                onClick={(e) => {
                  // Close menu after navigation
                  setTimeout(() => setIsMenuOpen(false), 100)
                }}
              >
                <User className="mr-3 h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-medium">Account Settings</span>
              </Link>
            </DropdownMenuItem>

            {/* FIXED: Subscription Link */}
            <DropdownMenuItem asChild className="cursor-pointer p-0">
              <Link 
                href="/dashboard/subscription"
                className="flex items-center w-full p-3 hover:bg-primary/5 transition-colors focus:outline-none focus:bg-primary/5"
                onClick={(e) => {
                  // Close menu after navigation
                  setTimeout(() => setIsMenuOpen(false), 100)
                }}
              >
                <CreditCard className="mr-3 h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium">Subscription</span>
                  <span className="text-xs text-muted-foreground">
                    Manage your plan
                  </span>
                </div>
              </Link>
            </DropdownMenuItem>

            {/* Credits Summary */}
            <DropdownMenuLabel className="p-3 font-normal bg-muted/30">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Credit Usage</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {creditInfo?.usedCredits || 0} used • {creditInfo?.remainingCredits || 0} remaining
                  </span>
                  <span className="text-xs font-medium text-primary">
                    {creditInfo?.totalCredits || 0} total
                  </span>
                </div>
                {(creditInfo?.remainingCredits || 0) < 10 && (creditInfo?.totalCredits || 0) > 0 && (
                  <span className="text-xs text-orange-600 mt-1 flex items-center">
                    ⚠️ Running low on credits
                  </span>
                )}
              </div>
            </DropdownMenuLabel>

            {/* FIXED: Admin Link (conditional) */}
            {user?.isAdmin && (
              <DropdownMenuItem asChild className="cursor-pointer p-0">
                <Link 
                  href="/dashboard/admin"
                  className="flex items-center w-full p-3 hover:bg-primary/5 transition-colors focus:outline-none focus:bg-primary/5"
                  onClick={(e) => {
                    // Close menu after navigation
                    setTimeout(() => setIsMenuOpen(false), 100)
                  }}
                >
                  <Shield className="mr-3 h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-muted-foreground">
                      Manage admin settings
                    </span>
                  </div>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-2" />

          {/* FIXED: Sign Out Button */}
          <DropdownMenuItem 
            className="cursor-pointer p-3 hover:bg-destructive/5 text-destructive focus:bg-destructive/5 focus:text-destructive transition-colors"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleSignOut()
            }}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <div className="mr-3 h-4 w-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
              </div>
            ) : (
              <LogOut className="mr-3 h-4 w-4 flex-shrink-0" />
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