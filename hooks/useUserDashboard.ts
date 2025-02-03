import { useQuery } from "@tanstack/react-query"
import { getUserData, getUserStats } from "@/app/actions/userDashboard"

export function useUserData(userId: string) {
  return useQuery({
    queryKey: ["userData", userId],
    queryFn: () => getUserData(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useUserStats(userId: string) {
  return useQuery({
    queryKey: ["userStats", userId],
    queryFn: () => getUserStats(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

