import pLimit from "p-limit"

import YoutubeService from "./youtubeService"

const limit = pLimit(1) // Limit concurrency to 1

/**
 * Preprocess transcript to remove common patterns like introductions,
 * ads, and other irrelevant content to save tokens and improve question quality
 */
function preprocessTranscript(transcript: string): string {
  if (!transcript) return '';

  // Convert to lowercase for pattern matching
  const lowerTranscript = transcript.toLowerCase();

  // Split transcript into paragraphs/sections for processing
  const sections = transcript.split(/\.\s+/);
  let filteredSections = [...sections];

  // Common introduction patterns to filter out
  const introPatterns = [
    /hello (everyone|guys|everybody|and welcome)/i,
    /welcome (back )?to (this|the|our|another) (video|course|tutorial|lecture|episode)/i,
    /my name is|i('m| am) [a-z]+ and (today|in this)/i,
    /before we (start|begin|get started)/i,
    /don't forget to (like|subscribe|follow)/i,
    /in today's (video|lecture|tutorial)/i,
    /let me introduce myself/i,
  ];

  // Common conclusion patterns to filter out
  const conclusionPatterns = [
    /thank you for (watching|listening)/i,
    /if you (enjoyed|liked) this (video|tutorial)/i,
    /see you in the next (video|tutorial|lecture)/i,
    /don't forget to (like|subscribe|comment)/i,
    /thanks for your attention/i,
  ];

  // Filter out sections containing introduction or conclusion patterns
  filteredSections = filteredSections.filter(section => {
    const lowerSection = section.toLowerCase();

    // Check if section contains introduction patterns
    for (const pattern of introPatterns) {
      if (pattern.test(lowerSection)) {
        return false;
      }
    }

    // Check if section contains conclusion patterns
    for (const pattern of conclusionPatterns) {
      if (pattern.test(lowerSection)) {
        return false;
      }
    }

    return true;
  });

  // Combine the filtered sections
  const cleanedTranscript = filteredSections.join(". ");

  return cleanedTranscript;
}

/**
 * Extract the most relevant content from transcript to stay within token limits
 * Uses a simple but effective approach to extract the core content
 */
function extractRelevantContent(transcript: string, maxWords: number = 800): string {
  if (!transcript) return '';

  // Remove very short sentences (likely timestamps or speaker indicators)
  const sentences = transcript.split(/\.|\?|!/).filter(s => s.trim().split(/\s+/).length > 3);

  // Split transcript into beginning, middle, and end sections
  const beginning = sentences.slice(0, Math.floor(sentences.length * 0.2)).join(". ");
  const middle = sentences.slice(Math.floor(sentences.length * 0.2), Math.floor(sentences.length * 0.8)).join(". ");
  const end = sentences.slice(Math.floor(sentences.length * 0.8)).join(". ");

  // Balance the content from beginning, middle, and end sections
  let words = beginning.split(/\s+/);
  const beginningWords = Math.floor(maxWords * 0.3);
  const middleWords = Math.floor(maxWords * 0.5);
  const endWords = Math.floor(maxWords * 0.2);

  const relevantBeginning = words.slice(0, beginningWords).join(" ");
  words = middle.split(/\s+/);
  const relevantMiddle = words.slice(0, middleWords).join(" ");
  words = end.split(/\s+/);
  const relevantEnd = words.slice(0, endWords).join(" ");

  return `${relevantBeginning}. ${relevantMiddle}. ${relevantEnd}`;
}

export async function getQuestionsFromTranscript(
  transcript: string,
  courseTitle: string,
): Promise<any[]> {
  try {
    // Preprocess transcript to remove unwanted content and focus on relevant material
    const cleanedTranscript = preprocessTranscript(transcript);

    // Extract most relevant content to stay within token limits
    const relevantContent = extractRelevantContent(cleanedTranscript);

    // Generate questions with the improved transcript using simple AI service
    return await limit(async () => {
      const { generateMCQ } = await import("@/lib/ai/course-ai-service");
      
      const quiz = await generateMCQ(
        `${courseTitle}: ${relevantContent.substring(0, 200)}`,
        5,
        'medium',
        undefined,
        'FREE' as any
      );
      
      return quiz.questions || [];
    });
  } catch (error) {
    console.error("Error generating questions:", error);
    return [];
  }
}

async function processVideoAndGenerateQuestions(
  searchQuery: string,
  courseTitle: string,
): Promise<any[] | null> {
  const videoId = await YoutubeService.searchYoutube(searchQuery)
  if (!videoId) {
    console.log("No suitable video found")
    return null
  }

  const transcriptResponse = await YoutubeService.getTranscript(videoId)
  if (transcriptResponse.status !== 200 || !transcriptResponse.transcript) {
    console.log(`Failed to get transcript: ${transcriptResponse.message}`)
    return null
  }

  return getQuestionsFromTranscript(transcriptResponse.transcript, courseTitle)
}
