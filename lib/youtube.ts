// import axios from "axios";
// import { YoutubeGrabTool } from "@/lib/youtubetranscript";
// import https from "https";
// import { generateMultipeChoiceQuestionForVideo } from "./chatgpt/videoQuiz";
// import Semaphore from "./semaphore";
// import { MultipleChoiceQuestion, TranscriptItem, TranscriptResponse, YoutubeSearchResponse } from "@/app/types/model";

// const agent = new https.Agent({
//   rejectUnauthorized: false,
// });

// const processedVideoIds = new Set<string>();
// const MAX_RETRIES = 3;
// const RETRY_DELAY = 1000; // 1 second

// async function delay(ms: number) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// export async function searchYoutube(searchQuery: string): Promise<string | null> {
//   try {
//     searchQuery = encodeURIComponent(searchQuery);
//     const { data } = await axios.get<YoutubeSearchResponse>(
//       `https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBE_API_KEY}&q=${searchQuery}&videoDuration=long&videoEmbeddable=true&type=video&maxResults=5`,
//       { httpsAgent: agent }
//     );

//     if (!data?.items?.length) {
//       console.log("YouTube search failed");
//       return null;
//     }

//     for (const item of data.items) {
//       const videoId = item.id.videoId;
//       if (!processedVideoIds.has(videoId)) {
//         processedVideoIds.add(videoId);
//         return videoId;
//       }
//     }

//     console.log("All videos in the search results have been processed");
//     return null;
//   } catch (error) {
//     console.error(`Error occurred in searchYoutube: ${error}`);
//     return null;
//   }
// }

// async function getCaptionTracks(videoId: string) {
//   const url = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${process.env.YOUTUBE_API_KEY}`;

//   const response = await axios.get(url, { httpsAgent: agent });
//   return response.data.items.map((item: any) => ({
//     language: item.snippet.language,
//     trackKind: item.snippet.trackKind,
//   }));
// }

// export async function getTranscript(videoId: string): Promise<TranscriptResponse> {
//   for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
//     try {
//       const captionTracks = await getCaptionTracks(videoId);

//       if (captionTracks.length === 0) {
//         return {
//           status: 204,
//           message: "No captions available for the provided video ID.",
//         };
//       }

//       const englishTrack = captionTracks.find(track => track.language === 'en') || captionTracks[0];

//       const transcript_arr = await YoutubeGrabTool.fetchTranscript(videoId, {
//         lang: englishTrack.language,
//       }) as TranscriptItem[] | null;

//       if (!transcript_arr?.length) {
//         return {
//           status: 204,
//           message: "No transcript available for the provided video ID.",
//         };
//       }

//       const transcript = transcript_arr.map(t => t.text).join(" ").replace(/\n/g, " ");
//       return {
//         status: 200,
//         message: "Transcript fetched successfully.",
//         transcript,
//       };
//     } catch (error: any) {
//       if (attempt === MAX_RETRIES) {
//         console.error(`Error occurred in getTranscript for video ID ${videoId}: ${error.message}`);
//         return {
//           status: 500,
//           message: `Error fetching transcript: ${error.message}`,
//         };
//       }
//       console.warn(`Attempt ${attempt} failed. Retrying...`);
//       await delay(RETRY_DELAY);
//     }
//   }

//   throw new Error("Unexpected error in getTranscript");
// }

// export async function getQuestionsFromTranscript(
//   transcript: string,
//   course_title: string
// ): Promise<MultipleChoiceQuestion[]> {
//   const semaphore = new Semaphore(1);

//   try {
//     await semaphore.acquire();
//     const questions = await generateMultipeChoiceQuestionForVideo(course_title, transcript, 5);
//     return questions;
//   } catch (error: unknown) {
//     console.error(`Error occurred in getQuestionsFromTranscript: ${error}`);
//     return [];
//   } finally {
//     semaphore.release();
//   }
// }

// export async function processVideoAndGenerateQuestions(searchQuery: string, course_title: string): Promise<Question[] | null> {
//   const videoId = await searchYoutube(searchQuery);
//   if (!videoId) {
//     console.log("No suitable video found");
//     return null;
//   }

//   const transcriptResponse = await getTranscript(videoId);
//   if (transcriptResponse.status !== 200 || !transcriptResponse.transcript) {
//     console.log(`Failed to get transcript: ${transcriptResponse.message}`);
//     return null;
//   }

//   return getQuestionsFromTranscript(transcriptResponse.transcript, course_title);
// }

