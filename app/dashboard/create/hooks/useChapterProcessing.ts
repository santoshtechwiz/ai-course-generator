"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api-helper"
import { useToast } from "@/hooks"
// global loader removed
import type { Chapter } from "@prisma/client"

type ProcessingStatus = "idle" | "processing" | "success" | "error"

interface ChapterProcessingState {
  videoStatus: ProcessingStatus
}

export const useChapterProcessing = (chapter: Chapter) => {
  const { toast } = useToast()
  const [state, setState] = useState<ChapterProcessingState>({
    videoStatus: chapter.videoId ? "success" : "idle",
  })
  const eventSourceRef = useRef<EventSource | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    // Clear any polling timeout
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
    }

    setIsPolling(false)
  }, [])

  useEffect(() => {
    return () => closeEventSource()
  }, [closeEventSource])

  // Update state when chapter changes (e.g., when videoId is added manually)
  useEffect(() => {
    if (chapter.videoId && state.videoStatus === "idle") {
      setState({ videoStatus: "success" })
    }
  }, [chapter.videoId, state.videoStatus])

  // Add a function to check video status
  const checkVideoStatus = useCallback(async (chapterId: number) => {
    try {
      const response = await api.get(`/video/status/${chapterId}`)
      const data = response.data

      console.log(`Video status check for chapter ${chapterId}:`, data)

      if (data.videoId) {
        setState({ videoStatus: "success" })
        setIsPolling(false)
        return true
      } else if (data.videoStatus === "error") {
        setState({ videoStatus: "error" })
        setIsPolling(false)
        return true
      }

      return false
    } catch (error) {
      console.error("Error checking video status:", error)
      return false
    }
  }, [])

  // Add a polling mechanism with a maximum number of attempts
  const startPolling = useCallback(
    (chapterId: number, maxAttempts = 10) => {
      let attempts = 0
      setIsPolling(true)

      const poll = async () => {
        attempts++
        console.log(`Polling attempt ${attempts} for chapter ${chapterId}`)

        const isDone = await checkVideoStatus(chapterId)

        if (isDone || attempts >= maxAttempts) {
          if (attempts >= maxAttempts && !isDone) {
            console.warn(`Polling timed out for chapter ${chapterId} after ${maxAttempts} attempts`)
            setState({ videoStatus: "error" })
            toast({
              title: "Video Generation Timeout",
              description: "The video generation process is taking longer than expected. You can try again.",
              variant: "destructive",
            })
          }
          setIsPolling(false)
          return
        }

        // Continue polling with exponential backoff
        const delay = Math.min(2000 * Math.pow(1.5, attempts), 10000) // Max 10 seconds
        pollingTimeoutRef.current = setTimeout(poll, delay)
      }

      // Start polling
      poll()
    },
    [checkVideoStatus, toast],
  )

  const { mutateAsync: generateVideo, status } = useMutation({
    mutationFn: async () => {
      try {
        console.log("Generating video for chapter:", chapter.id)
        const response = await api.post("/video", { chapterId: chapter.id })
        return response.data
      } catch (error) {
        console.error("Error in video generation API call:", error)
        throw error
      }
    },
    onMutate: () => {
      console.log("Starting video generation for chapter:", chapter.id)
      setState({ videoStatus: "processing" })
    },
    onSuccess: (data) => {
      console.log("Video generation API response:", data)

      // Start polling for status instead of using SSE
      startPolling(chapter.id)

      // Close any existing event source
      closeEventSource()
    },
    onError: (error) => {
      console.error("Video generation error:", error)
      setState({ videoStatus: "error" })
      toast({
        title: "Error",
        description: "Failed to generate chapter video. Please try again.",
        variant: "destructive",
      })
    },
  })

  const validateVideoId = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      // Extract video ID if a full URL was pasted
      let extractedVideoId = videoId
      if (videoId.includes("youtube.com") || videoId.includes("youtu.be")) {
        const url = new URL(videoId)
        if (videoId.includes("youtube.com")) {
          extractedVideoId = url.searchParams.get("v") || ""
        } else {
          extractedVideoId = url.pathname.substring(1)
        }
      }

      // Simple validation - YouTube IDs are 11 characters
      if (extractedVideoId.length !== 11) {
        return false
      }

      // You could make an API call to validate the video exists
      // For now, we'll just return true if it's the right format
      return true
    } catch (error) {
      console.error("Error validating video ID:", error)
      return false
    }
  }, [])

  const triggerProcessing = useCallback(async () => {
    if (state.videoStatus === "idle" || state.videoStatus === "error") {
      try {
        await generateVideo()
      } catch (error) {
        console.error("Error triggering video processing:", error)
        setState({ videoStatus: "error" })
      }
    }
  }, [state.videoStatus, generateVideo])

  return {
    state,
    triggerProcessing,
    validateVideoId,
    isLoading: status === "pending" || isPolling,
  }
}
