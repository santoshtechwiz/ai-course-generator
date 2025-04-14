"use client"

import { useSession, signOut } from "next-auth/react"
import { LogOut, User, Crown, CreditCard } from "lucide-react"
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
import useSubscriptionStore from "@/store/useSubscriptionStore"
import type { ReactNode } from "react"
import { useEffect } from "react"

interface UserMenuProps {
  children?: ReactNode
}

export function UserMenu({ children }: UserMenuProps) {
  const { data: session } = useSession()
  const { subscriptionStatus, isLoading: isLoadingSubscription, refreshSubscription } = useSubscriptionStore()

  // Add immediate refresh on component mount
  useEffect(() => {
    if (session?.user) {
      refreshSubscription()
    }
  }, [session?.user, refreshSubscription])

  const handleSignOut = async () => {
    const currentUrl = window.location.pathname
    await signOut({ callbackUrl: currentUrl })
  }

  const getSubscriptionBadge = () => {
    if (isLoadingSubscription) {
      return (
        <Badge variant="outline" className="ml-auto animate-pulse">
          Loading...
        </Badge>
      )
    }

    if (!subscriptionStatus) {
      return (
        <Badge variant="outline" className="ml-auto">
          FREE
        </Badge>
      )
    }

    const plan = subscriptionStatus.subscriptionPlan as "PRO" | "BASIC" | "FREE" | "ULTIMATE"

    const variants = {
      PRO: "default",
      BASIC: "secondary",
      ULTIMATE: "success",
      FREE: "outline",
    } as const

    return (
      <Badge variant={variants[plan]} className="ml-auto">
        {plan}
      </Badge>
    )
  }

  if (!session) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? "User"} />
            <AvatarFallback>{session.user?.name?.[0] ?? "U"}</AvatarFallback>
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
                {session.user?.name && <p className="font-medium text-sm">{session.user.name}</p>}
                {session.user?.email && (
                  <p className="w-full truncate text-xs text-muted-foreground">{session.user.email}</p>
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
                <Link href="/dashboard/account" className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Account</span>
                  {getSubscriptionBadge()}
                </Link>
              </DropdownMenuItem>
              {session.user?.isAdmin && (
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
