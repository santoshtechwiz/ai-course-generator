import axios, { type AxiosInstance, type AxiosResponse } from "axios"
import { YtTranscript } from "yt-transcript"
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube"
import { Supadata, type TranscriptChunk } from "@supadata/js"
import pRetry from "p-retry"
import pTimeout from "p-timeout"
import { Innertube } from "youtubei.js"

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

  // Optional provider tokens (kept in memory)
  private static youtubeCookie: string | undefined

  static {
    this.currentSupadataKey = this.SUPDATA_KEY || ""
    this.initializeSupadata()
  }

  /**
   * Allow runtime configuration of provider tokens without breaking current env-based flow
   */
  static setToken(provider: "supadata" | "youtubei", token: string) {
    if (provider === "supadata") {
      this.currentSupadataKey = token
      this.initializeSupadata()
    }
    if (provider === "youtubei") {
      this.youtubeCookie = token
    }
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
        // Sanitize for better markdown summarization
        const sanitized = this.sanitizeTranscript(transcriptResult.transcript)
        this.transcriptCache.set(videoId, sanitized)
        return { ...transcriptResult, transcript: sanitized }
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

  static async fetchTranscript(videoId: string): Promise<TranscriptResult> {
    // Try multiple providers with graceful fallback
    const methods = [this.getYouTubeiTranscript, this.getYtTranscript, this.getLangchainTranscript, this.getSupadataTranscript]

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
    try {
      const transcript = await new YtTranscript({ videoId }).getTranscript()
      return transcript ? transcript.map((item) => item?.text).join(" ") : null
    } catch (error) {
      console.warn('YtTranscript error:', error)
      return null
    }
  }

  // youtubei.js fallback (supports cookie token if provided)
  private static async getYouTubeiTranscript(videoId: string): Promise<string | null> {
    try {
      const yt = await Innertube.create({
        cookie: this.youtubeCookie,
      })
      
      // Add parser error handling
      try {
        const info = await yt.getInfo(videoId)
        const tracks = info?.captions?.captionTracks || []
        const enTrack = tracks.find((t: any) => (t.language_code || t.languageCode || "").startsWith("en")) || tracks[0]
        if (!enTrack) return null
        const transcript = await enTrack.fetch()
        // transcript.events: [{segs:[{utf8: "text"}], tStartMs, dDurationMs}, ...]
        if (transcript?.events?.length) {
          return transcript.events
            .map((e: any) => (e?.segs || []).map((s: any) => s?.utf8 || "").join(" "))
            .filter(Boolean)
            .join(" ")
        }
        // Some tracks return .segments
        if (transcript?.segments?.length) {
          return transcript.segments.map((s: any) => s?.utf8 || s?.text || "").join(" ")
        }
        return null
      } catch (parserError) {
        // Handle YouTube.js parser errors gracefully
        console.warn('YouTube.js parser error:', parserError)
        if (parserError instanceof Error && parserError.message.includes('CompositeVideoPrimaryInfo')) {
          console.warn('YouTube.js parser needs update for this video format')
        }
        return null
      }
    } catch (err) {
      // Silent fail to allow other methods
      console.warn('YouTube.js initialization error:', err)
      return null
    }
  }

  // Normalize and clean transcript prior to summarization
  private static sanitizeTranscript(raw: string): string {
    if (!raw) return ""
    let text = raw
      // Remove timestamps like 00:12 or 01:02:33
      .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, " ")
      // Remove bracketed or parenthetical cues [Music], (applause), [Laughter]
      .replace(/\[(music|applause|laughter|noise|intro|outro)]/gi, " ")
      .replace(/\((music|applause|laughter|noise|intro|outro)\)/gi, " ")
      // Collapse repeated whitespace/newlines
      .replace(/\s+/g, " ")
      .trim()

    // Guard too-short content
    if (text.length < 20) return raw.trim()
    return text
  }
}

export default YoutubeService
