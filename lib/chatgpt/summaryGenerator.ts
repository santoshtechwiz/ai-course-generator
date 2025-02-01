import { chatGptRequest } from "./chatGptRequest";



// Default token limit for truncation
const MAX_TOKENS = 4000;

// Function to estimate token count more accurately
function estimateTokenCount(text: string): number {
  const averageTokensPerWord = 1.33; 
  const wordCount = text.split(' ').length;
  return Math.ceil(wordCount * averageTokensPerWord);
}

// Truncate transcript to fit within token limits
function truncateTranscript(transcript: string, maxTokens: number): string {
  const words = transcript.split(' ');
  let tokenCount = 0;
  const truncatedWords: string[] = [];

  for (const word of words) {
    const estimatedTokens = estimateTokenCount(word); 
    if (tokenCount + estimatedTokens > maxTokens) break;
    tokenCount += estimatedTokens;
    truncatedWords.push(word);
  }

  return truncatedWords.join(' ');
}

// Generate summary using GPT
export async function generateSummaryGPT(
  transcript: string,
  summaryLength: number = 250,
  tokenLimit: number = MAX_TOKENS
): Promise<string | null> {
  try {
    // Ensure transcript fits within token limits
    const truncatedTranscript = truncateTranscript(transcript, tokenLimit);

    // Prepare prompt
    const prompt = `
      You are an AI capable of summarizing content clearly and concisely.
      Summarize the following transcript in approximately ${summaryLength} words. 
      Focus on the main topic and key points. Avoid mentioning unrelated topics like sponsors or tangential details.
      
      Transcript:
      ${truncatedTranscript}
    `;

    // Call GPT API
    const result = await chatGptRequest(
      "You are an AI that summarizes text.",
      prompt.trim(),
      { summary: "summary of the transcript" }
    );

    return result?.summary ?? null;
  } catch (error: any) {
    console.error("Error generating summary:", {
      message: error.message,
      stack: error.stack,
    });
    return null;
  }
}
