"use client"

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const checkAuthBeforeAction = useCallback(async () => {
    if (status !== 'authenticated') {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue",
        variant: "destructive",
      })
      router.push('/auth/signin')
      return false
    }
    return true
  }, [status, router, toast])

  return {
    isAuthenticated: status === 'authenticated',
    user: session?.user || null,
    checkAuthBeforeAction,
  }
}
