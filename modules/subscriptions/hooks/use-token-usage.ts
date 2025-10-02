import { useCallback } from 'react'
import useSWR from 'swr'
import { TokenUsageService } from '../services/token-usage-service'
import { useAuth } from '@/modules/auth'

// Cache durations in milliseconds
const CACHE_DURATION = {
  TOKEN_USAGE: 30 * 1000, // 30 seconds
}

/**
 * Hook to manage token usage with SWR for efficient caching
 */
export const useTokenUsage = () => {
  const { user } = useAuth()
  const userId = user?.id

  // SWR fetcher function that calls our service
  const fetchTokenUsage = useCallback(async () => {
    if (!userId) return { used: 0, total: 0 }
    
    try {
      return await TokenUsageService.getTokenUsage(userId)
    } catch (error) {
      console.error('[useTokenUsage] Error fetching token usage:', error)
      return { used: 0, total: 0 }
    }
  }, [userId])

  // Use SWR for data fetching with caching
  const {
    data: tokenUsage,
    error,
    isLoading,
    isValidating,
    mutate: refreshTokenUsage
  } = useSWR(
    userId ? ['tokens', userId] : null,
    fetchTokenUsage,
    {
      dedupingInterval: 5000, // 5 seconds
      focusThrottleInterval: 10000,
      revalidateOnFocus: false,
      revalidateIfStale: true,
      refreshInterval: CACHE_DURATION.TOKEN_USAGE,
    }
  )

  // Function to update token usage
  const updateTokenUsage = useCallback(async (tokensUsed: number) => {
    if (!userId) return false
    
    try {
      await TokenUsageService.updateTokenUsage(userId, tokensUsed)
      await refreshTokenUsage() // Refresh the data after update
      return true
    } catch (error) {
      console.error('[useTokenUsage] Error updating token usage:', error)
      return false
    }
  }, [userId, refreshTokenUsage])
  
  // Function to add tokens
  const addTokens = useCallback(async (tokens: number) => {
    if (!userId) return false
    
    try {
      await TokenUsageService.addTokens(userId, tokens)
      await refreshTokenUsage() // Refresh the data after update
      return true
    } catch (error) {
      console.error('[useTokenUsage] Error adding tokens:', error)
      return false
    }
  }, [userId, refreshTokenUsage])
  
  // Function to reset token usage
  const resetTokenUsage = useCallback(async () => {
    if (!userId) return false
    
    try {
      await TokenUsageService.resetTokenUsage(userId)
      await refreshTokenUsage() // Refresh the data after update
      return true
    } catch (error) {
      console.error('[useTokenUsage] Error resetting token usage:', error)
      return false
    }
  }, [userId, refreshTokenUsage])

  return {
    tokensUsed: tokenUsage?.used || 0,
    totalTokens: tokenUsage?.total || 0,
    tokenUsage: tokenUsage || { used: 0, total: 0 },
    isLoading,
    isRefreshing: isValidating && !isLoading,
    error,
    updateTokenUsage,
    addTokens,
    resetTokenUsage,
    refreshTokenUsage
  }
}