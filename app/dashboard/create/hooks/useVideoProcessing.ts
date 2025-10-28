/**
 * app/dashboard/create/hooks/useVideoProcessing.ts
 * 
 * FIXED: Stable video processing with instant UI updates
 * - Fixed stale closure issues with refs
 * - Atomic state updates prevent race conditions
 * - Optimized re-renders with stable references
 * - Real-time progress synchronization
 */

"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { api } from "@/lib/api-helper"
import { useToast } from "@/hooks"

export interface VideoStatus {
  chapterId: number
  status: "idle" | "queued" | "processing" | "completed" | "error"
  videoId?: string | null
  jobId?: string | undefined
  queuePosition?: number | undefined
  progress?: number
  message?: string
  startTime?: number
  lastChecked?: number
}

interface UseVideoProcessingOptions {
  onComplete?: (status: VideoStatus) => void
  onError?: (status: VideoStatus) => void
  autoRetry?: boolean
  maxRetries?: number
}

interface ProcessResult {
  success: boolean
  processed: number
  failed: number
  error?: string
  total: number
}

export function useVideoProcessing(options: UseVideoProcessingOptions = {}) {
  const { toast } = useToast()
  const { onComplete, onError, autoRetry = false, maxRetries = 2 } = options
  
  // Use refs for state that needs to be accessed in callbacks without stale closures
  const statusesRef = useRef<Record<number, VideoStatus>>({})
  const isProcessingRef = useRef<Record<number, boolean>>({})
  
  // React state for UI updates - synced from refs
  const [statuses, setStatuses] = useState<Record<number, VideoStatus>>({})
  const [isProcessing, setIsProcessing] = useState<Record<number, boolean>>({})
  
  // Polling control
  const pollTimersRef = useRef<Record<number, NodeJS.Timeout>>({})
  const retryCountsRef = useRef<Record<number, number>>({})
  const lastToastRef = useRef<Record<string, number>>({})
  const callbacksRef = useRef({ onComplete, onError })
  
  // Keep callbacks fresh without re-creating functions
  useEffect(() => {
    callbacksRef.current = { onComplete, onError }
  }, [onComplete, onError])
  
  // Throttled toast to prevent spam
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const now = Date.now()
    const key = `${type}-${message}`
    const lastShown = lastToastRef.current[key] || 0
    
    if (now - lastShown < 3000) return
    
    lastToastRef.current[key] = now
    
    toast({
      title: type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info',
      description: message,
      variant: type === 'error' ? 'destructive' : 'default'
    })
  }, [toast])

  // Atomic update - updates both ref and state in sync
  const updateStatus = useCallback((chapterId: number, update: Partial<VideoStatus>) => {
    const newStatus = {
      ...statusesRef.current[chapterId],
      chapterId,
      lastChecked: Date.now(),
      ...update
    }
    
    // Update ref immediately (for callbacks)
    statusesRef.current = {
      ...statusesRef.current,
      [chapterId]: newStatus
    }
    
    // Update state (for UI) - batched by React
    setStatuses(prev => ({
      ...prev,
      [chapterId]: newStatus
    }))
  }, [])
  
  // Atomic processing state update
  const setProcessingState = useCallback((chapterId: number, processing: boolean) => {
    isProcessingRef.current = {
      ...isProcessingRef.current,
      [chapterId]: processing
    }
    
    setIsProcessing(prev => ({
      ...prev,
      [chapterId]: processing
    }))
  }, [])

  // Stop polling for a chapter
  const stopPolling = useCallback((chapterId: number) => {
    if (pollTimersRef.current[chapterId]) {
      clearTimeout(pollTimersRef.current[chapterId])
      delete pollTimersRef.current[chapterId]
    }
  }, [])

  // Check status via API - uses refs to avoid stale closures
  const checkStatus = useCallback(async (chapterId: number): Promise<boolean | null> => {
    try {
      const response = await api.get(`/api/video/status/${chapterId}`)
      
      // Completed - has video
      if (response.videoId) {
        const completedStatus: VideoStatus = {
          chapterId,
          status: 'completed',
          videoId: response.videoId,
          jobId: response.jobId,
          message: 'Video ready',
          progress: 100,
          lastChecked: Date.now()
        }

        updateStatus(chapterId, completedStatus)
        setProcessingState(chapterId, false)
        stopPolling(chapterId)

        // Use ref to get fresh callback
        if (callbacksRef.current.onComplete) {
          callbacksRef.current.onComplete(completedStatus)
        }

        return true
      }
      
      // Failed
      if (response.videoStatus === 'error' || response.failed) {
        const failedStatus: VideoStatus = {
          chapterId,
          status: 'error',
          jobId: response.jobId,
          message: response.error || 'Video generation failed',
          progress: 0,
          lastChecked: Date.now()
        }

        updateStatus(chapterId, failedStatus)
        setProcessingState(chapterId, false)
        stopPolling(chapterId)

        if (callbacksRef.current.onError) {
          callbacksRef.current.onError(failedStatus)
        }

        // Auto-retry if enabled
        if (autoRetry) {
          const retries = retryCountsRef.current[chapterId] || 0
          if (retries < maxRetries) {
            retryCountsRef.current[chapterId] = retries + 1
            showToast(`Retrying chapter ${chapterId} (${retries + 1}/${maxRetries})`, 'info')
            setTimeout(() => processVideo(chapterId), 5000)
          }
        }

        return false
      }
      
      // Still processing or queued - update progress in real-time
      const currentProgress = typeof response.progress === 'number' ? response.progress : 
                             response.videoStatus === 'processing' ? 50 : 10
      
      updateStatus(chapterId, {
        status: response.videoStatus === 'queued' ? 'queued' : 'processing',
        jobId: response.jobId,
        queuePosition: response.queuePending,
        message: response.message || (response.videoStatus === 'queued' ? 'In queue...' : 'Generating video...'),
        progress: currentProgress
      })
      
      return null
    } catch (error) {
      console.error(`Status check error for chapter ${chapterId}:`, error)
      return null
    }
  }, [updateStatus, setProcessingState, stopPolling, autoRetry, maxRetries, showToast])

  // Smart polling with exponential backoff - uses refs to avoid stale closures
  const startPolling = useCallback((chapterId: number) => {
    stopPolling(chapterId)
    
    let attempts = 0
    const maxAttempts = 60 // 10 minutes max
    const startTime = Date.now()
    const maxWaitTime = 10 * 60 * 1000 // 10 minutes
    
    const poll = async () => {
      // Check timeout
      if (Date.now() - startTime > maxWaitTime) {
        updateStatus(chapterId, {
          status: 'error',
          message: 'Generation timed out',
          progress: 0
        })
        setProcessingState(chapterId, false)
        showToast(`Chapter ${chapterId} timed out`, 'error')
        return
      }
      
      // Check max attempts
      if (attempts >= maxAttempts) {
        updateStatus(chapterId, {
          status: 'error',
          message: 'Max polling attempts reached',
          progress: 0
        })
        setProcessingState(chapterId, false)
        return
      }
      
      const result = await checkStatus(chapterId)
      
      // Stop if completed or failed
      if (result === true || result === false) {
        return
      }
      
      // Continue polling with backoff
      attempts++
      const delay = Math.min(3000 + attempts * 1000, 15000) // 3s to 15s
      
      pollTimersRef.current[chapterId] = setTimeout(poll, delay)
    }
    
    // Start polling immediately
    poll()
  }, [checkStatus, updateStatus, setProcessingState, stopPolling, showToast])

  // Process single video - memoized to prevent recreating
  const processVideo = useCallback(async (chapterId: number) => {
    try {
      // Initialize state
      setProcessingState(chapterId, true)
      updateStatus(chapterId, {
        status: 'queued',
        message: 'Queuing video generation...',
        progress: 10,
        startTime: Date.now()
      })
      
      // Call STANDARD video API
      const response = await api.post('/api/video', { chapterId })

      const ok = response?.success
      if (!ok) {
        throw new Error(response?.error || 'Failed to start video generation')
      }

      const jobId = response?.jobId
      const serverVideoStatus = response?.videoStatus || 'queued'
      const queuePending = response?.queuePending

      updateStatus(chapterId, {
        status: serverVideoStatus === 'processing' ? 'processing' : 'queued',
        jobId,
        queuePosition: typeof queuePending === 'number' ? queuePending : undefined,
        message: response?.message || (serverVideoStatus === 'processing' ? 'Processing video...' : 'Video queued'),
        progress: serverVideoStatus === 'processing' ? 30 : 10
      })
      
      // Start polling
      startPolling(chapterId)
      
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      
      const errorStatus: VideoStatus = {
        chapterId,
        status: 'error',
        message,
        progress: 0,
        lastChecked: Date.now()
      }

      updateStatus(chapterId, errorStatus)
      setProcessingState(chapterId, false)
      showToast(message, 'error')

      if (callbacksRef.current.onError) {
        callbacksRef.current.onError(errorStatus)
      }
      
      return { success: false, error: message }
    }
  }, [updateStatus, setProcessingState, startPolling, showToast])

  // Process multiple videos with real-time status updates
  const processMultipleVideos = useCallback(async (
    chapterIds: number[],
    options: { retryFailed?: boolean } = {}
  ): Promise<ProcessResult> => {
    if (chapterIds.length === 0) {
      return { success: true, processed: 0, failed: 0, total: 0 }
    }
    
    // Use ref to get current statuses
    const currentStatuses = statusesRef.current
    
    // Filter chapters if retrying failed only
    const toProcess = options.retryFailed
      ? chapterIds.filter(id => currentStatuses[id]?.status === 'error')
      : chapterIds
    
    if (toProcess.length === 0) {
      showToast('No chapters to process', 'info')
      return { success: true, processed: 0, failed: 0, total: 0 }
    }
    
    showToast(`Starting video generation for ${toProcess.length} chapters`, 'info')
    
    let processed = 0
    let failed = 0
    
    // Process all videos concurrently for better UX
    const results = await Promise.allSettled(
      toProcess.map(async (chapterId) => {
        await processVideo(chapterId)

        // Wait for completion using ref-based status checks
        const waitStart = Date.now()
        const timeoutMs = 10 * 60 * 1000 // 10 minutes

        while (true) {
          const res = await checkStatus(chapterId)

          if (res === true) {
            return { success: true, chapterId }
          }

          if (res === false) {
            return { success: false, chapterId }
          }

          if (Date.now() - waitStart > timeoutMs) {
            return { success: false, chapterId }
          }

          // Check more frequently for better progress updates
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      })
    )
    
    // Count results
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success) {
        processed++
      } else {
        failed++
      }
    })
    
    const successRate = processed / toProcess.length
    if (successRate === 1) {
      showToast('All videos generated successfully!', 'success')
    } else if (successRate > 0) {
      showToast(`Generated ${processed} of ${toProcess.length} videos`, 'info')
    } else {
      showToast('Video generation failed', 'error')
    }
    
    return {
      success: failed === 0,
      processed,
      failed,
      total: toProcess.length
    }
  }, [processVideo, checkStatus, showToast])

  // Cancel processing
  const cancelProcessing = useCallback(async (chapterId: number) => {
    stopPolling(chapterId)
    setProcessingState(chapterId, false)
    updateStatus(chapterId, {
      status: 'error',
      message: 'Cancelled by user',
      progress: 0
    })
    showToast(`Chapter ${chapterId} cancelled`, 'info')
    return true
  }, [stopPolling, setProcessingState, updateStatus, showToast])

  // Retry video
  const retryVideo = useCallback(async (chapterId: number) => {
    retryCountsRef.current[chapterId] = 0
    updateStatus(chapterId, {
      status: 'idle',
      message: undefined,
      progress: 0
    })
    await processVideo(chapterId)
  }, [updateStatus, processVideo])

  // Initialize chapter status
  const initializeChapterStatus = useCallback((chapterId: number, videoId?: string | null) => {
    if (videoId) {
      updateStatus(chapterId, {
        status: 'completed',
        videoId,
        message: 'Video ready',
        progress: 100
      })
      setProcessingState(chapterId, false)
    }
  }, [updateStatus, setProcessingState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.keys(pollTimersRef.current).forEach(id => {
        stopPolling(Number(id))
      })
    }
  }, [stopPolling])

  // Queue status - memoized to prevent recalculation
  const queueStatus = useMemo(() => ({
    size: Object.values(statuses).filter(s => s.status === 'queued').length,
    pending: Object.values(isProcessing).filter(Boolean).length,
    activeProcesses: Object.entries(isProcessing)
      .filter(([_, processing]) => processing)
      .map(([id]) => Number(id))
  }), [statuses, isProcessing])

  return {
    processVideo,
    processMultipleVideos,
    cancelProcessing,
    retryVideo,
    initializeChapterStatus,
    isProcessing,
    statuses,
    queueStatus,
  }
}