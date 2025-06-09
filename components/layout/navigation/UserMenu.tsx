"use client"

import { LogOut, User, Crown, CreditCard, Loader2, LogIn } from "lucide-react"
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
import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { signOut, signIn, useSession } from "next-auth/react"
import { selectSubscription, selectSubscriptionLoading, fetchSubscription } from "@/store/slices/subscription-slice"
import { logout, useAppDispatch, useAppSelector } from "@/store"
import { useRouter } from "next/navigation"

interface UserMenuProps {
  children?: ReactNode
}

export function UserMenu({ children }: UserMenuProps) {
  const { data: session, status } = useSession()
  const dispatch = useAppDispatch()
  const subscriptionData = useAppSelector(selectSubscription)
  const isLoadingSubscription = useAppSelector(selectSubscriptionLoading)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const isAuthenticated = status === "authenticated"
  const isLoadingSession = status === "loading"
  const user = session?.user

  const hasInitializedRef = useRef(false)

  const handleMenuOpen = (open: boolean) => {
    setIsMenuOpen(open)
    if (open && isAuthenticated && !isLoadingSubscription) {
      dispatch(fetchSubscription())
    }
  }

  useEffect(() => {
    if (isAuthenticated && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      dispatch(fetchSubscription())
    }
  }, [isAuthenticated, dispatch])

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
     await signOut({ redirect: false }) // Sign out without redirecting immediately
      // Clear user data from Redux store
      dispatch(logout())
      // Redirect to the current page after logout
      const callbackUrl = window.location.pathname
      await signOut({ callbackUrl, redirect: true })
      

    } catch (error) {
      console.error("Logout failed", error)
      setIsLoading(false)
    }
  }

  const handleSignIn = () => {
    const callbackUrl = window.location.pathname
    signIn(undefined, { callbackUrl })
  }

  const getSubscriptionBadge = () => {
    if (isLoadingSubscription) {
      return (
        <Badge variant="outline" className="ml-auto">
          <Skeleton className="h-4 w-16" />
        </Badge>
      )
    }

    const plan = subscriptionData?.subscriptionPlan || "FREE"

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

    const credits = subscriptionData?.credits ?? 0
    return <span className="text-xs text-muted-foreground ml-1">({credits} credits)</span>
  }

  if (isLoadingSession) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <Loader2 className="h-5 w-5 animate-spin text-primary/70" />
      </Button>
    )
  }

  // Render a direct sign-in button if not authenticated
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

  // Only render dropdown menu for authenticated users
  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpen}>
      <DropdownMenuTrigger asChild>
        {children || (
          <Button 
            variant="ghost" 
            className="relative h-8 w-8 rounded-full hover:bg-primary/10 transition-all duration-200"
            aria-label="User menu"
          >
            <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
              <AvatarFallback className="bg-primary/5 text-primary">
                {isLoadingSubscription ? <Loader2 className="h-4 w-4 animate-spin" /> : user?.name?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-56 animate-in fade-in-50 duration-100" 
        align="end" 
        forceMount
      >
        {isAuthenticated && user ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {user.name ? 
                  <p className="font-medium text-sm text-primary/90">{user.name}</p> : 
                  <Skeleton className="h-4 w-24" />
                }
                {user.email ? (
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

              {user.isAdmin && (
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
              onClick={handleSignOut} 
              disabled={isLoading}
              className="cursor-pointer hover:text-red-500 transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </div>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </>
              )}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
