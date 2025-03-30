"use client"

import type { MouseEvent } from "react"
import { UserCog, CreditCard, Trash2, MoreHorizontal, Mail, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface UserCardProps {
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
    credits: number
    isAdmin: boolean
    userType: string
    lastActiveAt: string | null
    subscription?: {
      id: string
      status: string
      planId: string
    } | null
  }
  onEdit: () => void
}

export function UserCard({ user, onEdit }: UserCardProps) {
  const { toast } = useToast()

  // Get user initials for avatar fallback
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  // Format last active date
  const lastActive = user.lastActiveAt ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true }) : "Never"

  // Handle stopping propagation for action buttons
  const handleActionClick = (e: MouseEvent) => {
    e.stopPropagation() // Prevents triggering the card selection
  }

  // Handle edit user
  const handleEdit = (e: MouseEvent) => {
    e.stopPropagation()
    onEdit()
  }

  // Handle delete user
  const handleDelete = async (e: MouseEvent) => {
    e.stopPropagation()

    if (confirm(`Are you sure you want to delete ${user.name || "this user"}? This action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/users/${user.id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete user")
        }

        toast({
          title: "User deleted",
          description: "The user has been successfully deleted.",
        })

        // Dispatch event to refresh user list
        const event = new CustomEvent("user-changed")
        window.dispatchEvent(event)
      } catch (error) {
        console.error("Error deleting user:", error)
        toast({
          title: "Error",
          description: "Failed to delete user. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Handle reset subscription
  const handleResetSubscription = (e: MouseEvent) => {
    e.stopPropagation()

    // Dispatch custom event with user ID
    const event = new CustomEvent("reset-subscription", {
      detail: { userId: user.id },
    })
    window.dispatchEvent(event)
  }

  // Get subscription badge variant
  const getSubscriptionBadgeVariant = () => {
    if (!user.subscription) return "secondary"

    const status = user.subscription.status.toLowerCase()
    if (status === "active") return "default"
    if (status === "trialing") return "secondary"
    if (status === "canceled" || status === "cancelled") return "outline"
    if (status === "past_due") return "destructive"
    return "secondary"
  }

  // Get user type badge style
  const getUserTypeBadgeStyle = () => {
    switch (user.userType) {
      case "PREMIUM":
        return "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 border-none text-white"
      case "ULTIMATE":
        return "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600 border-none text-white"
      case "PRO":
        return "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 border-none text-white"
      case "BASIC":
        return "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 border-none text-white"
      default:
        return "bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-600 border-none text-white"
    }
  }

  return (
    <div
      className="grid grid-cols-12 gap-2 px-4 py-3 border-b transition-colors hover:bg-muted/30 group"
      onClick={handleEdit}
    >
      {/* User info - 4 columns */}
      <div className="col-span-4 flex items-center gap-3 overflow-hidden">
        <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-background shadow-sm group-hover:border-primary/20 transition-all duration-200">
          <AvatarImage src={user.image || ""} alt={user.name || "User"} />
          <AvatarFallback className="bg-gradient-to-br from-muted to-muted/50">{initials}</AvatarFallback>
        </Avatar>
        <div className="overflow-hidden">
          <div className="font-medium truncate flex items-center gap-2 text-foreground group-hover:text-primary transition-colors duration-200">
            {user.name || "Unnamed User"}
            {user.isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="ml-1 text-xs bg-amber-500/10 text-amber-500 border-amber-500/20"
                    >
                      Admin
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="bg-card text-card-foreground border-border shadow-md">
                    <p>Administrator account with full access</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="text-sm text-muted-foreground truncate flex items-center">
            <Mail className="h-3 w-3 mr-1 inline-block" />
            {user.email}
          </div>
        </div>
      </div>

      {/* User type - 2 columns */}
      <div className="col-span-2 flex items-center justify-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="default"
                className={cn(
                  "text-xs whitespace-nowrap shadow-sm transition-all duration-200",
                  getUserTypeBadgeStyle(),
                )}
              >
                {user.userType}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="bg-card text-card-foreground border-border shadow-md">
              <p>{user.userType} user account type</p>
              {user.subscription && <p className="text-xs mt-1">Subscription: {user.subscription.status}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Credits - 2 columns */}
      <div className="col-span-2 flex items-center justify-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 group-hover:bg-muted transition-all duration-200 border border-transparent group-hover:border-border/30">
                <CreditCard className="h-3.5 w-3.5 text-primary/70" />
                <span className="font-medium">{user.credits}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-card text-card-foreground border-border shadow-md">
              <p>User has {user.credits} credits available</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Actions - 4 columns */}
      <div className="col-span-4 flex items-center justify-end gap-2">
        <div className="text-xs text-muted-foreground flex items-center mr-2 bg-muted/30 px-2 py-1 rounded-full">
          <Calendar className="h-3.5 w-3.5 mr-1 text-primary/60" />
          {lastActive}
        </div>

        <div
          className="flex gap-2 items-center opacity-70 group-hover:opacity-100 transition-opacity duration-200"
          onClick={handleActionClick}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors duration-200"
                  onClick={handleEdit}
                >
                  <UserCog className="h-4 w-4 text-primary/80" />
                  <span className="sr-only">Edit user</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-card text-card-foreground border-border shadow-md">
                <p>Edit user details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors duration-200"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border shadow-md">
              <DropdownMenuLabel className="text-foreground">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem
                onClick={handleEdit}
                className="text-foreground hover:text-foreground focus:text-foreground"
              >
                <UserCog className="h-4 w-4 mr-2 text-primary/70" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleResetSubscription}
                className="text-foreground hover:text-foreground focus:text-foreground"
              >
                <CreditCard className="h-4 w-4 mr-2 text-primary/70" />
                Reset Subscription
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem
                className="text-destructive hover:text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

