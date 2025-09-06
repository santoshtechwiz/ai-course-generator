import { useQuery } from '@tanstack/react-query'
import { getUserLearningActivity } from '@/app/actions/getLearningActivity'
import { getUserProgressOverview } from '@/app/actions/getProgressOverview'
import { getUserQuizPerformance } from '@/app/actions/getQuizPerformance'

export function useLearningActivity(userId: string) {
  return useQuery({
    queryKey: ['learningActivity', userId],
    queryFn: () => getUserLearningActivity(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

export function useProgressOverview(userId: string) {
  return useQuery({
    queryKey: ['progressOverview', userId],
    queryFn: () => getUserProgressOverview(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  })
}

export function useQuizPerformance(userId: string) {
  return useQuery({
    queryKey: ['quizPerformance', userId],
    queryFn: () => getUserQuizPerformance(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}
