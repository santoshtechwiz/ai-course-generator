import { TranscriptProvider } from '@/app/types/transcript';
import { TranscriptResult } from '@/app/types/transcript';
import YoutubeService from '@/services/youtubeService';

// // Helper functions for fetching from different providers
// export async function getVoskTranscript(videoId: string, videoUrl: string): Promise<TranscriptResult> {
//   try {
//     const result = await voskService.transcribeVideo(videoUrl);

//     if (result.status === 'failed') {
//       return {
//         status: 500,
//         message: result.error || 'Failed to generate transcript using Vosk',
//         transcript: null,
//       };
//     }

//     return {
//       status: 200,
//       message: 'Transcript generated successfully using Vosk',
//       transcript: result.transcript,
//     };
//   } catch (error) {
//     return {
//       status: 500,
//       message: error instanceof Error ? error.message : 'Unknown error in Vosk transcript generation',
//       transcript: null,
//     };
//   }
// }

export async function getTranscriptWithProvider(
  videoId: string,
  videoUrl: string,
  provider: TranscriptProvider
): Promise<TranscriptResult> {

  return YoutubeService.fetchTranscript(videoId);
}


