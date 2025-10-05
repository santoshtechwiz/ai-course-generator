'use client'
import { useState, useCallback, useEffect } from "react"
import { useToast } from "./use-toast"

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt?: string
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Welcome!",
    message: "Thanks for joining.",
    read: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    title: "Update",
    message: "We’ve just launched a new feature.",
    read: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    title: "Reminder",
    message: "Don’t forget to verify your email.",
    read: true,
    createdAt: new Date().toISOString()
  }
]

const CACHE_KEY = 'notifications_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheEntry {
  data: Notification[]
  timestamp: number
}

function getCachedNotifications(): Notification[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const { data, timestamp }: CacheEntry = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    return data
  } catch {
    return null
  }
}

function cacheNotifications(notifications: Notification[]) {
  try {
    const entry: CacheEntry = {
      data: notifications,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // Ignore cache errors
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => getCachedNotifications() || [])
  const [isLoading, setIsLoading] = useState<boolean>(!notifications.length)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  // Count of unread notifications
  const unreadCount = notifications.filter(n => !n.read).length

  // Load notifications from API with caching
  const fetchNotifications = useCallback(async (force: boolean = false) => {
    // Return cached data if available and not forced
    if (!force && notifications.length > 0) {
      return notifications
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/notifications')
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`)
      }
      
      const data = await response.json()
      setNotifications(data)
      cacheNotifications(data)
      return data
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return notifications // Return current state on error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 200))

    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )

    toast({ title: "All notifications marked as read" })
    return true
  }, [toast])

  // Mark notifications as read (single or batch)
  const markAsRead = useCallback(async (ids: string | string[]) => {
    const notificationIds = Array.isArray(ids) ? ids : [ids]
    
    try {
      // Optimistic update
      setNotifications(current =>
        current.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      )

      // Batch update API call
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: notificationIds })
      })

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read')
      }

      // Update cache
      const updatedNotifications = notifications.map(notification =>
        notificationIds.includes(notification.id)
          ? { ...notification, read: true }
          : notification
      )
      cacheNotifications(updatedNotifications)

      toast({
        title: "Success",
        description: notificationIds.length > 1 
          ? "Notifications marked as read"
          : "Notification marked as read",
      })
    } catch (err) {
      console.error("Failed to mark notifications as read:", err)
      
      // Revert optimistic update on error
      setNotifications(current =>
        current.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, read: false }
            : notification
        )
      )

      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      })
    }
  }, [notifications, toast])

  // Delete notifications (single or batch)
  const deleteNotifications = useCallback(async (ids: string | string[]) => {
    const notificationIds = Array.isArray(ids) ? ids : [ids]
    const notificationsToDelete = notifications.filter(n => notificationIds.includes(n.id))
    
    try {
      // Optimistic update
      setNotifications(current =>
        current.filter(notification => !notificationIds.includes(notification.id))
      )

      // Batch delete API call
      const response = await fetch('/api/notifications/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: notificationIds })
      })

      if (!response.ok) {
        throw new Error('Failed to delete notifications')
      }

      // Update cache
      cacheNotifications(notifications.filter(n => !notificationIds.includes(n.id)))

      toast({
        title: "Success",
        description: notificationIds.length > 1 
          ? "Notifications deleted"
          : "Notification deleted",
      })
    } catch (err) {
      console.error("Failed to delete notifications:", err)
      
      // Revert optimistic update on error
      setNotifications(current => [...current, ...notificationsToDelete])

      toast({
        title: "Error",
        description: "Failed to delete notifications",
        variant: "destructive",
      })
    }
  }, [notifications, toast])

  // Optional: Auto-fetch on mount
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    deleteNotifications,
    // Alias for backward compatibility
    deleteNotification: (id: string) => deleteNotifications(id)
  }
}
