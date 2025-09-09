"use client"

import { useState, useEffect } from 'react'
import useSWR from 'swr'

interface CourseProgress {
  courseId: string
  progressPercentage: number
  completedChapters: number
  totalChapters: number
  currentChapterId?: string
  currentChapterTitle?: string
  lastAccessedAt?: string
  timeSpent?: number
  isCompleted: boolean
}

interface CourseProgressMap {
  [courseId: string]: CourseProgress
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useCourseProgress(userId?: string) {
  const { data, error, isLoading, mutate } = useSWR<CourseProgressMap>(
    userId ? `/api/progress/course/user/${userId}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
    }
  )

  return {
    progressData: data || {},
    isLoading,
    error,
    refreshProgress: mutate,
  }
}

export function useCoursesWithProgress(courses: any[], userId?: string) {
  const { progressData, isLoading: progressLoading } = useCourseProgress(userId)

  const coursesWithProgress = courses.map((course) => {
    const progress = progressData[course.id] || progressData[course.slug]
    
    return {
      ...course,
      isEnrolled: !!progress,
      progressPercentage: progress?.progressPercentage || 0,
      completedChapters: progress?.completedChapters || 0,
      totalChapters: progress?.totalChapters || course.unitCount || 0,
      lastAccessedAt: progress?.lastAccessedAt,
      currentChapterTitle: progress?.currentChapterTitle,
      timeSpent: progress?.timeSpent || 0,
    }
  })

  return {
    courses: coursesWithProgress,
    isLoading: progressLoading,
  }
}
