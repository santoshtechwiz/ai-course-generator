import pLimit from 'p-limit';
import { MultipleChoiceQuestion } from '@/app/types/types';

import { searchYoutube } from './youtubeService';
import generateMultipleChoiceQuestions from '@/lib/chatgpt/videoQuiz';
import { getTranscriptForVideo } from '@/app/actions/youtubeTranscript';
import { YoutubeGrabTool } from '@/lib/youtubetranscript';


const limit = pLimit(1); // Limit concurrency to 1

export async function getQuestionsFromTranscript(
  transcript: string,
  courseTitle: string
): Promise<MultipleChoiceQuestion[]> {
  try {
    return await limit(() => generateMultipleChoiceQuestions(courseTitle, transcript, 5));
  } catch (error) {
    console.error('Error generating questions:', error);
    return [];
  }
}

export async function processVideoAndGenerateQuestions(
  searchQuery: string,
  courseTitle: string
): Promise<MultipleChoiceQuestion[] | null> {
  const videoId = await searchYoutube(searchQuery);
  if (!videoId) {
    console.log('No suitable video found');
    return null;
  }

  const transcript = await YoutubeGrabTool.fetchTranscript(videoId);
  if (!transcript) {
    console.log(`Failed to get transcript: ${transcript}`);
    return null;
  }
  const transcriptResponse = processTranscript(transcript);
  if (!transcriptResponse) {
    console.log(`Failed to get transcript: ${transcriptResponse}`);
    return null;
  }

  return getQuestionsFromTranscript(transcriptResponse, courseTitle);
}

function processTranscript(transcriptResponse: {
  text: string;
  offset: number;
  duration: number;
}[], limit = 300): string {
  return transcriptResponse
    .slice(0, limit)
    .map((item) => item.text.trim())
    .filter((text) => text !== "")
    .join(" ")
    .replace(/\s+/g, " ");
}