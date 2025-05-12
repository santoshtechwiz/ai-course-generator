// import { useQuery } from "@tanstack/react-query"
// import { getUserData, getUserStats } from "@/app/actions/userDashboard"

// export function useUserData(userId: string) {
//   return useQuery({
//     queryKey: ["userData", userId],
//     queryFn: () => getUserData(userId),
//     staleTime: 1000 * 60 * 5, // 5 minutes
//   })
// }

// export function useUserStats(userId: string) {
//   return useQuery({
//     queryKey: ["userStats", userId],
//     queryFn: () => getUserStats(userId),
//     staleTime: 1000 * 60 * 5, // 5 minutes
//   })
// }

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

export function useUserStats(userId: string) {
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
