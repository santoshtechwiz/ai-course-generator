import { useState, useEffect } from 'react'
import axios from 'axios'

interface OptimizedVideoProps {
  chapterId: number
  topic?: string
  onVideoReady?: (videoId: string) => void
  onError?: (error: Error) => void
}

/**
 * OptimizedVideoLoader - A component that handles video loading with non-blocking UX
 * 
 * This component demonstrates how to use the optimized video service with quick mode
 * to avoid frontend timeouts and provide a responsive user experience.
 */
export const OptimizedVideoLoader = ({ 
  chapterId, 
  topic, 
  onVideoReady,
  onError
}: OptimizedVideoProps) => {
  const [videoId, setVideoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [processingStatus, setProcessingStatus] = useState<'initial' | 'loading' | 'success' | 'error'>('initial')

  // Load video using optimized quick mode
  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true)
        setProcessingStatus('loading')
        
        // First, try to get from quick endpoint - this will return immediately with cache or fallback
        const quickResponse = await axios.post('/api/video/optimized/quick', {
          chapterId,
          topic
        })
        
        if (quickResponse.data.success && quickResponse.data.videoId) {
          setVideoId(quickResponse.data.videoId)
          setLoading(false)
          onVideoReady?.(quickResponse.data.videoId)
          
          if (quickResponse.data.fromCache) {
            // If from cache, we're done!
            setProcessingStatus('success')
          } else {
            // If fallback, poll for status to get real video when ready
            pollForStatus(chapterId)
          }
        } else {
          throw new Error('Failed to get quick video response')
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load video')
        setError(error)
        setProcessingStatus('error')
        onError?.(error)
        setLoading(false)
      }
    }

    // Poll for final video status
    const pollForStatus = async (chapterId: number) => {
      try {
        // Start polling
        const pollInterval = setInterval(async () => {
          // Check current status
          const statusResponse = await axios.get(`/api/video/optimized/status/${chapterId}`)
          
          if (statusResponse.data.isReady && statusResponse.data.videoId) {
            // When real video is ready, update
            clearInterval(pollInterval)
            setVideoId(statusResponse.data.videoId)
            setProcessingStatus('success')
            onVideoReady?.(statusResponse.data.videoId)
          } else if (statusResponse.data.failed) {
            // If processing failed, stick with fallback
            clearInterval(pollInterval)
          }
        }, 5000) // Check every 5 seconds
        
        // Clean up interval when component unmounts
        return () => clearInterval(pollInterval)
      } catch (err) {
        // On polling error, we still have the fallback video, so no UI impact
        console.error('Error polling for video status:', err)
      }
    }

    if (chapterId) {
      loadVideo()
    }
  }, [chapterId, topic, onVideoReady, onError])

  return {
    videoId,
    loading,
    error,
    processingStatus
  }
}
