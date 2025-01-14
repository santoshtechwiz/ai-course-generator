import axios from 'axios';
import { YoutubeGrabTool } from '@/lib/youtubetranscript';
import { YoutubeSearchResponse, TranscriptItem, TranscriptResponse } from '@/app/types';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const processedVideoIds = new Set<string>();
const youtubeClient = axios.create({
  baseURL: 'https://www.googleapis.com/youtube/v3',
  params: { key: YOUTUBE_API_KEY },
});

export async function searchYoutube(searchQuery: string): Promise<string | null> {
  try {
    const { data } = await youtubeClient.get<YoutubeSearchResponse>('/search', {
      params: {
        q: searchQuery,
        videoDuration: 'long',
        videoEmbeddable: true,
        type: 'video',
        maxResults: 5,
      },
    });

    for (const item of data.items) {
      const videoId = item.id.videoId;
      if (!processedVideoIds.has(videoId)) {
        processedVideoIds.add(videoId);
        return videoId;
      }
    }

    console.log("All videos in the search results have been processed");
    return null;
  } catch (error) {
    console.error('Error in YouTube search:', error);
    return null;
  }
}

async function getCaptionTracks(videoId: string) {
  const { data } = await youtubeClient.get('/captions', {
    params: { part: 'snippet', videoId },
  });

  return data.items.map((item: any) => ({
    language: item.snippet.language,
    trackKind: item.snippet.trackKind,
  }));
}

export async function getTranscript(videoId: string): Promise<TranscriptResponse> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const captionTracks = await getCaptionTracks(videoId);

      if (captionTracks.length === 0) {
        return { status: 204, message: 'No captions available.' };
      }

      const englishTrack = captionTracks.find(track => track.language === 'en') || captionTracks[0];

      const transcriptItems = await YoutubeGrabTool.fetchTranscript(videoId, {
        lang: englishTrack.language,
      }) as TranscriptItem[] | null;

      if (!transcriptItems?.length) {
        return { status: 204, message: 'No transcript available.' };
      }

      const transcript = transcriptItems.map(t => t.text).join(' ').replace(/\n/g, ' ');
      return { status: 200, message: 'Transcript fetched successfully.', transcript };
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        console.error(`Error fetching transcript for video ${videoId}:`, error);
        return { status: 500, message: `Error fetching transcript: ${error.message}` };
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }

  throw new Error('Unexpected error in getTranscript');
}

