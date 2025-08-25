"use client"

import { useQuery } from "@tanstack/react-query"
import type { DashboardUser, UserStats } from "@/app/types/types"

/**
 * Fetch user data from the API
 * @param userId User ID
 * @returns User data
 */
async function fetchUserData(userId: string): Promise<DashboardUser> {
  const response = await fetch(`/api/dashboard/user/${userId}`)
  if (!response.ok) {
    throw new Error("Failed to fetch user data")
  }
  return response.json()
}

/**
 * Fetch user stats from the API
 * @param userId User ID
 * @returns User stats
 */
async function fetchUserStats(userId: string): Promise<UserStats> {
  const response = await fetch(`/api/dashboard/stats/${userId}`)
  if (!response.ok) {
    throw new Error("Failed to fetch user stats")
  }
  return response.json()
}

/**
 * Hook to fetch and manage user data
 * @param userId User ID
 * @returns Query result with user data
 */
export function useUserData(userId: string | undefined) {
  return useQuery({
    queryKey: ["userData", userId],
    queryFn: () => (userId ? fetchUserData(userId) : Promise.reject("No user ID provided")),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })
}

/**
 * Hook to fetch and manage user stats
 * @param userId User ID
 * @returns Query result with user stats
 */
export function useUserStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["userStats", userId],
    queryFn: () => (userId ? fetchUserStats(userId) : Promise.reject("No user ID provided")),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })
}

// Export aliases for backward compatibility
export const useUserDashboard = { useUserData, useUserStats }
export default useUserDashboard

// Example usage in async actions:
// await withLoading(apiCall())
