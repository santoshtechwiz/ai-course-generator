"use client"

import type React from "react"

import { MoreVertical, CreditCard, UserCog, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { User } from "@/app/types/types"
import { useToast } from "@/hooks/use-toast"
import { deleteUser } from "@/lib/db"


interface UserCardProps {
  user: User
  isSelected: boolean
  onSelect: () => void
}

export function UserCard({ user, isSelected, onSelect }: UserCardProps) {
  const { toast } = useToast()

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  const lastActive = user.lastActiveAt ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true }) : "Never"

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the card click from firing
    onSelect()
    // Signal to the form that we want to edit this user
    const event = new CustomEvent("edit-user", { detail: { userId: user.id } })
    window.dispatchEvent(event)
  }

  const handleAdjustCredits = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the card click from firing
    onSelect()
    // Signal to the form that we want to focus on credits tab
    const event = new CustomEvent("adjust-credits", { detail: { userId: user.id } })
    window.dispatchEvent(event)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the card click from firing
    if (confirm(`Are you sure you want to delete ${user.name || "this user"}?`)) {
      try {
        // Call the server action to delete the user
        const result = await deleteUser(user.id)

        if (result.success) {
          toast({
            title: "User deleted",
            description: `${user.name || "User"} has been deleted successfully.`,
          })

          // Dispatch event to refresh user list
          const event = new CustomEvent("user-changed")
          window.dispatchEvent(event)
        } else {
          throw new Error(result.error || "Failed to delete user")
        }
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

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
        isSelected ? "bg-muted border-primary" : "hover:bg-muted/50",
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user.image || ""} alt={user.name || "User"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium flex items-center gap-2">
            {user.name || "Unnamed User"}
            {user.isAdmin && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">
                Admin
              </Badge>
            )}
            {user.userType !== "Free" && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                {user.userType}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-xs text-muted-foreground hidden sm:block">{lastActive}</div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <UserCog className="mr-2 h-4 w-4" />
              <span>Edit User</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAdjustCredits}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Adjust Credits</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

