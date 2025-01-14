'use client'

import * as React from "react"
import { Weight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useQuery } from '@tanstack/react-query'

interface NotificationsMenuClientProps {
  initialCount: number;
}

export default function NotificationsMenu({ initialCount =0}: NotificationsMenuClientProps) {
  const [hasNewNotifications, setHasNewNotifications] = React.useState(false)
  const { toast } = useToast()

  const { data, isLoading, error } = useQuery({
    queryKey: ['creditCount'],
    queryFn: async () => {
      const response = await fetch('/api/token-notifications')
      if (!response.ok) {
        throw new Error('Failed to fetch credit count')
      }
      return response.json()
    },
    initialData: { count: initialCount },
    refetchInterval: 5000 * 10, // Refetch every 15 seconds
  })

  React.useEffect(() => {
    if (data.count > initialCount) {
      setHasNewNotifications(true)
      toast({
        title: "Credits Updated",
        description: `Your credit count has been updated to ${data.count}.`,
      })
    }
  }, [data.count, initialCount, toast])

  const handleClick = () => {
    setHasNewNotifications(false)
    // Implement logic to open notifications panel or navigate to notifications page
  }

  const displayCount = React.useMemo(() => {
    return data.count > 99 ? '99+' : data.count.toString()
  }, [data.count])

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="relative" 
      onClick={handleClick}
      disabled={isLoading || !!error}
    >
      <Weight className="h-5 w-5" />
      {!error && (
        <span 
          className={`absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white rounded-full transition-all duration-300 ${
            parseInt(displayCount) > 0 
              ? hasNewNotifications 
                ? 'bg-red-500 animate-pulse' 
                : 'bg-red-500' 
              : 'bg-gray-400'
          }`}
        >
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

