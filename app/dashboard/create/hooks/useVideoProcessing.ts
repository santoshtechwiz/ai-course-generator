"use client"

import { useState, useCallback, useEffect } from "react"
import { api } from "@/lib/api-helper"
import { useToast } from "@/hooks"

export interface VideoStatus {
  chapterId: number
  status: "queued" | "processing" | "completed" | "error"
  videoId?: string | null
  progress?: number
  message?: string
  retryCount?: number  // Track API call retry attempts
  startTime?: number | string // Added for stuck detection
}

interface UseVideoProcessingOptions {
  onStatusChange?: (status: VideoStatus) => void
  onComplete?: (status: VideoStatus) => void // Added
  onError?: (status: VideoStatus) => void
  pollingInterval?: number
  useEnhancedService?: boolean
}

export function useVideoProcessing(options: UseVideoProcessingOptions = {}) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState<Record<number, boolean>>({})
  const [statuses, setStatuses] = useState<Record<number, VideoStatus>>({})
  const [queueStatus, setQueueStatus] = useState<{ size: number; pending: number }>({ size: 0, pending: 0 })
  
  // Configure options with defaults
  const {
    onStatusChange,
    onComplete,
    onError,
    pollingInterval = 5000,
    useEnhancedService = true,
  } = options
    // Process a single video
  const processVideo = useCallback(async (chapterId: number) => {
    console.log(`🎬 processVideo called for chapter ${chapterId}`)
    
    try {
      console.log(`📝 Setting isProcessing to true for chapter ${chapterId}`)
      setIsProcessing((prev) => ({ ...prev, [chapterId]: true }))
      
      // Update initial status
      const initialStatus: VideoStatus = {
        chapterId,
        status: "queued",
        message: "Queueing video processing..."
      }
      
      console.log(`📊 Setting initial status for chapter ${chapterId}:`, initialStatus)
      setStatuses((prev) => ({
        ...prev,
        [chapterId]: initialStatus
      }))
      
      if (onStatusChange) {
        onStatusChange(initialStatus)
      }
        // Call the API - use the standard video API instead of enhanced
      const endpoint = "/api/video"
      console.log(`🚀 Calling API ${endpoint} for chapter ${chapterId}`)
      
      const response = await api.post(endpoint, { 
        chapterId
      })
      
      console.log(`📡 API response for chapter ${chapterId}:`, response.data)
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to process video")
      }
      
      // Update queue status if available
      if (response.data.queueStatus) {
        console.log(`📊 Updating queue status:`, response.data.queueStatus)
        setQueueStatus(response.data.queueStatus)
      }
      
      // Start polling for status
      console.log(`🔄 Starting polling for chapter ${chapterId}`)
      pollStatus(chapterId)
      
      return response.data
      
    } catch (error) {
      console.error(`❌ Error in processVideo for chapter ${chapterId}:`, error)
      console.error(`Error processing video for chapter ${chapterId}:`, error)
      
      const errorStatus: VideoStatus = {
        chapterId,
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      }
      
      setStatuses((prev) => ({
        ...prev,
        [chapterId]: errorStatus
      }))
      
      if (onError) {
        onError(errorStatus)
      }
      
      toast({
        title: "Video Processing Error",
        description: error instanceof Error ? error.message : "Failed to process video",
        variant: "destructive"
      })
      
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }, [useEnhancedService, onStatusChange, onError, toast])
    // Check status
  const checkStatus = useCallback(async (chapterId: number) => {
    try {
      const endpoint = `/api/video/status/${chapterId}`
      
      console.log(`🔍 Checking status for chapter ${chapterId} at ${endpoint}`)
      const response = await api.get(endpoint)
      console.log(`📡 Status response for chapter ${chapterId}:`, response.data)
      
      // Successful completion - video is ready
      if (response.data.videoId) {
        console.log(`✅ Video completed for chapter ${chapterId}, videoId: ${response.data.videoId}`)
        const completedStatus: VideoStatus = {
          chapterId,
          status: "completed",
          videoId: response.data.videoId,
          message: "Video generated successfully"
        }
        
        setIsProcessing((prev) => ({ ...prev, [chapterId]: false }))
        setStatuses((prev) => ({
          ...prev,
          [chapterId]: completedStatus
        }))
        
        if (onStatusChange) {
          onStatusChange(completedStatus)
        }
        if (onComplete) {
          onComplete(completedStatus)
        }
        return true
      }
      // Error state
      if (response.data.videoStatus === "error" || response.data.failed) {
        console.log(`❌ Video failed for chapter ${chapterId}`)
        const errorStatus: VideoStatus = {
          chapterId,
          status: "error",
          message: response.data.error || "Video generation failed"
        }
        setIsProcessing((prev) => ({ ...prev, [chapterId]: false }))
        setStatuses((prev) => ({
          ...prev,
          [chapterId]: errorStatus
        }))
        if (onError) {
          onError(errorStatus)
        }
        return false
      }
      // Still processing
      return null
    } catch (error) {
      console.error(`Error checking status for chapter ${chapterId}:`, error)
      setIsProcessing((prev) => ({ ...prev, [chapterId]: false }))
      setStatuses((prev) => ({
        ...prev,
        [chapterId]: {
          chapterId,
          status: "error",
          message: error instanceof Error ? error.message : "Failed to check status"
        }
      }))
      if (onError) {
        onError({
          chapterId,
          status: "error",
          message: error instanceof Error ? error.message : "Failed to check status"
        })
      }
      return false
    }
  }, [onStatusChange, onComplete, onError, setIsProcessing, setStatuses])
    // Helper function to wait for completion
  const waitForCompletion = useCallback(async (chapterId: number): Promise<{ success: boolean; error?: string }> => {
    let attempts = 0
    const maxAttempts = 60 // 10 minutes with 10 second intervals

    return new Promise((resolve) => {
      const checkCompletion = async () => {
        try {
          const result = await checkStatus(chapterId)
          
          // If completed successfully
          if (result === true) {
            resolve({ success: true })
            return
          }
          
          // If error occurred
          if (result === false) {
            const status = statuses[chapterId]
            resolve({ success: false, error: status?.message || "Video generation failed" })
            return
          }
          
          // Still processing, continue checking
          attempts++
          if (attempts >= maxAttempts) {
            setIsProcessing((prev) => ({ ...prev, [chapterId]: false }))
            setStatuses((prev) => ({
              ...prev,
              [chapterId]: {
                chapterId,
                status: "error",
                message: "Timeout: Video generation took too long"
              }
            }))
            resolve({ success: false, error: "Timeout: Video generation took too long" })
            return
          }
          
          // Wait and try again
          setTimeout(checkCompletion, 10000) // 10 second intervals
          
        } catch (error) {
          resolve({ 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown error" 
          })
        }
      }
      
      // Start checking
      checkCompletion()
    })
  }, [checkStatus, statuses, setIsProcessing, setStatuses])
    // Process multiple videos (sequentially for enhanced service)
  const processMultipleVideos = useCallback(async (chapterIds: number[], options: { retryFailed?: boolean } = {}) => {
    if (chapterIds.length === 0) return { success: true, processed: 0 }

    let processed = 0
    let failed = 0
    let lastError = null

    for (let i = 0; i < chapterIds.length; i++) {
      const chapterId = chapterIds[i]

      // If retryFailed is set, only retry chapters with error/timeout
      if (options.retryFailed && statuses[chapterId]?.status !== "error") {
        continue
      }

      try {
        // Set processing state
        setIsProcessing((prev) => ({ ...prev, [chapterId]: true }))

        // Update initial status
        const queuedStatus: VideoStatus = {
          chapterId,
          status: "queued",
          message: `Processing video ${processed + 1} of ${chapterIds.length}...`
        }

        setStatuses((prev) => ({
          ...prev,
          [chapterId]: queuedStatus
        }))

        if (onStatusChange) {
          onStatusChange(queuedStatus)
        }

        // Call the video generation API directly
        const endpoint = useEnhancedService ? "/api/video/enhanced" : "/api/video"
        const response = await api.post(endpoint, useEnhancedService
          ? { chapterId, options: { useOptimizedService: true } }
          : { chapterId })

        if (!response.data.success) {
          throw new Error(response.data.error || "Failed to process video")
        }

        // Update queue status if available
        if (response.data.queueStatus) {
          setQueueStatus(response.data.queueStatus)
        }

        // Wait for completion using polling
        const result = await waitForCompletion(chapterId)

        if (result.success) {
          processed++
        } else {
          failed++
          lastError = result.error || "Unknown error"
        }
      } catch (err) {
        failed++
        lastError = err instanceof Error ? err.message : "Unknown error"

        const errorStatus: VideoStatus = {
          chapterId,
          status: "error",
          message: lastError
        }

        setStatuses((prev) => ({
          ...prev,
          [chapterId]: errorStatus
        }))

        setIsProcessing((prev) => ({ ...prev, [chapterId]: false }))

        if (onError) {
          onError(errorStatus)
        }
      }

      // Small delay between videos to avoid overwhelming the server
      if (i < chapterIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return {
      success: failed === 0,
      processed,
      failed,
      error: lastError,
      total: chapterIds.length
    }
  }, [useEnhancedService, statuses, onStatusChange, onError, setIsProcessing, setStatuses, setQueueStatus, waitForCompletion, toast])
  
  // Cancel processing
  const cancelProcessing = useCallback(async (chapterId: number) => {
    if (!useEnhancedService) {
      toast({
        title: "Not Supported",
        description: "Cancellation is only available with the enhanced service",
        variant: "default"
      })
      return false
    }
    
    try {
      const response = await api.delete(`/api/video/enhanced?chapterId=${chapterId}`)
      
      if (response.data.success) {
        setIsProcessing((prev) => ({ ...prev, [chapterId]: false }))
        
        setStatuses((prev) => ({
          ...prev,
          [chapterId]: {
            ...prev[chapterId],
            status: "error",
            message: "Processing cancelled"
          }
        }))
        
        toast({
          title: "Processing Cancelled",
          description: `Video processing for chapter ${chapterId} has been cancelled`,
          variant: "default"
        })
        
        return true
      }
      
      return false
    } catch (error) {
      console.error(`Error cancelling processing for chapter ${chapterId}:`, error)
      
      toast({
        title: "Cancellation Error",
        description: error instanceof Error ? error.message : "Failed to cancel processing",
        variant: "destructive"
      })
      
      return false
    }  }, [useEnhancedService, toast])
  
  // Retry a failed or stuck video
  const retryVideo = useCallback(async (chapterId: number) => {
    console.log(`🔄 Retrying video for chapter ${chapterId}`)
    
    // Clear any existing status
    setStatuses((prev) => {
      const newStatuses = { ...prev }
      delete newStatuses[chapterId]
      return newStatuses
    })
    
    setIsProcessing((prev) => ({ ...prev, [chapterId]: false }))
    
    // Wait a moment then retry
    setTimeout(() => {
      processVideo(chapterId)
    }, 1000)
  }, [processVideo])
    // Poll status with exponential backoff
  const pollStatus = useCallback((chapterId: number) => {
    console.log(`🔄 Starting polling for chapter ${chapterId}`)
    let attempts = 0
    let maxAttempts = 40 // Increased for longer timeout
    let shouldContinuePolling = true
    const startTime = Date.now()
    const maxWaitTime = 5 * 60 * 1000 // 5 minutes max wait
    
    const poll = async () => {
      // Check if we should stop polling
      if (!shouldContinuePolling) {
        console.log(`⏹️ Polling stopped for chapter ${chapterId}`)
        return
      }
      
      // Check if we've exceeded the maximum wait time
      const elapsedTime = Date.now() - startTime
      if (elapsedTime > maxWaitTime) {
        console.log(`⏰ Maximum wait time exceeded for chapter ${chapterId} after ${Math.round(elapsedTime/1000)}s`)
        shouldContinuePolling = false
        setIsProcessing((prev) => ({ ...prev, [chapterId]: false }))
        setStatuses((prev) => ({
          ...prev,
          [chapterId]: {
            chapterId,
            status: "error",
            message: "Timeout: Video generation took too long"
          }
        }))
        
        if (onError) {
          onError({
            chapterId,
            status: "error",
            message: "Timeout: Video generation took too long"
          })
        }
        
        return
      }
      
      console.log(`🔍 Polling attempt ${attempts + 1}/${maxAttempts} for chapter ${chapterId} (elapsed: ${Math.round(elapsedTime/1000)}s)`)
      const result = await checkStatus(chapterId)
      console.log(`📊 Poll result for chapter ${chapterId}:`, result)
      
      // If completed or error, stop polling
      if (result === true || result === false) {
        console.log(`✅ Polling completed for chapter ${chapterId}, result: ${result}`)
        shouldContinuePolling = false
        return
      }
      
      // Continue polling with adaptive backoff
      attempts++
      if (attempts >= maxAttempts) {
        console.log(`⏰ Polling timeout for chapter ${chapterId} after ${maxAttempts} attempts`)
        shouldContinuePolling = false
        setIsProcessing((prev) => ({ ...prev, [chapterId]: false }))
        setStatuses((prev) => ({
          ...prev,
          [chapterId]: {
            chapterId,
            status: "error",
            message: "Timeout: Video generation took too long"
          }
        }))
        
        if (onError) {
          onError({
            chapterId,
            status: "error",
            message: "Timeout: Video generation took too long"
          })
        }
        
        return
      }
      
      // Calculate next interval with better backoff strategy
      // Start with quick checks, then gradually increase, but cap at 15 seconds
      let nextInterval: number;
      if (attempts < 5) {
        nextInterval = 2000; // First 5 attempts: check every 2 seconds
      } else if (attempts < 10) {
        nextInterval = 5000; // Next 5 attempts: every 5 seconds
      } else {
        // After 10 attempts, use adaptive backoff but cap at 15 seconds
        nextInterval = Math.min(3000 + (attempts - 10) * 1000, 15000);
      }
      
      console.log(`⏱️ Next poll for chapter ${chapterId} in ${nextInterval/1000}s`)
      setTimeout(poll, nextInterval)
    }
    
    // Start polling
    poll()
    
    return () => {
      console.log(`🛑 Cleanup: stopping polling for chapter ${chapterId}`)
      shouldContinuePolling = false
    }
  }, [pollingInterval, checkStatus, onError, setIsProcessing, setStatuses])
  
  // Initialize status for chapters that already have videos
  const initializeChapterStatus = useCallback((chapterId: number, videoId?: string | null) => {
    if (videoId) {
      const currentStatus = statuses[chapterId]
      
      // Only initialize if no status exists OR status is not completed
      if (!currentStatus || currentStatus.status !== "completed") {
        console.log(`🔄 Initializing chapter ${chapterId} with videoId: ${videoId}`)
        
        const completedStatus: VideoStatus = {
          chapterId,
          status: "completed",
          videoId,
          message: "Video already exists"
        }
        
        setStatuses((prev) => {
          console.log(`📝 Setting status for chapter ${chapterId} to completed`)
          return {
            ...prev,
            [chapterId]: completedStatus
          }
        })
        
        setIsProcessing((prev) => {
          console.log(`⏸️ Setting isProcessing for chapter ${chapterId} to false`)
          return { ...prev, [chapterId]: false }
        })
        
        if (onStatusChange) {
          onStatusChange(completedStatus)
        }
        
        if (onComplete) {
          onComplete(completedStatus)
        }
      }
    }
  }, [statuses, onStatusChange, onComplete])
  
  // Check queue status periodically
  useEffect(() => {
    if (!useEnhancedService) return
    
    const checkQueueStatus = async () => {
      try {
        const response = await api.get("/api/video/enhanced")
        if (response.data.success) {
          setQueueStatus(response.data.status)
        }
      } catch (error) {
        console.error("Error checking queue status:", error)
      }
    }
    
    // Initial check
    checkQueueStatus()
    
    // Setup interval
    const interval = setInterval(checkQueueStatus, 15000)
    
    return () => clearInterval(interval)
  }, [useEnhancedService])
    // Enhanced logging for debugging
  useEffect(() => {
    const logCurrentState = () => {
      const processingChapters = Object.entries(isProcessing).filter(([_, processing]) => processing)
      const statusSummary = Object.entries(statuses).reduce((acc, [chapterId, status]) => {
        acc[status.status] = (acc[status.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      if (processingChapters.length > 0 || Object.keys(statuses).length > 0) {
        console.log(`[VideoProcessing] State Summary:`, {
          processing: processingChapters.map(([id, _]) => id),
          processingCount: processingChapters.length,
          statusSummary,
          queueStatus,
          timestamp: new Date().toISOString()
        })

        // Check for potential stuck chapters
        const now = Date.now()
        const stuckThreshold = 5 * 60 * 1000 // 5 minutes
        const potentiallyStuck = Object.entries(statuses).filter(([chapterId, status]) => {
          const isProcessing = status.status === "processing"
          let startTimeNum = now
          if (status.startTime) {
            startTimeNum = typeof status.startTime === 'string' ? new Date(status.startTime).getTime() : status.startTime
          }
          const timeDiff = now - startTimeNum
          return isProcessing && timeDiff > stuckThreshold
        })

        if (potentiallyStuck.length > 0) {
          console.warn(`[VideoProcessing] ⚠️ Potentially stuck chapters detected:`, 
            potentiallyStuck.map(([id, status]) => { 
              let startTimeNum = now
              if (status.startTime) {
                startTimeNum = typeof status.startTime === 'string' ? new Date(status.startTime).getTime() : status.startTime
              }
              return {
                id,
                status: status.status,
                message: status.message,
                duration: Math.round((now - startTimeNum) / 1000) + 's'
              }
            })
          )
        }
      }
    }

    // Log state every 30 seconds when there's activity
    const interval = setInterval(logCurrentState, 30000)
    return () => clearInterval(interval)
  }, [isProcessing, statuses, queueStatus])

  return {
    processVideo,
    processMultipleVideos,
    cancelProcessing,
    retryVideo,
    checkStatus,
    initializeChapterStatus,
    isProcessing,
    statuses,
    queueStatus,
  }
}
