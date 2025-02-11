import pLimit from 'p-limit';
import { MultipleChoiceQuestion } from '@/app/types/types';

import generateMultipleChoiceQuestions from '@/lib/chatgpt/videoQuiz';
import YoutubeService from './youtubeService';


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
  const videoId = await YoutubeService.searchYoutube(searchQuery);
  if (!videoId) {
    console.log('No suitable video found');
    return null;
  }

  const transcriptResponse = await YoutubeService.getTranscript(videoId);
  if (transcriptResponse.status !== 200 || !transcriptResponse.transcript) {
    console.log(`Failed to get transcript: ${transcriptResponse.message}`);
    return null;
  }

  return getQuestionsFromTranscript(transcriptResponse.transcript, courseTitle);
}

