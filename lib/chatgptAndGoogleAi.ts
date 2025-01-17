import { GoogleGenerativeAI } from "@google/generative-ai";
import openai from "./chatgpt/openAI";

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Constants
const MAX_SUMMARY_TOKENS = 300;
const SAMPLE_RATIO = 0.3; // Sample 30% of the transcript
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to estimate tokens
function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

// Function to sample the transcript
function sampleTranscript(transcript: string): string {
  const sentences = transcript.split(/[.!?]+/);
  const sampleSize = Math.ceil(sentences.length * SAMPLE_RATIO);
  const sampledSentences = sentences
    .sort(() => 0.5 - Math.random()) // Shuffle sentences
    .slice(0, sampleSize);
  return sampledSentences.join('. ') + '.';
}

// Function to summarize using Google Gemini with retry logic
async function summarizeWithGemini(text: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const prompt = `Summarize the following text concisely, focusing on the main points, and format the summary in Markdown:\n\n${text}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error(`Gemini attempt ${attempt + 1} failed:`, error.message);
      if (attempt === MAX_RETRIES - 1) {
        throw new Error("Unable to generate summary with Gemini after multiple attempts.");
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error("Unexpected error in summarizeWithGemini");
}

// Function to summarize using OpenAI with retry logic
async function summarizeWithOpenAI(text: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Summarize the following text concisely, focusing on main points, and provide the output in Markdown format."


          },
          { role: "user", content: text }
        ],
        max_tokens: MAX_SUMMARY_TOKENS,
        temperature: 0.5,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error: any) {
      console.error(`OpenAI attempt ${attempt + 1} failed:`, error.message);
      if (attempt === MAX_RETRIES - 1) {
        throw new Error("Unable to generate summary with OpenAI after multiple attempts.");
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error("Unexpected error in summarizeWithOpenAI");
}

// Main function to generate summary
export async function generateVideoSummary(transcript: string): Promise<string> {
  const sampledTranscript = sampleTranscript(transcript);

  try {
    // First, try with Google Gemini
    return await summarizeWithGemini(sampledTranscript);
  } catch (geminiError: any) {
    console.error("Error generating summary with Google Gemini:", geminiError.message);

    try {
      // Fallback to OpenAI
      return await summarizeWithOpenAI(sampledTranscript);
    } catch (openAIError: any) {
      console.error("Error generating summary with OpenAI:", openAIError.message);

      // If both fail, return a generic error message
      return "Unable to generate summary due to API errors. Please try again later.";
    }
  }
}

