"use client"

import useSWR from 'swr'
import { getUserLearningActivity } from '@/app/actions/getLearningActivity'
import { getUserProgressOverview } from '@/app/actions/getProgressOverview'
import { getUserQuizPerformance } from '@/app/actions/getQuizPerformance'

// Common SWR configuration
const SWR_CONFIG = {
  revalidateOnFocus: false,
  shouldRetryOnError: true,
  errorRetryCount: 2
}

export function useLearningActivity(userId: string) {
  return useSWR(
    userId ? ['learningActivity', userId] : null,
    () => getUserLearningActivity(userId),
    {
      ...SWR_CONFIG,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export function useProgressOverview(userId: string) {
  return useSWR(
    userId ? ['progressOverview', userId] : null,
    () => getUserProgressOverview(userId),
    {
      ...SWR_CONFIG,
      refreshInterval: 10 * 60 * 1000, // 10 minutes
    }
  )
}

export function useQuizPerformance(userId: string) {
  return useSWR(
    userId ? ['quizPerformance', userId] : null,
    () => getUserQuizPerformance(userId),
    {
      ...SWR_CONFIG,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
    }
  )
}
