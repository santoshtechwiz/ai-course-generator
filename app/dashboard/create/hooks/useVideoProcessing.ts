"use client"

import { useState, useCallback, useEffect } from "react"
import axios from "axios"
import { useToast } from "@/hooks"

export interface VideoStatus {
  chapterId: number
  status: "queued" | "processing" | "completed" | "error"
  videoId?: string | null
  progress?: number
  message?: string
}

export interface UseVideoProcessingOptions {
  onStatusChange?: (status: VideoStatus) => void
  onComplete?: (status: VideoStatus) => void
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
    try {
      setIsProcessing((prev) => ({ ...prev, [chapterId]: true }))
      
      // Update initial status
      const initialStatus: VideoStatus = {
        chapterId,
        status: "queued",
        message: "Queueing video processing..."
      }
      
      setStatuses((prev) => ({
        ...prev,
        [chapterId]: initialStatus
      }))
      
      if (onStatusChange) {
        onStatusChange(initialStatus)
      }
      
      // Call the API
      const endpoint = useEnhancedService ? "/api/video/enhanced" : "/api/video"
      const response = await axios.post(endpoint, { 
        chapterId, 
        options: { useOptimizedService: true } 
      })
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to process video")
      }
      
      // Update queue status if available
      if (response.data.queueStatus) {
        setQueueStatus(response.data.queueStatus)
      }
      
      // Start polling for status
      pollStatus(chapterId)
      
      return response.data
      
    } catch (error) {
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
  
  // Process multiple videos
  const processMultipleVideos = useCallback(async (chapterIds: number[]) => {
    if (chapterIds.length === 0) return { success: true, processed: 0 }
    
    try {
      // Mark all as processing
      const newIsProcessing = { ...isProcessing }
      const newStatuses = { ...statuses }
      
      chapterIds.forEach(chapterId => {
        newIsProcessing[chapterId] = true
        newStatuses[chapterId] = {
          chapterId,
          status: "queued",
          message: "Queueing video processing..."
        }
      })
      
      setIsProcessing(newIsProcessing)
      setStatuses(newStatuses)
      
      // Use batch endpoint if enhanced service is enabled
      if (useEnhancedService) {
        const response = await axios.post("/api/video/enhanced/batch", { 
          chapterIds,
          options: { useOptimizedService: true }
        })
        
        if (response.data.queueStatus) {
          setQueueStatus(response.data.queueStatus)
        }
        
        // Start polling for all chapters
        chapterIds.forEach(chapterId => pollStatus(chapterId))
        
        return response.data
      } else {
        // Process one by one if using old service
        const results = await Promise.all(
          chapterIds.map(chapterId => processVideo(chapterId))
        )
        
        const successful = results.filter(r => r.success).length
        
        return {
          success: successful > 0,
          processed: successful,
          total: chapterIds.length
        }
      }
    } catch (error) {
      console.error("Error processing multiple videos:", error)
      
      toast({
        title: "Batch Processing Error",
        description: error instanceof Error ? error.message : "Failed to process videos",
        variant: "destructive"
      })
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        processed: 0,
        total: chapterIds.length
      }
    }
  }, [isProcessing, statuses, useEnhancedService, processVideo, toast])
  
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
      const response = await axios.delete(`/api/video/enhanced?chapterId=${chapterId}`)
      
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
    }
  }, [useEnhancedService, toast])
  
  // Check status
  const checkStatus = useCallback(async (chapterId: number) => {
    try {
      const endpoint = useEnhancedService 
        ? `/api/video/enhanced/status/${chapterId}`
        : `/api/video/status/${chapterId}`
        
      const response = await axios.get(endpoint)
      
      if (response.data.videoId) {
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
      
      // Check for error status
      if (response.data.failed || response.data.videoStatus === "error") {
        const errorStatus: VideoStatus = {
          chapterId,
          status: "error",
          message: "Video generation failed"
        }
        
        setIsProcessing((prev) => ({ ...prev, [chapterId]: false }))
        setStatuses((prev) => ({
          ...prev,
          [chapterId]: errorStatus
        }))
        
        if (onStatusChange) {
          onStatusChange(errorStatus)
        }
        
        if (onError) {
          onError(errorStatus)
        }
        
        return false
      }
      
      // Still processing
      const processingStatus: VideoStatus = {
        chapterId,
        status: "processing",
        message: "Video generation in progress..."
      }
      
      setStatuses((prev) => ({
        ...prev,
        [chapterId]: processingStatus
      }))
      
      if (onStatusChange) {
        onStatusChange(processingStatus)
      }
      
      return null // Still in progress
    } catch (error) {
      console.error(`Error checking status for chapter ${chapterId}:`, error)
      return false
    }
  }, [useEnhancedService, onStatusChange, onComplete, onError])
  
  // Poll status with exponential backoff
  const pollStatus = useCallback((chapterId: number) => {
    let attempts = 0
    let maxAttempts = 30
    
    const poll = async () => {
      if (!isProcessing[chapterId]) return
      
      const result = await checkStatus(chapterId)
      
      // If completed or error, stop polling
      if (result === true || result === false) {
        return
      }
      
      // Continue polling with exponential backoff
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
        return
      }
      
      // Calculate next interval (starts at base interval, doubles after 5 attempts)
      const nextInterval = attempts < 5 
        ? pollingInterval 
        : Math.min(pollingInterval * Math.pow(1.5, attempts - 5), 30000) // Max 30 seconds
      
      setTimeout(poll, nextInterval)
    }
    
    // Start polling
    poll()
  }, [isProcessing, pollingInterval, checkStatus])
  
  // Check queue status periodically
  useEffect(() => {
    if (!useEnhancedService) return
    
    const checkQueueStatus = async () => {
      try {
        const response = await axios.get("/api/video/enhanced")
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
  
  return {
    processVideo,
    processMultipleVideos,
    cancelProcessing,
    checkStatus,
    isProcessing,
    statuses,
    queueStatus,
  }
}
