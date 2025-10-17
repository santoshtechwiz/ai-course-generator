/**
 * Unified Quiz Data Caching Hook
 * 
 * COMMIT: Standardized React Query configuration for all quiz types
 */
import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query'

export const QUIZ_CACHE_CONFIG = {
  STALE_TIME: 5 * 60 * 1000,      // 5 minutes - reduce redundant API calls
  GC_TIME: 30 * 60 * 1000,         // 30 minutes - keep in cache longer
  RETRY_COUNT: 2,                  // Retry failed requests twice
  RETRY_DELAY: 1000,               // 1 second between retries
} as const

/**
 * Unified hook for fetching quiz data with consistent caching
 * 
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useQuizData(
 *   ['quiz', quizId],
 *   () => fetchQuiz(quizId)
 * )
 * ```
 */
export function useQuizData<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: Partial<UseQueryOptions<T, Error>>
) {
  return useQuery<T, Error>({
    queryKey,
    queryFn,
    staleTime: QUIZ_CACHE_CONFIG.STALE_TIME,
    gcTime: QUIZ_CACHE_CONFIG.GC_TIME,
    retry: QUIZ_CACHE_CONFIG.RETRY_COUNT,
    retryDelay: QUIZ_CACHE_CONFIG.RETRY_DELAY,
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    refetchOnMount: false,        // Use cached data if available
    ...options
  })
}

/**
 * Hook for quiz attempts with more aggressive caching
 * 
 * Used for quiz history and statistics that don't change frequently
 */
export function useQuizHistory<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: Partial<UseQueryOptions<T, Error>>
) {
  return useQuery<T, Error>({
    queryKey,
    queryFn,
    staleTime: 10 * 60 * 1000,    // 10 minutes - history changes slowly
    gcTime: 60 * 60 * 1000,        // 1 hour - keep longer
    retry: QUIZ_CACHE_CONFIG.RETRY_COUNT,
    retryDelay: QUIZ_CACHE_CONFIG.RETRY_DELAY,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options
  })
}

/**
 * Hook for real-time quiz data that needs frequent updates
 * 
 * Used for active quiz sessions, due flashcards, etc.
 */
export function useQuizRealtime<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: Partial<UseQueryOptions<T, Error>>
) {
  return useQuery<T, Error>({
    queryKey,
    queryFn,
    staleTime: 30 * 1000,          // 30 seconds - more frequent updates
    gcTime: 5 * 60 * 1000,         // 5 minutes
    retry: QUIZ_CACHE_CONFIG.RETRY_COUNT,
    retryDelay: QUIZ_CACHE_CONFIG.RETRY_DELAY,
    refetchOnWindowFocus: true,    // Refresh when tab becomes active
    refetchOnMount: true,          // Always get fresh data on mount
    ...options
  })
}

/**
 * Cache key builders for consistent query keys
 */
export const quizCacheKeys = {
  all: ['quizzes'] as const,
  quiz: (id: string | number) => ['quiz', id] as const,
  attempts: (userId: string, quizId?: string | number) => 
    quizId ? ['quiz-attempts', userId, quizId] : ['quiz-attempts', userId] as const,
  stats: (userId: string) => ['quiz-stats', userId] as const,
  progress: (userId: string, type?: string) => 
    type ? ['quiz-progress', userId, type] : ['quiz-progress', userId] as const,
  dueCards: (userId: string) => ['due-cards', userId] as const,
  flashcardStats: (userId: string) => ['flashcard-stats', userId] as const,
  badges: (userId: string) => ['badges', userId] as const,
  streak: (userId: string) => ['streak', userId] as const,
}
