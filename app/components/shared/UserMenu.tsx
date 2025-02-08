import { useSession, signOut } from "next-auth/react"
import { LogOut, User, Crown } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import type { ReactNode } from "react"

interface UserMenuProps {
  children?: ReactNode
}

export function UserMenu({ children }: UserMenuProps) {
  const { data: session } = useSession()
  const { subscriptionStatus, isLoading: isLoadingSubscription } = useSubscriptionStore()

  const handleSignOut = async () => {
    const currentUrl = window.location.pathname
    await signOut({ callbackUrl: currentUrl })
  }

  const getSubscriptionBadge = () => {
    if (isLoadingSubscription || !subscriptionStatus) return null
    const plan = subscriptionStatus.subscriptionPlan as "PRO" | "BASIC" | "FREE"
    return <Badge variant={plan === "PRO" ? "default" : plan === "BASIC" ? "secondary" : "outline"}>{plan}</Badge>
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
            <div className="flex flex-col space-y-1 leading-none p-2">
              {session.user?.name && <p className="font-medium">{session.user.name}</p>}
              {session.user?.email && (
                <p className="w-[200px] truncate text-sm text-muted-foreground">{session.user.email}</p>
              )}
              {getSubscriptionBadge()}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/subscription" className="flex items-center">
                <Crown className="mr-2 h-4 w-4" />
                <span>Subscription</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

