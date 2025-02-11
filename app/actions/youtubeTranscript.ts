import { YoutubeTranscript } from "@/lib/youtubetranscript";
import axios from "axios";


class TranscriptAPI {
  static async getTranscript(id, config = {}) {
        const result = await YoutubeTranscript.fetchTranscript(id, config);

        if (!result) {
          throw new Error("Failed to fetch transcript.");
        }

        const transcriptText = result
          .map(item => item.text);
         

        return transcriptText;
  }


}

export async function getTranscriptForVideo(videoId: string) {
  if (!videoId) {
    throw new Error("Missing videoId parameter");
  }

  try {
    const transcript = await TranscriptAPI.getTranscript(videoId);

    if (!transcript || transcript.length === 0) {
      throw new Error("No transcript available.");
    }

    // Limit the number of transcript items (e.g., first 300 items)
    const limitedTranscript = transcript.slice(0, 300);
    
    const transcriptText = limitedTranscript
      .map(item => item)
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