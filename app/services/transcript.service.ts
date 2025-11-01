import { TranscriptProvider } from '@/app/types/transcript';
import { TranscriptResult } from '@/app/types/transcript';
import YoutubeService from '@/services/youtubeService';



export async function getTranscriptWithProvider(
  videoId: string,
  videoUrl: string,
  provider: TranscriptProvider
): Promise<TranscriptResult> {

  return YoutubeService.fetchTranscript(videoId);
}


