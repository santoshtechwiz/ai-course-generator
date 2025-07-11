

"use client"

import type { DashboardUser, UserStats } from "@/app/types/types"
import useSWR from "swr"

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    const error = new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`)
    throw error
  }
  
  return res.json()
}

export function useUserData(userId: string) {
  const { data, error, isLoading, mutate } = useSWR<DashboardUser>(
    userId ? `/api/dashboard/user/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      shouldRetryOnError: false, // Don't retry on auth errors
      onError: (error) => {
        console.error('useUserData error:', error, 'for userId:', userId)
      }
    },
  )

  return {
    data,
    isLoading,
    error,
    mutate,
  }
}

export function useUserStats(userId: string, options?: { enabled?: boolean; staleTime?: number }) {
  const { data, error, isLoading, mutate } = useSWR<UserStats>(
    userId && options?.enabled !== false ? `/api/dashboard/stats/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
      shouldRetryOnError: false,
      onError: (error) => {
        console.error('useUserStats error:', error, 'for userId:', userId)
      }
    },
  )

  return {
    data,
    isLoading,
    error,
    mutate,
  }
}
