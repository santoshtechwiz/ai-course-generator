import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { RecommendationsService } from "@/app/services/recommendations/RecommendationsService"

interface UseRecommendationsOptions {
  enabled?: boolean
  refetchInterval?: number
}

export function useRecommendations(options: UseRecommendationsOptions = {}) {
  const {
    enabled = true,
    refetchInterval = 60 * 60 * 1000 // 60 minutes (increased from 30)
  } = options

  return useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await fetch('/api/recommendations')
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }
      return response.json()
    },
    enabled,
    refetchInterval,
    staleTime: 45 * 60 * 1000, // 45 minutes (increased from 25)
    gcTime: 120 * 60 * 1000, // 2 hours (increased from 1)
  })
}

export function useInvalidateRecommendations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invalidate_cache' })
      })
      if (!response.ok) {
        throw new Error('Failed to invalidate cache')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    }
  })
}

export function useUpdateUserActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (activityData: any) => {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_activity',
          data: activityData
        })
      })
      if (!response.ok) {
        throw new Error('Failed to update activity')
      }
      return response.json()
    },
    onSuccess: () => {
      // Invalidate recommendations to get fresh ones
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    }
  })
}

// Helper hook for getting recommendations with loading states
export function useSmartRecommendations() {
  const { data, isLoading, error, refetch } = useRecommendations()
  const invalidate = useInvalidateRecommendations()

  return {
    recommendations: data?.recommendations || [],
    count: data?.count || 0,
    message: data?.message,
    error: data?.error,
    isLoading,
    refetch,
    invalidateCache: invalidate.mutate,
    isInvalidating: invalidate.isPending
  }
}
