

"use client"

import type { DashboardUser, UserStats } from "@/app/types/types"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useUserData(userId: string) {
  const { data, error, isLoading, mutate } = useSWR<DashboardUser>(
    userId ? `/api/dashboard/user/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    },
  )

  return {
    data,
    isLoading,
    error,
    mutate,
  }
}

export function useUserStats(userId: string, p0: unknown) {
  const { data, error, isLoading, mutate } = useSWR<UserStats>(
    userId ? `/api/dashboard/stats/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    },
  )

  return {
    data,
    isLoading,
    error,
    mutate,
  }
}
