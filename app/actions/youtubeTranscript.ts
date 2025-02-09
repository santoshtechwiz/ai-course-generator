import axios from "axios";
import * as cheerio from "cheerio";

class TranscriptAPI {
  static async getTranscript(id, config = {}) {
    const url = new URL('https://youtubetranscript.com');
    url.searchParams.set('server_vid2', id);

    const
      response = await axios.get(url, config),
      $ = cheerio.load(response.data, undefined, false),
      err = $('error');

    if (err.length) throw new Error(err.text());
    return $('transcript text').map((i, elem) => {
      const $a = $(elem);
      return {
        text: $a.text(),
        start: Number($a.attr('start')),
        duration: Number($a.attr('dur'))
      };
    }).toArray();
  }

  static async validateID(id, config = {}) {
    const url = new URL('https://video.google.com/timedtext');
    url.searchParams.set('type', 'track');
    url.searchParams.set('v', id);
    url.searchParams.set('id', 0);
    url.searchParams.set('lang', 'en');

    try {
      await axios.get(url, config);
      return !0;
    } catch (_) {
      return !1;
    }
  }
}

export async function getTranscriptForVideo(videoId: string) {
  if (!videoId) {
    throw new Error("Missing videoId parameter");
  }

  try {
    const transcript = await TranscriptAPI.getTranscript(videoId);

    if (!transcript || transcript.length === 0) {
      console.warn("No transcript available.");
      return {
        status: 404,
        message: "No transcript available.",
        transcript: null,
      };
    }

    // Limit the number of transcript items (e.g., first 300 items)
    const limitedTranscript = transcript.slice(0, 300);

    const transcriptText = limitedTranscript
      .map(item => item.text)
      .filter((text: string) => text.trim() !== '') // Remove empty strings
      .join(' ')
      .replace(/\n/g, ' ');

    return {
      status: 200,
      message: "Transcript fetched successfully (limited to 300 items).",
      transcript: transcriptText,
    };
  } catch (error) {
    console.warn("Error in getTranscriptForVideo:", error)
    return {
      status: 500,
      message: `Error processing transcript: ${error instanceof Error ? error.message : "Unknown error"}`,
      transcript: null,
    }

  }
}