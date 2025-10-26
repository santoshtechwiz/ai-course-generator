import { useState, useCallback, useRef, useEffect } from 'react'
import { api } from '@/lib/api'
import type { ProgressStep } from '@/components/ui/progress-stepper'

interface VideoProcessingState {
  isProcessing: boolean
  status: 'idle' | 'processing' | 'completed' | 'failed'
  error: string | null
  videoId: string | null
  jobId: string | null
  progress: number
  steps: ProgressStep[]
}

interface VideoProcessingResult {
  data: {
    success: boolean
    queueStatus: string
    chapterId: number
    videoId: string | null
    jobId: string | null
  }
}

interface ChapterVideoStatus {
  success: boolean
  videoId: string | null
  videoStatus: 'pending' | 'processing' | 'completed' | 'error'
  isReady: boolean
  failed: boolean
  timestamp: string
  jobId?: string
}

export function useVideoProcessing() {
  const [state, setState] = useState<VideoProcessingState>({
    isProcessing: false,
    status: 'idle',
    error: null,
    videoId: null,
    jobId: null,
    progress: 0,
    steps: [
      {
        id: 'queue',
        label: 'Queue Video',
        status: 'pending',
        message: 'Preparing to generate video...'
      },
      {
        id: 'script',
        label: 'Generate Script',
        status: 'pending',
        message: 'Creating video script with AI...'
      },
      {
        id: 'video',
        label: 'Create Video',
        status: 'pending',
        message: 'Rendering video content...'
      },
      {
        id: 'upload',
        label: 'Upload & Finalize',
        status: 'pending',
        message: 'Uploading video and preparing for viewing...'
      }
    ]
  })

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  // Start polling for status updates
  const startPolling = useCallback((chapterId: number, jobId: string) => {
    cleanup() // Clean up any existing polling

    const pollStatus = async () => {
      try {
        const abortController = new AbortController()
        abortControllerRef.current = abortController

        const response = await api.get<ChapterVideoStatus>(
          `/video/status/${chapterId}`,
          { signal: abortController.signal }
        )

        const statusData = response.data

        setState(prev => {
          // Update progress steps based on video status
          const updatedSteps = prev.steps.map(step => {
            switch (step.id) {
              case 'queue':
                return {
                  ...step,
                  status: statusData.videoStatus === 'pending' ? 'processing' as const :
                         statusData.videoStatus === 'processing' ? 'completed' as const :
                         statusData.videoStatus === 'completed' ? 'completed' as const : 'error' as const,
                  progress: statusData.videoStatus === 'pending' ? 25 :
                           statusData.videoStatus === 'processing' ? 100 : 100,
                  startedAt: step.startedAt || new Date()
                }
              case 'script':
                return {
                  ...step,
                  status: statusData.videoStatus === 'processing' ? 'processing' as const :
                         statusData.videoStatus === 'completed' ? 'completed' as const : 'pending' as const,
                  progress: statusData.videoStatus === 'processing' ? 60 :
                           statusData.videoStatus === 'completed' ? 100 : 0,
                  startedAt: statusData.videoStatus === 'processing' ? (step.startedAt || new Date()) : undefined
                }
              case 'video':
                return {
                  ...step,
                  status: statusData.videoStatus === 'processing' ? 'processing' as const :
                         statusData.videoStatus === 'completed' ? 'completed' as const : 'pending' as const,
                  progress: statusData.videoStatus === 'processing' ? 80 :
                           statusData.videoStatus === 'completed' ? 100 : 0,
                  startedAt: statusData.videoStatus === 'processing' ? (step.startedAt || new Date()) : undefined
                }
              case 'upload':
                return {
                  ...step,
                  status: statusData.videoStatus === 'completed' ? 'completed' as const : 'pending' as const,
                  progress: statusData.videoStatus === 'completed' ? 100 : 0,
                  startedAt: statusData.videoStatus === 'completed' ? (step.startedAt || new Date()) : undefined
                }
              default:
                return step
            }
          })

          return {
            ...prev,
            isProcessing: statusData.videoStatus === 'processing',
            status: statusData.videoStatus === 'processing' ? 'processing' :
                   statusData.videoStatus === 'completed' ? 'completed' : 'failed',
            videoId: statusData.videoId,
            jobId: statusData.jobId || null,
            progress: statusData.videoStatus === 'processing' ? 75 :
                    statusData.videoStatus === 'completed' ? 100 : 0,
            steps: updatedSteps,
            error: null
          }
        })

        // Stop polling if processing is complete or failed
        if (statusData.videoStatus === 'completed' || statusData.videoStatus === 'error') {
          cleanup()
        }
      } catch (error) {
        if ((error as any)?.name !== 'AbortError') {
          console.error('Error polling video status:', error)
          setState(prev => ({
            ...prev,
            status: 'failed',
            error: 'Failed to check video processing status',
            isProcessing: false,
            steps: prev.steps.map(step => ({
              ...step,
              status: step.status === 'processing' ? 'error' as const : step.status
            }))
          }))
          cleanup()
        }
      }
    }

    // Poll immediately, then every 2 seconds
    pollStatus()
    pollingIntervalRef.current = setInterval(pollStatus, 2000)
  }, [cleanup])

  // Process video for a chapter
  const processVideo = useCallback(async (chapterId: number) => {
    try {
      setState(prev => ({
        ...prev,
        isProcessing: true,
        status: 'processing',
        error: null,
        progress: 10,
        steps: prev.steps.map(step => ({
          ...step,
          status: step.id === 'queue' ? 'processing' as const : 'pending' as const,
          startedAt: step.id === 'queue' ? new Date() : undefined,
          progress: step.id === 'queue' ? 25 : 0
        }))
      }))

      const response = await api.post<VideoProcessingResult>('/video', {
        chapterId
      })

      const result = response.data

      if (result.data?.success && result.data?.jobId) {
        setState(prev => ({
          ...prev,
          jobId: result.data.jobId,
          progress: 25,
          steps: prev.steps.map(step => ({
            ...step,
            status: step.id === 'queue' ? 'completed' as const :
                   step.id === 'script' ? 'processing' as const : step.status,
            progress: step.id === 'queue' ? 100 :
                    step.id === 'script' ? 30 : step.progress,
            startedAt: step.id === 'script' ? new Date() : step.startedAt
          }))
        }))

        // Start polling for status updates
        startPolling(chapterId, result.data.jobId)
      } else {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          status: 'failed',
          error: 'Failed to start video processing',
          steps: prev.steps.map(step => ({
            ...step,
            status: 'error' as const
          }))
        }))
      }
    } catch (error) {
      console.error('Error processing video:', error)
      setState(prev => ({
        ...prev,
        isProcessing: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        steps: prev.steps.map(step => ({
          ...step,
          status: 'error' as const
        }))
      }))
    }
  }, [startPolling])

  // Reset state
  const reset = useCallback(() => {
    cleanup()
    setState({
      isProcessing: false,
      status: 'idle',
      error: null,
      videoId: null,
      jobId: null,
      progress: 0,
      steps: [
        {
          id: 'queue',
          label: 'Queue Video',
          status: 'pending',
          message: 'Preparing to generate video...'
        },
        {
          id: 'script',
          label: 'Generate Script',
          status: 'pending',
          message: 'Creating video script with AI...'
        },
        {
          id: 'video',
          label: 'Create Video',
          status: 'pending',
          message: 'Rendering video content...'
        },
        {
          id: 'upload',
          label: 'Upload & Finalize',
          status: 'pending',
          message: 'Uploading video and preparing for viewing...'
        }
      ]
    })
  }, [cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    ...state,
    processVideo,
    reset
  }
}