import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export interface SubscriptionStatus {
  credits: number | null,
  isSubscribed: boolean
}

export function useSubscriptionStatus(): SubscriptionStatus | null {
  const { data: session, status: sessionStatus } = useSession()
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const user = session?.user
      if (user) {
        const isSubscribed = (user.credits ?? 0) > 0
        setStatus({
          credits: user.credits || null, // Assuming `user.subscription` contains subscription info
          isSubscribed,
        })
      } else {
        setStatus({ credits: 0, isSubscribed: false })
      }
    } else if (sessionStatus === 'unauthenticated') {
      setStatus({ credits: null, isSubscribed: false })
    }
  }, [session, sessionStatus])

  return status
}
