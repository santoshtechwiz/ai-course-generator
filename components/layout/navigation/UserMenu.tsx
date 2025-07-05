"use client"

import { LogOut, User, Crown, CreditCard, LogIn } from "lucide-react"
import { GlobalLoader } from "@/components/ui/loader"
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
// ✅ UNIFIED: Using unified auth system only
import { useAuth } from "@/modules/auth"

export function UserMenu({ children }: { children?: ReactNode }) {
  // ✅ UNIFIED: Using unified auth system - single source of truth
  const { isAuthenticated, isLoading: isAuthLoading, user, subscription, signOut } = useAuth()
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleMenuOpen = (open: boolean) => {
    setIsMenuOpen(open)
  }

  const handleSignIn = () => {
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
  }

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error("Sign out error:", error)
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
      return <Skeleton className="h-4 w-12 ml-1" />
    }

    // Credits come from the user object 
    const credits = user?.credits ?? 0
    return <span className="text-xs text-muted-foreground ml-1">({credits} credits)</span>
  }

  // Custom trigger for dropdown menu
  const menuTrigger = children || (
    <Button 
      variant="ghost" 
      className="relative h-8 w-8 rounded-full hover:bg-primary/10 transition-all duration-200"
      aria-label="User menu"
    >      <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200">
        <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? "User"} />
        <AvatarFallback className="bg-primary/5 text-primary">
          {isAuthLoading ? <GlobalLoader size="xs" /> : user?.name?.[0] ?? "U"}
        </AvatarFallback>
      </Avatar>
    </Button>
  )

  // Show loading state
  if (isAuthLoading) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <GlobalLoader size="sm" theme="primary" />
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
              <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? "User"} />
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
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-2" />

          <DropdownMenuItem 
            className="cursor-pointer p-3 hover:bg-destructive/5 text-destructive"
            onClick={handleSignOut}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <GlobalLoader size="xs" className="mr-3" />
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
