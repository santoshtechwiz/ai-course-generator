import axios, { type AxiosInstance } from "axios"
import Transcriptor, { type Transcription } from "youtube-video-transcript"
import Server from "youtube-video-transcript"
import { Supadata } from "@supadata/js"
export interface YoutubeSearchResponse {
  items: Array<{
    id: {
      videoId: string
    }
  }>
}

export interface TranscriptResponse {
  status: number
  message: string
  transcript: string | null
}

interface CaptionTrack {
  language: string
  trackKind: string
}

class YoutubeService {
  private static YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
  private static MAX_RETRIES = 3
  private static RETRY_DELAY = 1000 // 1 second
  private static MAX_TRANSCRIPT_ITEMS = 300
  private static processedVideoIds = new Set<string>()
  private static supadata: Supadata
  private static youtubeClient: AxiosInstance = axios.create({
    baseURL: "https://www.googleapis.com/youtube/v3",
    params: { key: YoutubeService.YOUTUBE_API_KEY },
  })

  static {
    this.supadata = new Supadata({
      apiKey: process.env.SUPDATA_KEY || "",
    })
    Server.setProxy({
      url: "https://spys.one/",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    })
  }

  static async searchYoutube(searchQuery: string): Promise<string | null> {
    try {
      const { data } = await this.youtubeClient.get<YoutubeSearchResponse>("/search", {
        params: {
          q: searchQuery,
          videoDuration: "long",
          videoEmbeddable: true,
          type: "video",
          maxResults: 5,
        },
      })

      for (const item of data.items) {
        const videoId = item.id.videoId
        if (!this.processedVideoIds.has(videoId)) {
          this.processedVideoIds.add(videoId)
          return videoId
        }
      }

      console.log("All videos in the search results have been processed")
      return null
    } catch (error) {
      console.error("Error in YouTube search:", error)
      return null
    }
  }

  static async getTranscript(videoId: string): Promise<TranscriptResponse> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const captionTracks = await this.getCaptionTracks(videoId)

        if (captionTracks.length === 0) {
          return { status: 204, message: "No captions available.", transcript: null }
        }

        const englishTrack = captionTracks.find((track) => track.language === "en") || captionTracks[0]

        const transcriptResult = await this.fetchTranscript(videoId)
        if (!transcriptResult || !transcriptResult.transcript) {
          return { status: 204, message: "No transcript available.", transcript: null }
        }

        return { status: 200, message: "Transcript fetched successfully.", transcript: transcriptResult.transcript }
      } catch (error) {
        if (attempt === this.MAX_RETRIES) {
          console.error(`Error fetching transcript for video ${videoId}:`, error)
          return {
            status: 500,
            message: `Error fetching transcript: ${error instanceof Error ? error.message : "Unknown error"}`,
            transcript: null,
          }
        }
        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY))
      }
    }

    throw new Error("Unexpected error in getTranscript")
  }

  static async fetchTranscript(videoId: string): Promise<{ transcript: string } | null> {
    try {
      const result: Transcription | Transcription[] = await Transcriptor.getTranscript(videoId)

      if (!result) {
        throw new Error("Failed to fetch transcript.")
      }

      if (Array.isArray(result)) {
        return {
          transcript: result.map((t) => t.data).join(" "),
        }
      }
      return {
        transcript: result.data.map((item) => item.text).join(" "),
      }
    } catch (error) {
      console.error("Failed to fetch transcript:", error)
      return null
    }
  }

  private static async getCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
    const { data } = await this.youtubeClient.get("/captions", {
      params: { part: "snippet", videoId },
    })

    return data.items.map((item: any) => ({
      language: item.snippet.language,
      trackKind: item.snippet.trackKind,
    }))
  }

  static async getTranscriptForVideo(videoId: string): Promise<TranscriptResponse> {
    if (!videoId) {
      console.warn("No videoId provided to getTranscriptForVideo")
      return {
        status: 400,
        message: "No videoId provided",
        transcript: null,
      }
    }

    try {
      const result = await this.fetchTranscript(videoId)

      if (!result || !result.transcript) {
        console.warn("No transcript found for video", videoId)
        return {
          status: 404,
          message: "No transcript found for video",
          transcript: null,
        }
      }

      const transcriptText = this.formatTranscript(result.transcript)

      return {
        status: 200,
        message: `Transcript fetched successfully (limited to ${this.MAX_TRANSCRIPT_ITEMS} items).`,
        transcript: transcriptText,
      }
    } catch (error) {
      console.error("Error in getTranscriptForVideo:", error)
      return {
        status: 500,
        message: `Error processing transcript: ${error instanceof Error ? error.message : "Unknown error"}`,
        transcript: null,
      }
    }
  }
  static async getTranscriptV2(videoId: string): Promise<string | null> {
    try {
      const transcript = await this.supadata.youtube.transcript({
        videoId: videoId,
      })

      if (!transcript) {
        console.warn(`No transcript found for video ID: ${videoId}`)
        return null
      }

      // Assuming the transcript is an array of objects with 'text' property
      if (Array.isArray(transcript)) {
        return transcript.map((item) => item.text).join(" ")
      }

      // If it's already a string, return it directly
      if (typeof transcript === "string") {
        return transcript
      }

      console.warn(`Unexpected transcript format for video ID: ${videoId}`)
      return null
    } catch (error) {
      console.error(`Error fetching transcript for video ID ${videoId}:`, error)
      return null
    }
  }
  private static formatTranscript(transcript: string): string {
    return transcript.split(" ").slice(0, this.MAX_TRANSCRIPT_ITEMS).join(" ").replace(/\n/g, " ")
  }
}

export default YoutubeService

