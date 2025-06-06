import { useState, useCallback } from "react"
import { useToast } from "./use-toast"

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt?: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Replace with your actual API call
      const response = await fetch("/api/notifications")
      
      if (!response.ok) {
        throw new Error(`Error fetching notifications: ${response.status}`)
      }
      
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      // Replace with your actual API call
      const response = await fetch("/api/notifications/read-all", {
        method: "POST"
      })
      
      if (!response.ok) {
        throw new Error(`Failed to mark all as read: ${response.status}`)
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      )
      
      return true
    } catch (err) {
      console.error("Failed to mark all as read:", err)
      throw err
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    try {
      // Replace with your actual API call
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST"
      })
      
      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`)
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      )
      
      return true
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read:`, err)
      throw err
    }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      // Replace with your actual API call
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE"
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status}`)
      }
      
      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== id))
      
      return true
    } catch (err) {
      console.error(`Failed to delete notification ${id}:`, err)
      throw err
    }
  }, [])

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
