// import axios, { type AxiosInstance } from "axios"
// import { YtTranscript } from 'yt-transcript';
// import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";


// import { Supadata, TranscriptChunk } from "@supadata/js"
// export interface YoutubeSearchResponse {
//   items: Array<{
//     id: {
//       videoId: string
//     }
//   }>
// }

// export interface TranscriptResponse {
//   status: number
//   message: string
//   transcript: string | null
// }

// interface CaptionTrack {
//   language: string
//   trackKind: string
// }

// class YoutubeService {
//   private static YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
//   private static MAX_RETRIES = 3
//   private static RETRY_DELAY = 1000 // 1 second

//   private static processedVideoIds = new Set<string>()
//   private static supadata: Supadata
//   private static youtubeClient: AxiosInstance = axios.create({
//     baseURL: "https://www.googleapis.com/youtube/v3",
//     params: { key: YoutubeService.YOUTUBE_API_KEY },
//   })

//   static {
//     this.supadata = new Supadata({
//       apiKey: process.env.SUPDATA_KEY || "",
//     })

//   }

//   static async searchYoutube(searchQuery: string): Promise<string | null> {
//     try {
//       const { data } = await this.youtubeClient.get<YoutubeSearchResponse>("/search", {
//         params: {
//           q: searchQuery,
//           videoDuration: "long",
//           videoEmbeddable: true,
//           type: "video",
//           maxResults: 5,
//         },
//       })

//       for (const item of data.items) {
//         const videoId = item.id.videoId
//         if (!this.processedVideoIds.has(videoId)) {
//           this.processedVideoIds.add(videoId)
//           return videoId
//         }
//       }

//       console.log("All videos in the search results have been processed")
//       return null
//     } catch (error) {
//       console.warn("Error in YouTube search:", error)
//       return null
//     }
//   }

//   static async getTranscript(videoId: string): Promise<TranscriptResponse> {
//     for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
//       try {
//         const captionTracks = await this.getCaptionTracks(videoId)

//         if (captionTracks.length === 0) {
//           return { status: 204, message: "No captions available.", transcript: null }
//         }

//         const englishTrack = captionTracks.find((track) => track.language === "en") || captionTracks[0]

//         const transcriptResult = await this.fetchTranscript(videoId)
//         if (!transcriptResult || !transcriptResult.transcript) {
//           return { status: 204, message: "No transcript available.", transcript: null }
//         }

//         return { status: 200, message: "Transcript fetched successfully.", transcript: transcriptResult.transcript }
//       } catch (error) {
//         if (attempt === this.MAX_RETRIES) {
//           console.warn(`Error fetching transcript for video ${videoId}:`, error)
//           return {
//             status: 500,
//             message: `Error fetching transcript: ${error instanceof Error ? error.message : "Unknown error"}`,
//             transcript: null,
//           }
//         }
//         await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY))
//       }
//     }

//     throw new Error("Unexpected error in getTranscript")
//   }

//   static async fetchTranscript(videoId: string): Promise<{ transcript: string } | null> {
//     console.log("Fetching transcript for video ID:", videoId)
//     let transcript: any[] | null = null;
//     try {
   
//       transcript = await this.getTranscriptV3(videoId);;
     

//       if (!transcript || transcript.length === 0) {
//         throw new Error("No captions available for this video.");
//       }

//       return {
//         transcript: transcript.map((item) => item.text).join(" "),
//       };
//     } catch (error) {
//       console.warn("Failed to fetch transcript:", error);
//       transcript = await this.getTranscriptV3(videoId);
      
//     }
//     return transcript ? { transcript: transcript.join(" ") } : null;
//   }

//   private static async getCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
//     const { data } = await this.youtubeClient.get("/captions", {
//       params: { part: "snippet", videoId },
//     })

//     return data.items.map((item: any) => ({
//       language: item.snippet.language,
//       trackKind: item.snippet.trackKind,
//     }))
//   }

//   static async getTranscriptForVideo(videoId: string): Promise<TranscriptResponse> {
//     if (!videoId) {
//       console.warn("No videoId provided to getTranscriptForVideo")
//       return {
//         status: 400,
//         message: "No videoId provided",
//         transcript: null,
//       }
//     }

//     try {
//       const result = await this.fetchTranscript(videoId)

//       if (!result || !result.transcript) {
//         console.warn("No transcript found for video", videoId)
//         return {
//           status: 404,
//           message: "No transcript found for video",
//           transcript: null,
//         }
//       }

//       const transcriptText = result.transcript;

//       return {
//         status: 200,
//         message: `Transcript fetched successfully.`,
//         transcript: transcriptText,
//       }
//     } catch (error) {
//       console.warn("Error in getTranscriptForVideo:", error)
//       return {
//         status: 500,
//         message: `Error processing transcript: ${error instanceof Error ? error.message : "Unknown error"}`,
//         transcript: null,
//       }
//     }
//   }
//   static async getTranscriptV3(videoId: string): Promise<string[] | null> {
//     {
//       const loader = YoutubeLoader.createFromUrl(`https://youtu.be/${videoId}`, {
//         language: "en",
//         addVideoInfo: true,
//       });
      
//       const docs = await loader.load();
//       console.log(docs);
//       return docs.map((doc) => typeof doc.pageContent === 'string' ? doc.pageContent : '');
//     }
//   }
//   static async getTranscriptV2(videoId: string): Promise<string[] | null> {
//     try {
//       const transcript = await this.supadata.youtube.transcript({
//         videoId: videoId,
//       })

//       if (!transcript) {
//         console.warn(`No transcript found for video ID: ${videoId}`)
//         return null
//       }

//       // Assuming the transcript is an array of objects with 'text' property
//       if (Array.isArray(transcript.content)) {
//         return transcript.content.map((item:TranscriptChunk) => item.text);
//       }

//       // If it's already a string, return it directly
//       if (typeof transcript === "string") {
//         return transcript
//       }

//       console.warn(`Unexpected transcript format for video ID: ${videoId}`)
//       return null
//     } catch (error) {
//       console.warn(`Error fetching transcript for video ID ${videoId}:`, error)
//       return null
//     }
//   }
 
// }

// export default YoutubeService


import axios, { type AxiosInstance } from "axios";
import { YtTranscript } from 'yt-transcript';
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { Supadata, TranscriptChunk } from "@supadata/js";

export interface YoutubeSearchResponse {
  items: Array<{
    id: {
      videoId: string;
    };
  }>;
}

export interface TranscriptResult {
  status: number;
  message: string;
  transcript: string | null;
}

interface CaptionTrack {
  language: string;
  trackKind: string;
}

class YoutubeService {
  private static YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  private static MAX_RETRIES = 3;
  private static RETRY_DELAY = 1000; // 1 second
  private static IS_PRODUCTION = process.env.NODE_ENV === 'production';

  private static processedVideoIds = new Set<string>();
  private static supadata: Supadata;
  private static youtubeClient: AxiosInstance = axios.create({
    baseURL: "https://www.googleapis.com/youtube/v3",
    params: { key: YoutubeService.YOUTUBE_API_KEY },
  });

  static {
    this.supadata = new Supadata({
      apiKey: process.env.SUPDATA_KEY || "",
    });
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
      });

      for (const item of data.items) {
        const videoId = item.id.videoId;
        if (!this.processedVideoIds.has(videoId)) {
          this.processedVideoIds.add(videoId);
          return videoId;
        }
      }

      console.log("All videos in the search results have been processed");
      return null;
    } catch (error) {
      console.warn("Error in YouTube search:", error);
      return null;
    }
  }

  static async getTranscript(videoId: string): Promise<TranscriptResult> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const transcriptResult = await this.fetchTranscript(videoId);
        return transcriptResult;
      } catch (error) {
        if (attempt === this.MAX_RETRIES) {
          console.warn(`Error fetching transcript for video ${videoId}:`, error);
          return {
            status: 500,
            message: `Error fetching transcript: ${error instanceof Error ? error.message : "Unknown error"}`,
            transcript: null,
          };
        }
        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));
      }
    }

    throw new Error("Unexpected error in getTranscript");
  }

  private static async fetchTranscript(videoId: string): Promise<TranscriptResult> {
    console.log("Fetching transcript for video ID:", videoId);
    let transcript: string | null = null;

    try {
      if (this.IS_PRODUCTION) {
        transcript = await this.getProductionTranscript(videoId);
      } else {
        transcript = await this.getDevelopmentTranscript(videoId);
      }

      if (!transcript) {
        throw new Error("No captions available for this video.");
      }

      return {
        status: 200,
        message: "Transcript fetched successfully.",
        transcript,
      };
    } catch (error) {
      console.warn("Failed to fetch transcript:", error);
      return {
        status: 404,
        message: "No transcript found for video",
        transcript: null,
      };
    }
  }

  private static async getProductionTranscript(videoId: string): Promise<string | null> {
    try {
      const langchainTranscript = await this.getLangchainTranscript(videoId);
      if (langchainTranscript) return langchainTranscript;

      const supadataTranscript = await this.getSupadataTranscript(videoId);
      if (supadataTranscript) return supadataTranscript;

      return null;
    } catch (error) {
      console.warn("Error fetching production transcript:", error);
      return null;
    }
  }

  private static async getDevelopmentTranscript(videoId: string): Promise<string | null> {
    try {
      const transcript = await new YtTranscript({ videoId }).getTranscript();
      return transcript ? transcript.map((item) => item.text).join(" ") : null;
    } catch (error) {
      console.warn("Error fetching development transcript:", error);
      return null;
    }
  }

  private static async getLangchainTranscript(videoId: string): Promise<string | null> {
    try {
      const loader = YoutubeLoader.createFromUrl(`https://youtu.be/${videoId}`, {
        language: "en",
        addVideoInfo: true,
      });
      
      const docs = await loader.load();
      return docs.map((doc) => typeof doc.pageContent === 'string' ? doc.pageContent : '').join(" ");
    } catch (error) {
      console.warn("Error fetching Langchain transcript:", error);
      return null;
    }
  }

  private static async getSupadataTranscript(videoId: string): Promise<string | null> {
    try {
      const transcript = await this.supadata.youtube.transcript({
        videoId: videoId,
      });

      if (!transcript) {
        console.warn(`No transcript found for video ID: ${videoId}`);
        return null;
      }

      if (Array.isArray(transcript.content)) {
        return transcript.content.map((item: TranscriptChunk) => item.text).join(" ");
      }

      if (typeof transcript === "string") {
        return transcript;
      }

      console.warn(`Unexpected transcript format for video ID: ${videoId}`);
      return null;
    } catch (error) {
      console.warn(`Error fetching Supadata transcript for video ID ${videoId}:`, error);
      return null;
    }
  }
}

export default YoutubeService;
