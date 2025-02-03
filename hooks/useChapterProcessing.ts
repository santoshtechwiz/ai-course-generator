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

  const { mutate: generateVideo, status } = useMutation({
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

  const triggerProcessing = useCallback(() => {
    if (state.videoStatus === "idle" || state.videoStatus === "error") {
      generateVideo()
    }
  }, [state.videoStatus, generateVideo])

  return {
    state,
    triggerProcessing,
    isLoading: status === "success",
  }
}

