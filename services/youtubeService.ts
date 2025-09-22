import { api } from "@/lib/api-helper"
import { YtTranscript } from "yt-transcript"
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

import { TranscriptResult, TranscriptProvider, TranscriptOptions } from '@/app/types/transcript';
import { getTranscriptWithProvider } from '@/app/services/transcript.service';

class YoutubeService {
  private static defaultTranscriptProvider: TranscriptProvider = 'youtube';
  private static transcriptFallbackOrder: TranscriptProvider[] = ['youtube', 'vosk'];
  private static YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
  private static SUPDATA_KEY = process.env.SUPDATA_KEY
  private static SUPDATA_KEY1 = process.env.SUPDATA_KEY1
  private static MAX_RETRIES = 3
  private static TIMEOUT = 30000 // 30 seconds

  private static processedVideoIds = new Set<string>()
  private static transcriptCache = new Map<string, string>()
  private static supadata: Supadata
  private static currentSupadataKey: string
  private static youtubeClient = {
    get: async (endpoint: string, options: any) => {
      const url = `https://www.googleapis.com/youtube/v3${endpoint}`
      const params = new URLSearchParams({
        key: YoutubeService.YOUTUBE_API_KEY || '',
        ...options.params
      })

      // Log only on errors
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[YouTube API] Error ${response.status}: ${errorText}`)
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    }
  }

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
      const response = await pTimeout(
        this.youtubeClient.get("/search", {
          params: {
            q: searchQuery,
            videoDuration: "long",
            videoEmbeddable: true,
            type: "video",
            maxResults: 5,
            part: "snippet",
            order: "relevance",
          },
        }),
        { milliseconds: this.TIMEOUT },
      )

      const data = response as YoutubeSearchResponse

      if (!data.items || data.items.length === 0) {
        console.warn(`[YouTube Search] No videos found for "${searchQuery}"`)
        return null
      }

      for (const item of data.items) {
        const videoId = item.id.videoId
        if (videoId && !this.processedVideoIds.has(videoId)) {
          this.processedVideoIds.add(videoId)
          return videoId
        }
      }

      console.warn(`[YouTube Search] All suitable videos already used for "${searchQuery}"`)
      return null
    } catch (error) {
      console.error(`[YouTube Search] Error searching for "${searchQuery}":`, error)
      return null
    }
  }

  static async getTranscript(videoId: string, options: TranscriptOptions = {}): Promise<TranscriptResult> {
    // Check cache first
    if (this.transcriptCache.has(videoId)) {
      return {
        status: 200,
        message: "Transcript fetched from cache.",
        transcript: this.transcriptCache.get(videoId)!,
      }
    }

    const { provider = this.defaultTranscriptProvider, preferOffline = false } = options;

    // Get list of providers to try based on preferences
    const providers = preferOffline
      ? ['vosk', 'youtube']
      : this.transcriptFallbackOrder;

    let lastError: Error | null = null;

    for (const currentProvider of providers) {
      try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const result = await getTranscriptWithProvider(videoId, videoUrl, currentProvider);

        if (result.status === 200 && result.transcript) {
          const sanitized = this.sanitizeTranscript(result.transcript);
          this.transcriptCache.set(videoId, sanitized);
          return { ...result, transcript: sanitized };
        }

        lastError = new Error(result.message);
      } catch (error) {
        lastError = error as Error;
        console.warn(`[${currentProvider.toUpperCase()}] Transcript error:`, error);
      }
    }

    console.error(`Failed to get transcript for video ${videoId} with all providers`);
    return {
      status: 500,
      message: lastError?.message || 'Failed to get transcript with all available providers',
      transcript: null,
    };
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
    try {
      // Dynamically import YoutubeLoader to avoid build-time resolution errors
      const { YoutubeLoader } = await import('@langchain/community/document_loaders/web/youtube')
      const loader = YoutubeLoader.createFromUrl(`https://youtu.be/${videoId}`, {
        language: 'en',
        addVideoInfo: false,
      })

      const docs = await loader.load()
      return docs.map((doc: any) => doc.pageContent).join(' ')
    } catch (err) {
      console.warn('LangChain YoutubeLoader unavailable or failed to load:', err)
      return null
    }
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
