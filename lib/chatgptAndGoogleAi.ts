import { GoogleGenerativeAI } from "@google/generative-ai";
import openai from "./chatgpt/openaiUtils";

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Constants
const MAX_SUMMARY_TOKENS = 300;
const SAMPLE_RATIO = 0.3;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Helper function to estimate tokens
function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

// Function to sample the transcript
function sampleTranscript(transcript: string): string {
  const sentences = transcript.split(/[.!?]+/);
  const sampleSize = Math.ceil(sentences.length * SAMPLE_RATIO);
  const sampledSentences = sentences
    .sort(() => 0.5 - Math.random())
    .slice(0, sampleSize);
  return sampledSentences.join('. ') + '.';
}

// Exponential backoff function
async function exponentialBackoff(attempt: number): Promise<void> {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  await new Promise(resolve => setTimeout(resolve, delay));
}

// Function to ensure Markdown formatting
function ensureMarkdownFormat(text: string): string {
  // Add Markdown formatting if not present
  if (!text.includes('#') && !text.includes('-')) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return `# Summary\n\n${lines.map(line => `- ${line}`).join('\n')}`;
  }
  return text;
}

// Function to summarize using Google Gemini with retry logic
async function summarizeWithGemini(text: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const prompt = `Summarize the following text concisely, focusing on the main points. Format the summary in Markdown with a title and bullet points:\n\n${text}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return ensureMarkdownFormat(response.text());
    } catch (error: any) {
      console.error(`Gemini attempt ${attempt + 1} failed:`, error.message);
      if (attempt === MAX_RETRIES - 1) {
        throw new Error("Unable to generate summary with Gemini after multiple attempts.");
      }
      await exponentialBackoff(attempt);
    }
  }
  throw new Error("Unexpected error in summarizeWithGemini");
}

// Function to summarize using OpenAI with retry logic
async function summarizeWithOpenAI(text: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [
          {
            role: "system",
            content: "Summarize the following text concisely, focusing on main points. Provide the output in Markdown format with a title and bullet points."
          },
          { role: "user", content: text }
        ],
        max_tokens: MAX_SUMMARY_TOKENS,
        temperature: 0.5,
      });

      const summary = response.choices[0]?.message?.content?.trim() || '';
      return ensureMarkdownFormat(summary);
    } catch (error: any) {
      console.error(`OpenAI attempt ${attempt + 1} failed:`, error.message);
      if (attempt === MAX_RETRIES - 1) {
        throw new Error("Unable to generate summary with OpenAI after multiple attempts.");
      }
      await exponentialBackoff(attempt);
    }
  }
  throw new Error("Unexpected error in summarizeWithOpenAI");
}

// Main function to generate summary
export async function generateVideoSummary(transcript: string): Promise<string> {
  const sampledTranscript = sampleTranscript(transcript);

  // Try Gemini first
  for (let geminiAttempt = 0; geminiAttempt < 3; geminiAttempt++) {
    try {
      return await summarizeWithGemini(sampledTranscript);
    } catch (geminiError: any) {
      console.error(`Gemini attempt ${geminiAttempt + 1} failed:`, geminiError.message);
      if (geminiAttempt < 2) {
        await exponentialBackoff(geminiAttempt);
      }
    }
  }

  // If Gemini fails after 3 attempts, try OpenAI
  try {
    return await summarizeWithOpenAI(sampledTranscript);
  } catch (openAIError: any) {
    console.error("Error generating summary with OpenAI:", openAIError.message);
    return "# Summary Generation Failed\n\n- Unable to generate summary due to API errors.\n- Please try again later.";
  }
}