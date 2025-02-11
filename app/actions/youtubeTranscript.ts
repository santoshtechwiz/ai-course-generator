import axios from "axios"
import * as cheerio from "cheerio"
import { YoutubeTranscript } from "youtube-transcript"

interface TranscriptItem {
  text: string
  start: number
  duration: number
}

interface TranscriptResponse {
  status: number
  message: string
  transcript: string
}

class TranscriptAPI {
  static async getTranscript(id: string, config = {}): Promise<TranscriptItem[]> {
    const url = new URL("https://youtubetranscript.com")
    url.searchParams.set("server_vid2", id)

    const response = await axios.get(url.toString(), config)
    const $ = cheerio.load(response.data, undefined, false)
    const err = $("error")

    if (err.length) throw new Error(err.text())

    return $("transcript text")
      .map((_, elem) => {
        const $a = $(elem)
        return {
          text: $a.text(),
          start: Number($a.attr("start")),
          duration: Number($a.attr("dur")),
        }
      })
      .get()
  }
}

async function getTranscriptUsingLibrary(videoId: string): Promise<TranscriptResponse> {
  const transcript = await YoutubeTranscript.fetchTranscript(videoId)
  const processedTranscript = processTranscript(transcript)

  return {
    status: 200,
    message: "Transcript fetched successfully using library method.",
    transcript: processedTranscript,
  }
}

async function getTranscriptUsingCustomAPI(videoId: string): Promise<TranscriptResponse> {
  const transcript = await TranscriptAPI.getTranscript(videoId)
  const processedTranscript = processTranscript(transcript)

  return {
    status: 200,
    message: "Transcript fetched successfully using custom API method.",
    transcript: processedTranscript,
  }
}

function processTranscript(transcript: TranscriptItem[], limit = 300): string {
  return transcript
    .slice(0, limit)
    .map((item) => item.text.trim())
    .filter((text) => text !== "")
    .join(" ")
    .replace(/\s+/g, " ")
}

export async function getTranscriptForVideo(videoId: string): Promise<TranscriptResponse> {
  if (!videoId) {
    throw new Error("Missing videoId parameter")
  }

  let transcriptResponse: TranscriptResponse

  try {
    // Try using the library first
    transcriptResponse = await getTranscriptUsingLibrary(videoId)
  } catch (libraryError) {
    console.warn("Library method failed, falling back to custom API:", libraryError)
    try {
      // Fallback to custom API
      transcriptResponse = await getTranscriptUsingCustomAPI(videoId)
    } catch (apiError) {
      console.error("Both transcript fetching methods failed:", apiError)
      throw new Error("Failed to fetch transcript using both methods")
    }
  }

  if (!transcriptResponse.transcript) {
    throw new Error("No transcript available.")
  }

  return transcriptResponse
}

