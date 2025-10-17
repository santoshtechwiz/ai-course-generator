"use client"

/**
 * Notification Bell - Redesigned
 * 
 * Features:
 * - Fetches from real API endpoint
 * - Theme-aware colors
 * - Optimized performance with SWR
 * - Proper shadcn components
 */

import { useState } from "react"
import { Bell, Trophy, Flame, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import useSWR from "swr"

interface Notification {
  id: string
  type: "badge" | "streak" | "achievement"
  title: string
  description: string
  icon: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

interface NotificationBellProps {
  userId: string
  className?: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function NotificationBell({ userId, className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const { data, error, isLoading, mutate } = useSWR<{
    notifications: Notification[]
    unreadCount: number
  }>(
    userId ? '/api/notifications' : null,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true
    }
  )

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })
      mutate()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'trophy':
        return <Trophy className="h-4 w-4 text-amber-500" />
      case 'flame':
        return <Flame className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-primary" />
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("relative h-9 w-9", className)}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 pb-2">
          <DropdownMenuLabel className="p-0 text-base font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>

        <Separator />

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="rounded-full bg-destructive/10 p-3 mb-3">
                <X className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">
                Failed to load notifications
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll notify you when something happens
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.actionUrl || '#'}
                  onClick={() => {
                    markAsRead(notification.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex gap-3 p-4 hover:bg-muted/50 transition-colors",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.icon)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.timestamp), { 
                        addSuffix: true 
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/dashboard/notifications">
                  View all notifications
                </Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
