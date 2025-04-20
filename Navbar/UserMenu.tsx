"use client"

import { LogOut, User, Crown, CreditCard, Loader2 } from "lucide-react"
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
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/providers/unified-auth-provider"
import { useSubscriptionStore } from "@/app/store/subscriptionStore"

interface UserMenuProps {
  children?: ReactNode
}

export function UserMenu({ children }: UserMenuProps) {
  const { user, isLoading: isLoadingAuth, isAuthenticated, signOutUser } = useAuth()
  const { data, isLoading: isLoadingSubscription, setRefreshing } = useSubscriptionStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Refresh subscription data when menu is opened
  const handleMenuOpen = (open: boolean) => {
    setIsMenuOpen(open)
    if (open && isAuthenticated) {
      setRefreshing(true) // Force refresh when menu opens
    }
  }

  // Refresh subscription data on mount and when session changes
  useEffect(() => {
    if (isAuthenticated) {
      setRefreshing(true) // Force refresh on mount
    }
  }, [isAuthenticated])

  const handleSignOut = async () => {
    const currentUrl = window.location.pathname
    await signOutUser(currentUrl)
  }

  // Improved subscription badge display with loading state
  const getSubscriptionBadge = () => {
    if (isLoadingSubscription) {
      return (
        <Badge variant="outline" className="ml-auto">
          <Skeleton className="h-4 w-16" />
        </Badge>
      )
    }

    // Default to FREE if no subscription data
    const plan = data?.subscriptionPlan || "FREE"

    const variants = {
      PRO: "default",
      BASIC: "secondary",
      ULTIMATE: "success",
      FREE: "outline",
    } as const

    // Handle potential state where plan is not in our variants
    const variant = plan in variants ? variants[plan as keyof typeof variants] : "outline"

    return (
      <Badge variant={variant} className="ml-auto">
        {plan}
      </Badge>
    )
  }

  // Display credits badge with loading state
  const getCreditsDisplay = () => {
    if (isLoadingSubscription) {
      return <Skeleton className="h-4 w-12 ml-1" />
    }

    const credits = data?.credits ?? 0
    return <span className="text-xs text-muted-foreground ml-1">({credits} credits)</span>
  }

  // Show loading state when auth is loading
  if (isLoadingAuth) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    )
  }

  if (!isAuthenticated || !user) return null

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
            <AvatarFallback>
              {isLoadingSubscription ? <Loader2 className="h-4 w-4 animate-spin" /> : (user?.name?.[0] ?? "U")}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {children ? (
          children
        ) : (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {user?.name ? <p className="font-medium text-sm">{user.name}</p> : <Skeleton className="h-4 w-24" />}

                {user?.email ? (
                  <p className="w-full truncate text-xs text-muted-foreground">{user.email}</p>
                ) : (
                  <Skeleton className="h-3 w-32" />
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/dashboard/account" className="cursor-pointer flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Account</span>
                  {getSubscriptionBadge()}
                  {getCreditsDisplay()}
                </Link>
              </DropdownMenuItem>
              {user?.isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/admin" className="cursor-pointer">
                    <Crown className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
