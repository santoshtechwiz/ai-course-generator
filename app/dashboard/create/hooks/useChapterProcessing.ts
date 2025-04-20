"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
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

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
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

  const { mutateAsync: generateVideo, status } = useMutation({
    mutationFn: async () => {
      const response = await axios.post("/api/video", { chapterId: chapter.id })
      return response.data
    },
    onMutate: () => setState({ videoStatus: "processing" }),
    onSuccess: () => {
      closeEventSource()
      eventSourceRef.current = new EventSource(`/api/sse?chapterId=${chapter.id}`)

      eventSourceRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.videoStatus === "completed") {
          setState({ videoStatus: "success" })
          toast({
            title: "Success",
            description: "Chapter video has been generated successfully.",
            variant: "default",
          })
          closeEventSource()
        } else if (data.videoStatus === "error") {
          setState({ videoStatus: "error" })
          toast({
            title: "Error",
            description: "Failed to generate chapter video. Please try again.",
            variant: "destructive",
          })
          closeEventSource()
        }
      }

      eventSourceRef.current.onerror = () => {
        setState({ videoStatus: "error" })
        toast({
          title: "Error",
          description: "Failed to generate chapter video. Please try again.",
          variant: "destructive",
        })
        closeEventSource()
      }
    },
    onError: () => {
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
      await generateVideo()
    }
  }, [state.videoStatus, generateVideo])

  return {
    state,
    triggerProcessing,
    validateVideoId,
    isLoading: status === "pending",
  }
}
