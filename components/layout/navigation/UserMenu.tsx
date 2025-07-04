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
import { useEffect, useState, useRef, useCallback } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { selectSubscription, selectSubscriptionLoading, selectSubscriptionData, fetchSubscription } from "@/store/slices/subscription-slice"
import { useAppDispatch, useAppSelector } from "@/store"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { syncSubscriptionData } from "@/store/slices/auth-slice"

export function UserMenu({ children }: { children?: ReactNode }) {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth()
  const dispatch = useAppDispatch()
  const subscriptionData = useAppSelector(selectSubscription)
  const isLoadingSubscription = useAppSelector(selectSubscriptionLoading)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const hasInitializedRef = useRef(false)
  // Add fetch error tracking
  const [fetchErrors, setFetchErrors] = useState(0)

  const handleMenuOpen = (open: boolean) => {
    setIsMenuOpen(open)
    // Only fetch subscription if authenticated and not too many errors
    if (open && isAuthenticated && !isLoadingSubscription && fetchErrors < 3) {
      fetchSubscriptionData()
    }
  }
  // Create a wrapper function for fetching subscription data with error handling
  const fetchSubscriptionData = useCallback(() => {
    if (!isAuthenticated || isLoggingOut) return;
    
    // Use a try-catch to prevent unhandled promise rejections
    try {
      dispatch(fetchSubscription())
        .unwrap()
        .then(data => {
          // Sync the subscription data to auth state to ensure consistency
          dispatch(syncSubscriptionData(data));
        })
        .catch(error => {
          console.log("Subscription fetch error handled:", error?.message || "Unknown error");
          setFetchErrors(prev => prev + 1);
        });
    } catch (err) {
      console.warn("Error initiating subscription fetch:", err);
    }
  }, [dispatch, isAuthenticated, isLoggingOut]);

  useEffect(() => {
    // Only fetch subscription on initial load if user is authenticated, not logging out, and error count is low
    if (isAuthenticated && !isLoggingOut && !hasInitializedRef.current && fetchErrors < 3) {
      hasInitializedRef.current = true;
      fetchSubscriptionData();
    }
  }, [isAuthenticated, isLoggingOut, fetchSubscriptionData, fetchErrors])


  const handleSignIn = () => {
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
  }

  const getSubscriptionBadge = () => {
    if (isLoadingSubscription) {
      return (
        <Badge variant="outline" className="ml-auto">
          <Skeleton className="h-4 w-16" />
        </Badge>
      )
    }

    // Default to FREE if there are fetch errors or no subscription data
    const plan = fetchErrors >= 3 ? "FREE" : (subscriptionData?.data?.subscriptionPlan || "FREE")

    const variants = {
      PRO: "default",
      BASIC: "secondary",
      ULTIMATE: "success",
      FREE: "outline",
    } as const

    return (
      <Badge
        variant={variants[plan as keyof typeof variants] === "success" ? "default" : variants[plan as keyof typeof variants] || "outline"}
        className="ml-auto"
      >
        {plan}
      </Badge>
    )
  }

  const getCreditsDisplay = () => {
    if (isLoadingSubscription) {
      return <Skeleton className="h-4 w-12 ml-1" />
    }

    // Default to 0 credits if there are fetch errors
    const credits = fetchErrors >= 3 ? 0 : (subscriptionData?.data?.credits ?? 0)
    return <span className="text-xs text-muted-foreground ml-1">({credits} credits)</span>
  }

  // Custom trigger for dropdown menu
  const menuTrigger = children || (
    <Button 
      variant="ghost" 
      className="relative h-8 w-8 rounded-full hover:bg-primary/10 transition-all duration-200"
      aria-label="User menu"
    >
      <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200">
        <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
        <AvatarFallback className="bg-primary/5 text-primary">
          {isLoadingSubscription ? <GlobalLoader size="xs" /> : user?.name?.[0] ?? "U"}
        </AvatarFallback>
      </Avatar>
    </Button>
  )

  // Show nothing until auth state is resolved to prevent flicker
  if (isAuthLoading) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <GlobalLoader size="sm" theme="primary" />
      </Button>
    )
  }

  // For non-authenticated users, show sign-in button
  if (!isAuthenticated) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignIn}
        className="transition-all duration-200 hover:bg-primary/10 hover:text-primary flex gap-1.5 items-center h-9 px-3"
      >
        <LogIn className="h-4 w-4" />
        Sign In
      </Button>
    )
  }

  // For authenticated users, show dropdown menu
  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpen}>
        <DropdownMenuTrigger asChild>
          {menuTrigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-56 animate-in fade-in-50 duration-100" 
          align="end" 
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              {user?.name ? 
                <p className="font-medium text-sm text-primary/90">{user.name}</p> : 
                <Skeleton className="h-4 w-24" />
              }
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
              <Link href="/dashboard/profile" className="cursor-pointer hover:text-primary transition-colors">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/dashboard/account" className="cursor-pointer hover:text-primary transition-colors flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Account</span>
                {getSubscriptionBadge()}
                {getCreditsDisplay()}
              </Link>
            </DropdownMenuItem>

            {user?.isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin" className="cursor-pointer hover:text-primary transition-colors">
                  <Crown className="mr-2 h-4 w-4 text-amber-500" />
                  <span>Admin</span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              setIsLoading(true)
              setIsLoggingOut(true)
              try {
                await logout()
              
              } catch (error) {
                console.error("Logout failed:", error)
              } finally {
                setIsLoading(false)
                setIsLoggingOut(false)
              }
            }}
            disabled={isLoading}
            className="cursor-pointer hover:text-red-500 transition-colors"
          >            {isLoading ? (
              <div className="flex items-center">
                <GlobalLoader size="xs" className="mr-2" />
                Logging out...
              </div>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Modal dialog for logout spinner */}
      <Dialog open={isLoading}>
        <DialogContent className="flex flex-col items-center gap-4 py-8">
          <DialogTitle className="sr-only">Logging out</DialogTitle>          <GlobalLoader size="md" className="text-primary" />
          <div className="text-lg font-semibold">Logging out...</div>
        </DialogContent>
      </Dialog>
    </>
  )
}
