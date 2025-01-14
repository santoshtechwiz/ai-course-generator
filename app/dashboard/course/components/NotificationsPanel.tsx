'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Notification {
  id: string
  message: string
  timestamp: string
  type: 'quiz' | 'course'
}

export default function NotificationsPanel({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?userId=${userId}`)
        if (!response.ok) throw new Error('Failed to fetch notifications')
        const data = await response.json()
        setNotifications(data)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    fetchNotifications()
  }, [userId])

  const togglePanel = () => setIsOpen(!isOpen)

  return (
    <div className="relative">
      <Button onClick={togglePanel} variant="outline" size="icon">
        <Bell className="h-4 w-4" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
        )}
      </Button>
      {isOpen && (
        <Card className="absolute right-0 mt-2 w-64 p-4 z-10">
          <h3 className="font-bold mb-2">Recent Activity</h3>
          {notifications.length === 0 ? (
            <p>No recent activity</p>
          ) : (
            <ul className="space-y-2">
              {notifications.map(notification => (
                <li key={notification.id} className="text-sm">
                  <p>{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  )
}

