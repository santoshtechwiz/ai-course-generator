import pLimit from 'p-limit';
import { MultipleChoiceQuestion } from '@/app/types';

import { getTranscript, searchYoutube } from './youtubeService';
import generateMultipleChoiceQuestions from '@/lib/chatgpt/videoQuiz';


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

  const transcriptResponse = await getTranscript(videoId);
  if (transcriptResponse.status !== 200 || !transcriptResponse.transcript) {
    console.log(`Failed to get transcript: ${transcriptResponse.message}`);
    return null;
  }

  return getQuestionsFromTranscript(transcriptResponse.transcript, courseTitle);
}

