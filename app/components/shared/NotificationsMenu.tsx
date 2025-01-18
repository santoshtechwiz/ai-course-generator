'use client'

import * as React from "react"
import { Weight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useQuery } from '@tanstack/react-query'
import { useUser } from "@/app/providers/userContext"


interface NotificationsMenuProps {
  initialCount: number;
}

export default function NotificationsMenu({ initialCount = 0 }: NotificationsMenuProps) {
  const { toast } = useToast()
  const { user, loading: isLoading, error } = useUser();
  console.log(user);

  const displayCount = React.useMemo(() => {
    return (user?.credits ?? 0) > 99 ? '99+' : (user?.credits ?? 0).toString()
  }, [user?.credits])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={`Notifications: ${displayCount} credits`}
    >
      <Weight className="h-5 w-5" />
      {!error && !isLoading && (
        <span
          className={`absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white rounded-full transition-all duration-300 ${parseInt(displayCount) > 0 ? 'bg-red-500' : 'bg-gray-400'
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
