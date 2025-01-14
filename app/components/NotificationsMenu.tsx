'use client'

import * as React from "react"
import { Weight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useMemo } from "react"

// Utility function for debouncing
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export default function NotificationsMenu() {
  const [count, setCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isSignedIn, setIsSignedIn] = React.useState(true)

  const fetchNotificationCount = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/get-token-balance')
      if (!response.ok) {
        if (response.status === 401) {
          setIsSignedIn(false)
          setCount(0)
          return
        }
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      setCount(data.tokens !== undefined ? data.tokens : 0)
      setIsSignedIn(true)
    } catch (error) {
      console.error('Error fetching token balance:', error)
      setError('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced version of fetchNotificationCount
  const debouncedFetchNotificationCount = React.useMemo(
    () => debounce(fetchNotificationCount, 300),
    [fetchNotificationCount]
  )

  React.useEffect(() => {
    debouncedFetchNotificationCount()

    const intervalId = setInterval(debouncedFetchNotificationCount, 5 * 60 * 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [debouncedFetchNotificationCount])

  const displayCount = useMemo(() => {
    if (!isSignedIn || isLoading) return 0
    return count > 99 ? '99+' : count
  }, [count, isSignedIn, isLoading])

  return (
    <Button variant="ghost" size="icon" className="relative">
      <Weight className="h-5 w-5" />
      {!error && (
        <span className={`absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white rounded-full ${displayCount > 0 ? 'bg-red-500' : 'bg-gray-400'}`}>
          {displayCount}
        </span>
      )}
      {isLoading && (
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full animate-pulse" />
      )}
      {error && (
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
      )}
    </Button>
  )
}
