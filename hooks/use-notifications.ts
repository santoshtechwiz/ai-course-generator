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

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  // Count of unread notifications
  const unreadCount = notifications.filter(n => !n.read).length

  // Simulate fetching notifications from "memory"
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // Use mock data
      setNotifications(mockNotifications)
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
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

  const markAsRead = useCallback(async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 200))

    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )

    toast({ title: "Notification marked as read" })
    return true
  }, [toast])

  const deleteNotification = useCallback(async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 200))

    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    )

    toast({ title: "Notification deleted" })
    return true
  }, [toast])

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
    markAllAsRead,
    markAsRead,
    deleteNotification
  }
}
