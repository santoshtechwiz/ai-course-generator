// File: hooks/useSubscriptionStatus.ts
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export interface SubscriptionStatus {
  credits: number
  isSubscribed: boolean
}

export function useSubscriptionStatus(): SubscriptionStatus | null {
  const { data: session, status: sessionStatus } = useSession()
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user) {
      const credits = session.user.credits ?? 0
      setStatus({
        credits,
        isSubscribed: credits > 0,
      })
    } else if (sessionStatus === 'unauthenticated') {
      setStatus({ credits: 0, isSubscribed: false })
    }
  }, [session, sessionStatus])

  return status
}