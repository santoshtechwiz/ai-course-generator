'use client'

import { VideoProgress } from '@/app/types'
import { useCallback, useState, useEffect, useRef } from 'react'


interface VideoState {
  selectedVideoId: string
  currentTime: number
  isVideoCompleted: boolean
}

const useVideoProgress = (
  initialVideoId: string | undefined,
  courseId: string | undefined,
  chapterId: number | undefined,
  onProgressUpdate?: (progress: VideoProgress) => void
) => {
  const [state, setState] = useState<VideoState>({
    selectedVideoId: initialVideoId || '',
    currentTime: 0,
    isVideoCompleted: false
  })
  const progressCheckInterval = useRef<NodeJS.Timeout>()
  const isInitialMount = useRef(true)

  const getStorageKey = useCallback((type: 'video' | 'time' | 'completed') => {
    if (!courseId || !chapterId) return null
    return `course_${courseId}_chapter_${chapterId}_${type}`
  }, [courseId, chapterId])

  // Load initial state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !courseId || !chapterId) return

    const videoKey = getStorageKey('video')
    const timeKey = getStorageKey('time')
    const completedKey = getStorageKey('completed')

    if (!videoKey || !timeKey || !completedKey) return

    // Only load from localStorage on initial mount
    if (isInitialMount.current) {
      const savedVideoId = localStorage.getItem(videoKey)
      const savedTime = localStorage.getItem(timeKey)
      const savedCompleted = localStorage.getItem(completedKey)

      setState(prev => ({
        selectedVideoId: savedVideoId || prev.selectedVideoId,
        currentTime: savedTime ? parseFloat(savedTime) : prev.currentTime,
        isVideoCompleted: savedCompleted ? JSON.parse(savedCompleted) : prev.isVideoCompleted
      }))

      isInitialMount.current = false
    }

    // Cleanup function for old progress data
    const cleanupOldProgress = () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('course_')) {
          const timestamp = localStorage.getItem(`${key}_timestamp`)
          if (timestamp && new Date(timestamp) < thirtyDaysAgo) {
            localStorage.removeItem(key)
            localStorage.removeItem(`${key}_timestamp`)
          }
        }
      })
    }
    
    cleanupOldProgress()
  }, [courseId, chapterId, getStorageKey])

  // Update state when initialVideoId changes
  useEffect(() => {
    if (initialVideoId !== undefined && initialVideoId !== state.selectedVideoId) {
      setState(prev => ({
        ...prev,
        selectedVideoId: initialVideoId,
        currentTime: 0,
        isVideoCompleted: false
      }))
    }
  }, [initialVideoId])

  const updateSelectedVideoId = useCallback((newVideoId: string) => {
    if (typeof window === 'undefined') return

    const videoKey = getStorageKey('video')
    const timeKey = getStorageKey('time')
    const completedKey = getStorageKey('completed')

    if (!videoKey || !timeKey || !completedKey) return

    setState(prev => ({
      ...prev,
      selectedVideoId: newVideoId,
      currentTime: 0,
      isVideoCompleted: false
    }))

    localStorage.setItem(videoKey, newVideoId)
    localStorage.setItem(timeKey, '0')
    localStorage.setItem(completedKey, 'false')
    localStorage.setItem(`${videoKey}_timestamp`, new Date().toISOString())

    onProgressUpdate?.({
      videoId: newVideoId,
      timestamp: 0,
      completed: false
    })
  }, [getStorageKey, onProgressUpdate])

  const updateCurrentTime = useCallback((newTime: number) => {
    if (typeof window === 'undefined' || !state.selectedVideoId) return

    const timeKey = getStorageKey('time')
    if (!timeKey) return

    setState(prev => ({
      ...prev,
      currentTime: newTime
    }))

    localStorage.setItem(timeKey, newTime.toString())

    // Clear existing interval
    if (progressCheckInterval.current) {
      clearInterval(progressCheckInterval.current)
    }

    // Set up new interval to check progress
    progressCheckInterval.current = setInterval(() => {
      const videoElement = document.querySelector('video')
      if (videoElement) {
        const progress = newTime / videoElement.duration
        if (progress >= 0.9 && !state.isVideoCompleted) {
          const completedKey = getStorageKey('completed')
          if (completedKey) {
            setState(prev => ({
              ...prev,
              isVideoCompleted: true
            }))
            localStorage.setItem(completedKey, 'true')
            onProgressUpdate?.({
              videoId: state.selectedVideoId,
              timestamp: newTime,
              completed: true
            })
          }
          // Clear interval after completion
          if (progressCheckInterval.current) {
            clearInterval(progressCheckInterval.current)
          }
        }
      }
    }, 1000)

    // Notify progress update
    onProgressUpdate?.({
      videoId: state.selectedVideoId,
      timestamp: newTime,
      completed: state.isVideoCompleted
    })
  }, [getStorageKey, state.selectedVideoId, state.isVideoCompleted, onProgressUpdate])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressCheckInterval.current) {
        clearInterval(progressCheckInterval.current)
      }
    }
  }, [])

  return {
    selectedVideoId: state.selectedVideoId,
    currentTime: state.currentTime,
    isVideoCompleted: state.isVideoCompleted,
    setIsVideoCompleted: (completed: boolean) => 
      setState(prev => ({ ...prev, isVideoCompleted: completed })),
    updateSelectedVideoId,
    updateCurrentTime,
  }
}

export default useVideoProgress

