import axios, { type AxiosInstance, type AxiosResponse } from "axios"
import { YtTranscript } from "yt-transcript"
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube"
import { Supadata, type TranscriptChunk } from "@supadata/js"
import pRetry from "p-retry"
import pTimeout from "p-timeout"

export interface YoutubeSearchResponse {
  items: Array<{
    id: {
      videoId: string
    }
  }>
}

export interface TranscriptResult {
  status: number
  message: string
  transcript: string | null
}

class YoutubeService {
  private static YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
  private static SUPDATA_KEY = process.env.SUPDATA_KEY
  private static SUPDATA_KEY1 = process.env.SUPDATA_KEY1
  private static MAX_RETRIES = 3
  private static TIMEOUT = 30000 // 30 seconds

  private static processedVideoIds = new Set<string>()
  private static transcriptCache = new Map<string, string>()
  private static supadata: Supadata
  private static currentSupadataKey: string
  private static youtubeClient: AxiosInstance = axios.create({
    baseURL: "https://www.googleapis.com/youtube/v3",
    params: { key: YoutubeService.YOUTUBE_API_KEY },
  })

  static {
    this.currentSupadataKey = this.SUPDATA_KEY || ""
    this.initializeSupadata()
  }

  private static initializeSupadata() {
    this.supadata = new Supadata({
      apiKey: this.currentSupadataKey,
    })
  }

  private static switchSupadataKey() {
    this.currentSupadataKey =
      this.currentSupadataKey === this.SUPDATA_KEY ? this.SUPDATA_KEY1 || "" : this.SUPDATA_KEY || ""
    this.initializeSupadata()
  }

  static async searchYoutube(searchQuery: string): Promise<string | null> {
    try {
      const response: AxiosResponse<YoutubeSearchResponse> = await pTimeout(
        this.youtubeClient.get<YoutubeSearchResponse>("/search", {
          params: {
            q: searchQuery,
            videoDuration: "long",
            videoEmbeddable: true,
            type: "video",
            maxResults: 5,
          },
        }),
        { milliseconds: this.TIMEOUT },
      )

      for (const item of response.data.items) {
        const videoId = item.id.videoId
        if (!this.processedVideoIds.has(videoId)) {
          this.processedVideoIds.add(videoId)
          return videoId
        }
      }

      return null
    } catch (error) {
      console.warn("Error in YouTube search:", error)
      return null
    }
  }

  static async getTranscript(videoId: string): Promise<TranscriptResult> {
    // Check cache first
    if (this.transcriptCache.has(videoId)) {
      return {
        status: 200,
        message: "Transcript fetched from cache.",
        transcript: this.transcriptCache.get(videoId)!,
      }
    }

    try {
      const transcriptResult = await pRetry(
        () => pTimeout(this.fetchTranscript(videoId), { milliseconds: this.TIMEOUT }),
        {
          retries: this.MAX_RETRIES,
          onFailedAttempt: (error) => {
            if (error.message.includes("Supadata API key error")) {
              this.switchSupadataKey()
            }
          },
        },
      )

      if (transcriptResult.transcript) {
        this.transcriptCache.set(videoId, transcriptResult.transcript)
      }
      return transcriptResult
    } catch (error) {
      console.warn(`Error fetching transcript for video ${videoId}:`, error)
      return {
        status: 500,
        message: `Error fetching transcript: ${error instanceof Error ? error.message : "Unknown error"}`,
        transcript: null,
      }
    }
  }

  private static async fetchTranscript(videoId: string): Promise<TranscriptResult> {
    const methods = [this.getYtTranscript, this.getLangchainTranscript, this.getSupadataTranscript]

    for (const method of methods) {
      try {
        const transcript = await method.call(this, videoId)
        if (transcript) {
          return {
            status: 200,
            message: "Transcript fetched successfully.",
            transcript,
          }
        }
      } catch (error) {
        console.warn(`Error fetching transcript using ${method.name}:`, error)
        if (method.name === "getSupadataTranscript" && error instanceof Error && error.message.includes("API key")) {
          throw new Error("Supadata API key error")
        }
      }
    }

    throw new Error("No transcript found for video")
  }

  private static async getLangchainTranscript(videoId: string): Promise<string | null> {
    const loader = YoutubeLoader.createFromUrl(`https://youtu.be/${videoId}`, {
      language: "en",
      addVideoInfo: false,
    })

    const docs = await loader.load()
    return docs.map((doc) => doc.pageContent).join(" ")
  }

  private static async getSupadataTranscript(videoId: string): Promise<string | null> {
    const transcript = await this.supadata.youtube.transcript({
      videoId: videoId,
      lang: "en",
      text: true,
    })

    if (!transcript) {
      return null
    }

    if (Array.isArray(transcript.content)) {
      return transcript.content.map((item: TranscriptChunk) => item.text).join(" ")
    }

    if (typeof transcript === "string") {
      return transcript
    }

    return null
  }

  private static async getYtTranscript(videoId: string): Promise<string | null> {
    const transcript = await new YtTranscript({ videoId }).getTranscript()
    return transcript ? transcript.map((item) => item.text).join(" ") : null
  }
}

export default YoutubeService

