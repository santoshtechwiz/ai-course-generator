"use client"

import type { DashboardUser, UserStats } from "@/app/types/types"
import { useEffect } from "react"
import useSWR from "swr"
import { CACHE_EVENTS } from "@/utils/cache-invalidation"

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
      revalidateOnReconnect: true,
      dedupingInterval: 120000, // 2 minutes - prevents duplicate calls
      shouldRetryOnError: false, // Don't retry on auth errors
      onError: (error) => {
        console.error('useUserData error:', error, 'for userId:', userId)
      }
    },
  )
  
  // Listen for cache invalidation events to trigger immediate refetch
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleQuizCompleted = () => {
      console.log('[useUserData] Quiz completed event received, revalidating user data...')
      mutate()
    }
    
    const handleCourseProgress = () => {
      console.log('[useUserData] Course progress updated event received, revalidating user data...')
      mutate()
    }
    
    const handleUserDataUpdated = () => {
      console.log('[useUserData] User data updated event received, revalidating...')
      mutate()
    }
    
    window.addEventListener(CACHE_EVENTS.QUIZ_COMPLETED, handleQuizCompleted)
    window.addEventListener(CACHE_EVENTS.COURSE_PROGRESS_UPDATED, handleCourseProgress)
    window.addEventListener(CACHE_EVENTS.USER_DATA_UPDATED, handleUserDataUpdated)
    
    return () => {
      window.removeEventListener(CACHE_EVENTS.QUIZ_COMPLETED, handleQuizCompleted)
      window.removeEventListener(CACHE_EVENTS.COURSE_PROGRESS_UPDATED, handleCourseProgress)
      window.removeEventListener(CACHE_EVENTS.USER_DATA_UPDATED, handleUserDataUpdated)
    }
  }, [mutate])

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
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes (increased from 5)
      shouldRetryOnError: false,
      onError: (error) => {
        console.error('useUserStats error:', error, 'for userId:', userId)
      }
    },
  )
  
  // Listen for cache invalidation events to trigger stats refetch
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleQuizCompleted = () => {
      console.log('[useUserStats] Quiz completed event received, revalidating stats...')
      mutate()
    }
    
    window.addEventListener(CACHE_EVENTS.QUIZ_COMPLETED, handleQuizCompleted)
    
    return () => {
      window.removeEventListener(CACHE_EVENTS.QUIZ_COMPLETED, handleQuizCompleted)
    }
  }, [mutate])

  return {
    data,
    isLoading,
    error,
    mutate,
  }
}
