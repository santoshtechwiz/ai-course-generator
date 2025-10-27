/**
 * app/dashboard/create/hooks/useVideoProcessing.ts
 * 
 * REFACTORED: Unified video processing hook with stable state management
 * - Single polling mechanism with exponential backoff
 * - Consolidated toast notifications
 * - Clean API integration (deprecated endpoints removed)
 * - Reliable state synchronization
 */

"use client"

import { useState, useCallback, useEffect, useRef } from "react"
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
  
  // Core state - single source of truth
  const [statuses, setStatuses] = useState<Record<number, VideoStatus>>({})
  const [isProcessing, setIsProcessing] = useState<Record<number, boolean>>({})
  
  // Polling control
  const pollTimersRef = useRef<Record<number, NodeJS.Timeout>>({})
  const retryCountsRef = useRef<Record<number, number>>({})
  const lastToastRef = useRef<Record<string, number>>({})
  
  // Throttled toast to prevent spam (max 1 per 3 seconds per message type)
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

  // Update status with state sync
  const updateStatus = useCallback((chapterId: number, update: Partial<VideoStatus>) => {
    setStatuses(prev => ({
      ...prev,
      [chapterId]: {
        ...prev[chapterId],
        chapterId,
        lastChecked: Date.now(),
        ...update
      }
    }))
  }, [])

  // Stop polling for a chapter
  const stopPolling = useCallback((chapterId: number) => {
    if (pollTimersRef.current[chapterId]) {
      clearTimeout(pollTimersRef.current[chapterId])
      delete pollTimersRef.current[chapterId]
    }
  }, [])

  // Check status via API (STANDARD API ONLY - no deprecated endpoints)
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

        // update internal state and stop polling
        updateStatus(chapterId, completedStatus)
        setIsProcessing(prev => ({ ...prev, [chapterId]: false }))
        stopPolling(chapterId)

        // call onComplete with the concrete status object (avoid reading stale state)
        if (onComplete) {
          onComplete(completedStatus)
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
        setIsProcessing(prev => ({ ...prev, [chapterId]: false }))
        stopPolling(chapterId)

        if (onError) {
          onError(failedStatus)
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
      
      // Still processing or queued - reflect server-provided status and progress
      updateStatus(chapterId, {
        status: response.videoStatus === 'queued' ? 'queued' : 'processing',
        jobId: response.jobId,
        queuePosition: response.queuePending,
        message: response.message || 'Generating video...',
        progress: typeof response.progress === 'number' ? response.progress : 50
      })
      
      return null
    } catch (error) {
      console.error(`Status check error for chapter ${chapterId}:`, error)
      return null
    }
  }, [updateStatus, stopPolling, onComplete, onError, autoRetry, maxRetries, showToast, statuses])

  // Smart polling with exponential backoff
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
        setIsProcessing(prev => ({ ...prev, [chapterId]: false }))
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
        setIsProcessing(prev => ({ ...prev, [chapterId]: false }))
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
    
    // Start polling
    poll()
  }, [checkStatus, updateStatus, stopPolling, showToast])

  // Process single video (PRIMARY API CALL)
  const processVideo = useCallback(async (chapterId: number) => {
    try {
      // Initialize state
      setIsProcessing(prev => ({ ...prev, [chapterId]: true }))
      updateStatus(chapterId, {
        status: 'queued',
        message: 'Queuing video generation...',
        progress: 10,
        startTime: Date.now()
      })
      
      // Call STANDARD video API (not enhanced/optimized)
      const response = await api.post('/api/video', { chapterId })

      const ok = response?.success
      if (!ok) {
        throw new Error(response?.error || 'Failed to start video generation')
      }

      // If the server returned a jobId/queued info, reflect that in status
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

      setIsProcessing(prev => ({ ...prev, [chapterId]: false }))
      showToast(message, 'error')

      if (onError) {
        onError(errorStatus)
      }
      
      return { success: false, error: message }
    }
  }, [updateStatus, startPolling, showToast, onError, statuses])

  // Process multiple videos sequentially
  const processMultipleVideos = useCallback(async (
    chapterIds: number[],
    options: { retryFailed?: boolean } = {}
  ): Promise<ProcessResult> => {
    if (chapterIds.length === 0) {
      return { success: true, processed: 0, failed: 0, total: 0 }
    }
    
    // Filter chapters if retrying failed only
    const toProcess = options.retryFailed
      ? chapterIds.filter(id => statuses[id]?.status === 'error')
      : chapterIds
    
    if (toProcess.length === 0) {
      showToast('No chapters to process', 'info')
      return { success: true, processed: 0, failed: 0, total: 0 }
    }
    
    showToast(`Starting video generation for ${toProcess.length} chapters`, 'info')
    
    let processed = 0
    let failed = 0
    
    // Process sequentially. Use API-driven status checks (checkStatus) to avoid stale closure
    for (const chapterId of toProcess) {
      await processVideo(chapterId)

      // Wait for completion by repeatedly calling checkStatus which updates state
      const waitStart = Date.now()
      const timeoutMs = 10 * 60 * 1000 // 10 minutes

      while (true) {
        // Ask the server for the latest status and update local state
        const res = await checkStatus(chapterId)

        if (res === true) {
          processed++
          break
        }

        if (res === false) {
          failed++
          break
        }

        if (Date.now() - waitStart > timeoutMs) {
          // Timed out waiting for completion
          failed++
          break
        }

        // Back off before next status check
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Small delay between videos
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
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
  }, [processVideo, statuses, showToast])

  // Cancel processing
  const cancelProcessing = useCallback(async (chapterId: number) => {
    stopPolling(chapterId)
    setIsProcessing(prev => ({ ...prev, [chapterId]: false }))
    updateStatus(chapterId, {
      status: 'error',
      message: 'Cancelled by user',
      progress: 0
    })
    showToast(`Chapter ${chapterId} cancelled`, 'info')
    return true
  }, [stopPolling, updateStatus, showToast])

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

  // Initialize chapter status (for chapters with existing videos)
  const initializeChapterStatus = useCallback((chapterId: number, videoId?: string | null) => {
    if (videoId) {
      updateStatus(chapterId, {
        status: 'completed',
        videoId,
        message: 'Video ready',
        progress: 100
      })
      setIsProcessing(prev => ({ ...prev, [chapterId]: false }))
    }
  }, [updateStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.keys(pollTimersRef.current).forEach(id => {
        stopPolling(Number(id))
      })
    }
  }, [stopPolling])

  // Queue status (derived from state)
  const queueStatus = {
    size: Object.values(statuses).filter(s => s.status === 'queued').length,
    pending: Object.values(isProcessing).filter(Boolean).length,
    activeProcesses: Object.entries(isProcessing)
      .filter(([_, processing]) => processing)
      .map(([id]) => Number(id))
  }

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