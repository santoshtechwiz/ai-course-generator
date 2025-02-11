import axios, { AxiosRequestConfig } from "axios";
import * as cheerio from "cheerio";
import { YoutubeTranscript } from "youtube-transcript";
import { retry } from "ts-retry-promise";

interface TranscriptItem {
  text: string;
  start: number;
  duration: number;
}

interface TranscriptResponse {
  status: number;
  message: string;
  transcript: string;
}

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

  static async validateID(id: string, config: AxiosRequestConfig = {}): Promise<boolean> {
    const url = new URL('https://video.google.com/timedtext');
    url.searchParams.set('type', 'track');
    url.searchParams.set('v', id);
    url.searchParams.set('id', '0');
    url.searchParams.set('lang', 'en');

    try {
      await axios.get(url.toString(), config);
      return true;
    } catch (_) {
      return false;
    }
  }
}

async function getTranscriptUsingLibrary(videoId: string): Promise<TranscriptResponse> {
  const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
  const processedTranscript = processTranscript(transcript);

  return {
    status: 200,
    message: "Transcript fetched successfully using library method.",
    transcript: processedTranscript,
  };
}

async function getTranscriptUsingCustomAPI(videoId: string): Promise<TranscriptResponse> {
  const transcript = await TranscriptAPI.getTranscript(videoId);
  const processedTranscript = processTranscript(transcript);

  return {
    status: 200,
    message: "Transcript fetched successfully using custom API method.",
    transcript: processedTranscript,
  };
}

function processTranscript(transcript: TranscriptItem[], limit = 300): string {
  return transcript
    .slice(0, limit)
    .map((item) => item.text.trim())
    .filter((text) => text !== "")
    .join(" ")
    .replace(/\s+/g, " ");
}

async function isTranscriptAvailable(videoId: string): Promise<boolean> {
  try {
    return true;
  } catch (captionsError) {
    console.log("Captions list check failed")
    return false;
  }
}



export async function getTranscriptForVideo(videoId: string): Promise<TranscriptResponse> {
  if (!videoId) {
    throw new Error("Missing videoId parameter");
  }

  let transcriptResponse: TranscriptResponse = {
    status: 500,
    message: "Transcript fetching failed.",
    transcript: "",
  };

  try {
    // Check if transcript is available
    const isAvailable = await isTranscriptAvailable(videoId);
    if (!isAvailable) {
      console.warn("Transcript is not available for this video.");
      return transcriptResponse;
    }

    // Try using the library first with retry policy
    transcriptResponse = await retry(() => getTranscriptUsingLibrary(videoId), {
      retries: 3,
      delay: 1000,
      backoff: 'LINEAR'
    });
  } catch (libraryError) {
    console.warn("Library method failed, falling back to custom API:", libraryError);
    try {
      // Fallback to custom API with retry policy
      transcriptResponse = await retry(() => getTranscriptUsingCustomAPI(videoId), {
        retries: 3,
        delay: 1000,
        backoff: 'LINEAR'
      });
    } catch (apiError) {
      console.warn("Both transcript fetching methods failed:", apiError);
      
    }
  }

  

  return transcriptResponse;
}