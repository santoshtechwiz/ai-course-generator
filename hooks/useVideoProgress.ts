"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useSession } from "next-auth/react"

import {
  setVideoProgress,
  setCourseCompletionStatus,
  setResumePoint,
  setLastPlayedAt,
} from "@/store/slices/course-slice"
import useAuth from "./use-auth"

interface VideoProgressOptions {
  videoId: string
  courseId: number | string
  duration?: number
  autoSave?: boolean
  savingInterval?: number
  playedThreshold?: number
  isAuthRequired?: boolean
}

export interface VideoProgressData {
  time: number
  duration: number
  played: number
  playedSeconds: number
  bookmarks: number[]
  lastSavedAt?: Date
  completedAt?: Date
  isCompleted?: boolean
}

/**
 * Custom hook for managing video progress with user-specific storage
 */
export function useVideoProgress({
  videoId,
  courseId,
  duration = 0,
  autoSave = true,
  savingInterval = 5000, // Save every 5 seconds by default
  playedThreshold = 0.95, // Consider video complete at 95%
}: VideoProgressOptions) {
  const { data: session } = useSession()
  const { isAuthenticated, userId, getGuestId } = useAuth()
  const dispatch = useAppDispatch()
  
  const reduxProgress = useAppSelector((state) => state.course.videoProgress[videoId])
  const reduxBookmarks = useAppSelector((state) => state.course.bookmarks[videoId] || [])
  const courseCompleted = useAppSelector((state) => state.course.courseCompletionStatus)
  const courseCompletedFromApi = useAppSelector((state) => {
    const progress = state.course.courseProgress[courseId]
    return progress?.isCompleted || false
  })
  
  // Combine the two completion states
  const isCourseCompleted = courseCompleted || courseCompletedFromApi
  
  // Local state
  const [progress, setProgress] = useState<VideoProgressData>({
    time: reduxProgress?.time || 0,
    played: reduxProgress?.time || 0,
    playedSeconds: reduxProgress?.playedSeconds || 0,
    duration: reduxProgress?.duration || duration,
    bookmarks: reduxBookmarks,
    isCompleted: false,
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasPromptedCertificate, setHasPromptedCertificate] = useState(false)
  const [needsCertificatePrompt, setNeedsCertificatePrompt] = useState(false)
  const [hasShownRestartPrompt, setHasShownRestartPrompt] = useState(false)

  // Refs to track state between renders
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveTimeRef = useRef<number>(0)
  const storageKeyRef = useRef<string>("")
  
  // Generate storage key based on user status
  useEffect(() => {
    if (isAuthenticated && userId) {
      storageKeyRef.current = `video-progress-${userId}-${videoId}`
    } else {
      const guestId = getGuestId()
      storageKeyRef.current = `video-progress-guest-${guestId}-${videoId}`
    }
  }, [isAuthenticated, userId, videoId, getGuestId])

  // Load certificate prompt status
  useEffect(() => {
    let certificateKey: string
    
    if (isAuthenticated && userId) {
      certificateKey = `certificate-prompted-${userId}-${courseId}`
    } else {
      const guestId = getGuestId()
      certificateKey = `certificate-prompted-guest-${guestId}-${courseId}`
    }
    
    const hasPrompted = localStorage.getItem(certificateKey) === 'true'
    setHasPromptedCertificate(hasPrompted)
    
    // Only show certificate prompt if course is completed and we haven't shown it before
    setNeedsCertificatePrompt(isCourseCompleted && !hasPrompted)
  }, [courseId, userId, isAuthenticated, getGuestId, isCourseCompleted])

  // Load restart prompt status
  useEffect(() => {
    let restartKey: string
    
    if (isAuthenticated && userId) {
      restartKey = `restart-prompted-${userId}-${courseId}`
    } else {
      const guestId = getGuestId()
      restartKey = `restart-prompted-guest-${guestId}-${courseId}`
    }
    
    const hasShownRestart = localStorage.getItem(restartKey) === 'true'
    setHasShownRestartPrompt(hasShownRestart)
    
    // Reset restart prompt flag if course is no longer completed
    if (!isCourseCompleted && hasShownRestart) {
      localStorage.removeItem(restartKey)
      setHasShownRestartPrompt(false)
    }
  }, [courseId, userId, isAuthenticated, getGuestId, isCourseCompleted])

  // Load initial progress from storage
  useEffect(() => {
    if (!storageKeyRef.current) return
    
    try {
      const savedProgress = localStorage.getItem(storageKeyRef.current)
      
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress)
        setProgress(prev => ({
          ...prev,
          ...parsed,
        }))
        
        // Also update Redux for consistency
        if (!isCourseCompleted) {
          dispatch(setVideoProgress({
            videoId,
            time: parsed.time,
            playedSeconds: parsed.playedSeconds,
            duration: parsed.duration,
          }))
        }
      }
    } catch (err) {
      console.error("Error loading video progress:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
    }
  }, [videoId, dispatch, isCourseCompleted, storageKeyRef.current])

  // Update local state when Redux state changes
  useEffect(() => {
    if (reduxProgress) {
      setProgress(prev => ({
        ...prev,
        time: reduxProgress.time,
        played: reduxProgress.time, 
        playedSeconds: reduxProgress.playedSeconds,
        duration: reduxProgress.duration || prev.duration,
      }))
    }
  }, [reduxProgress])
  
  useEffect(() => {
    setProgress(prev => ({
      ...prev,
      bookmarks: reduxBookmarks,
    }))
  }, [reduxBookmarks])

  // Mark certificate as prompted
  const markCertificatePrompted = useCallback(() => {
    let certificateKey: string
    
    if (isAuthenticated && userId) {
      certificateKey = `certificate-prompted-${userId}-${courseId}`
    } else {
      const guestId = getGuestId()
      certificateKey = `certificate-prompted-guest-${guestId}-${courseId}`
    }
    
    localStorage.setItem(certificateKey, 'true')
    setHasPromptedCertificate(true)
    setNeedsCertificatePrompt(false)
  }, [isAuthenticated, userId, courseId, getGuestId])

  // Mark restart prompt as shown
  const markRestartPrompted = useCallback(() => {
    let restartKey: string
    
    if (isAuthenticated && userId) {
      restartKey = `restart-prompted-${userId}-${courseId}`
    } else {
      const guestId = getGuestId()
      restartKey = `restart-prompted-guest-${guestId}-${courseId}`
    }
    
    localStorage.setItem(restartKey, 'true')
    setHasShownRestartPrompt(true)
  }, [isAuthenticated, userId, courseId, getGuestId])

  // Update progress data
  const updateProgress = useCallback(
    async (newProgress: Partial<VideoProgressData>) => {
      // Don't save progress for completed courses unless explicitly told to
      if (isCourseCompleted && !newProgress.isCompleted) {
        return
      }
      
      // Update local state
      setProgress(prev => ({
        ...prev,
        ...newProgress,
        lastSavedAt: new Date(),
      }))

      // Update Redux if needed
      if (newProgress.time !== undefined) {
        dispatch(setVideoProgress({
          videoId,
          time: newProgress.time,
          playedSeconds: newProgress.playedSeconds || progress.playedSeconds,
          duration: newProgress.duration || progress.duration,
          userId,
        }))
        
        // Update course progress in Redux
        if (typeof courseId === 'number' || !isNaN(Number(courseId))) {
          dispatch(setResumePoint({ 
            courseId, 
            resumePoint: newProgress.time,
            userId,
          }))
          dispatch(setLastPlayedAt({ 
            courseId, 
            lastPlayedAt: new Date().toISOString(),
            userId,
          }))
        }
      }

      // Auto-save progress to localStorage
      if (storageKeyRef.current && autoSave) {
        const now = Date.now()
        // Only save at most once every X ms to prevent excessive writes
        if (now - lastSaveTimeRef.current >= savingInterval) {
          try {
            localStorage.setItem(storageKeyRef.current, JSON.stringify({
              ...progress,
              ...newProgress,
              lastSavedAt: new Date(),
            }))
            lastSaveTimeRef.current = now
          } catch (err) {
            console.error("Error saving video progress:", err)
          }
        }
      }
      
      // If video is completed and wasn't before, update completion status
      if (newProgress.isCompleted && !progress.isCompleted) {
        setProgress(prev => ({
          ...prev,
          completedAt: new Date(),
          isCompleted: true,
        }))
      }
    },
    [videoId, courseId, dispatch, progress, isCourseCompleted, autoSave, savingInterval, userId]
  )

  // Add a video bookmark
  const addBookmark = useCallback(
    (time: number) => {
      const newBookmarks = [...progress.bookmarks, time].sort((a, b) => a - b)
      
      setProgress(prev => ({
        ...prev,
        bookmarks: newBookmarks,
      }))
      
      // Save to localStorage
      if (storageKeyRef.current) {
        try {
          const savedData = localStorage.getItem(storageKeyRef.current)
          const savedProgress = savedData ? JSON.parse(savedData) : {}
          
          localStorage.setItem(storageKeyRef.current, JSON.stringify({
            ...savedProgress,
            bookmarks: newBookmarks,
          }))
        } catch (err) {
          console.error("Error saving bookmarks:", err)
        }
      }
      
      return newBookmarks
    },
    [progress.bookmarks]
  )

  // Remove a video bookmark
  const removeBookmark = useCallback(
    (timeToRemove: number) => {
      const newBookmarks = progress.bookmarks.filter(time => 
        Math.abs(time - timeToRemove) > 1 // Allow 1 second tolerance
      )
      
      setProgress(prev => ({
        ...prev,
        bookmarks: newBookmarks,
      }))
      
      // Save to localStorage
      if (storageKeyRef.current) {
        try {
          const savedData = localStorage.getItem(storageKeyRef.current)
          const savedProgress = savedData ? JSON.parse(savedData) : {}
          
          localStorage.setItem(storageKeyRef.current, JSON.stringify({
            ...savedProgress,
            bookmarks: newBookmarks,
          }))
        } catch (err) {
          console.error("Error saving bookmarks:", err)
        }
      }
      
      return newBookmarks
    },
    [progress.bookmarks]
  )

  // Mark course as complete
  const completeCourse = useCallback(() => {
    dispatch(setCourseCompletionStatus(true))
    
    // For guests, save to localStorage
    if (!isAuthenticated) {
      const guestId = getGuestId()
      localStorage.setItem(`course-completed-${guestId}-${courseId}`, "true")
    }
    
    // Check if we need to prompt for certificate
    if (!hasPromptedCertificate) {
      setNeedsCertificatePrompt(true)
    }
  }, [dispatch, isAuthenticated, getGuestId, courseId, hasPromptedCertificate])

  // Restart course progress
  const restartCourse = useCallback(() => {
    // Reset progress in Redux
    dispatch(setVideoProgress({
      videoId,
      time: 0,
      playedSeconds: 0,
      duration: progress.duration,
      userId,
    }))
    
    // Reset local state
    setProgress({
      time: 0,
      played: 0,
      playedSeconds: 0,
      duration: progress.duration,
      bookmarks: progress.bookmarks, // Keep bookmarks
      isCompleted: false,
    })
    
    // Save reset state to localStorage
    if (storageKeyRef.current) {
      try {
        const savedData = localStorage.getItem(storageKeyRef.current)
        const savedProgress = savedData ? JSON.parse(savedData) : {}
        
        localStorage.setItem(storageKeyRef.current, JSON.stringify({
          ...savedProgress,
          time: 0,
          played: 0,
          playedSeconds: 0,
          isCompleted: false,
        }))
      } catch (err) {
        console.error("Error resetting progress:", err)
      }
    }
    
    // Reset course completion status
    dispatch(setCourseCompletionStatus(false))
    
    // Reset restart prompt flag
    let restartKey: string
    if (isAuthenticated && userId) {
      restartKey = `restart-prompted-${userId}-${courseId}`
    } else {
      const guestId = getGuestId()
      restartKey = `restart-prompted-guest-${guestId}-${courseId}`
    }
    localStorage.removeItem(restartKey)
    setHasShownRestartPrompt(false)
    
    // Clear course completion
    if (!isAuthenticated) {
      const guestId = getGuestId()
      localStorage.removeItem(`course-completed-${guestId}-${courseId}`)
    }
  }, [
    videoId, 
    courseId, 
    progress.duration, 
    progress.bookmarks, 
    dispatch, 
    isAuthenticated,
    userId,
    getGuestId
  ])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return {
    progress,
    updateProgress,
    isSaving,
    error,
    addBookmark,
    removeBookmark,
    needsCertificatePrompt,
    markCertificatePrompted,
    completeCourse,
    restartCourse,
    isCourseCompleted,
    hasShownRestartPrompt,
    markRestartPrompted,
  }
}
