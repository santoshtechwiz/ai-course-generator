"use client"

import React, { useState, useEffect } from "react"
import { Bell, Check, Loader2, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/tailwindUtils"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface NotificationsMenuProps {
  className?: string
}

export default function NotificationsMenu({ className }: NotificationsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications()

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchNotifications()
      toast({
        title: "Notifications refreshed",
        description: "Your notifications have been updated.",
      })
    } catch (error) {
      toast({
        title: "Failed to refresh",
        description: "Could not refresh notifications.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleOpen = (open: boolean) => {
    setIsOpen(open)

    if (open) {
      // If we're opening the menu, refresh notifications
      handleRefresh()
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead()
      toast({
        title: "Success",
        description: "All notifications marked as read.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read.",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id)
      toast({
        title: "Notification deleted",
        description: "The notification has been removed.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive",
      })
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative h-8 w-8 rounded-full", className)}
          aria-label="Open notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DropdownMenuLabel className="font-normal">Notifications</DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="sr-only">Refresh notifications</span>
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8"
                onClick={handleMarkAllRead}
                disabled={refreshing || isLoading}
              >
                <Check className="h-3 w-3 mr-1" /> Mark all as read
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-muted-foreground">
            <p>Failed to load notifications</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
              Try again
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p>No notifications yet</p>
          </div>
        ) : (
          <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
            {notifications.map((notification) => (
              <div key={notification.id}>
                <DropdownMenuItem
                  className={cn("p-4 cursor-default focus:bg-accent", !notification.read && "bg-accent/50")}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex flex-col space-y-1 flex-1">
                    <p className={cn("text-sm", !notification.read && "font-medium")}>{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {notification.createdAt
                          ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                          : "Just now"}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(notification.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">Delete notification</span>
                      </Button>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </div>
            ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
