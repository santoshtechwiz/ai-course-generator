import axios from "axios"
import * as cheerio from "cheerio"

class TranscriptAPI {
  static async getTranscript(id: string, config = {}) {
    const url = new URL("https://youtubetranscript.com")
    url.searchParams.set("server_vid2", id)

    try {
      const response = await axios.get(url.toString(), config)
      const $ = cheerio.load(response.data, undefined, false)
      const err = $("error")

      if (err.length) {
        return null // Return null instead of throwing an error
      }

      return $("transcript text")
        .map((i, elem) => {
          const $a = $(elem)
          return {
            text: $a.text(),
            start: Number($a.attr("start")),
            duration: Number($a.attr("dur")),
          }
        })
        .toArray()
    } catch (error) {
      console.warn(`Error fetching transcript: ${error instanceof Error ? error.message : "Unknown error"}`)
      return null // Return null on any error
    }
  }

  static async validateID(id: string, config = {}) {
    const url = new URL("https://video.google.com/timedtext")
    url.searchParams.set("type", "track")
    url.searchParams.set("v", id)
    url.searchParams.set("id", "0")
    url.searchParams.set("lang", "en")

    try {
      await axios.get(url.toString(), config)
      return true
    } catch (_) {
      return false
    }
  }
}

export async function getTranscriptForVideo(videoId: string) {
  if (!videoId) {
    return {
      status: 400,
      message: "Missing videoId parameter",
      transcript: null,
    }
  }

  try {
    const transcript = await TranscriptAPI.getTranscript(videoId)

    if (!transcript || transcript.length === 0) {
      return {
        status: 404,
        message: "No transcript available for this video.",
        transcript: null,
      }
    }

    // Limit the number of transcript items (e.g., first 300 items)
    const limitedTranscript = transcript.slice(0, 300)

    const transcriptText = limitedTranscript
      .map((item) => item?.text ?? "")
      .filter((text: string) => text.trim() !== "")
      .join(" ")
      .replace(/\n/g, " ")

    return {
      status: 200,
      message: "Transcript fetched successfully (limited to 300 items).",
      transcript: transcriptText,
    }
  } catch (error) {
    console.warn("Error in getTranscriptForVideo:", error)
    return {
      status: 500,
      message: `Error processing transcript: ${error instanceof Error ? error.message : "Unknown error"}`,
      transcript: null,
    }
  }
}

