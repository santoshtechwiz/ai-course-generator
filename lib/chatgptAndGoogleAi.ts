import { GoogleGenerativeAI } from "@google/generative-ai";
import openai from "./chatgpt/openaiUtils";

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Constants
const MAX_SUMMARY_TOKENS = 300;
const SAMPLE_RATIO = 0.3;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const CIRCUIT_BREAKER_THRESHOLD = 5; // Stops retries if repeated failures occur

// Track API failures to implement circuit breaker
const apiFailureCount = new WeakMap<object, number>();

// Function to sample the transcript (avoiding mid-sentence cuts)
function sampleTranscript(transcript: string): string {
  const sentences = transcript.match(/[^.!?]+[.!?]/g) || [transcript];
  const sampleSize = Math.ceil(sentences.length * SAMPLE_RATIO);
  const sampledSentences = new Set<string>();

  while (sampledSentences.size < sampleSize) {
    const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
    sampledSentences.add(randomSentence.trim());
  }

  return [...sampledSentences].join(" ");
}

// Exponential backoff with jitter
async function exponentialBackoff(attempt: number): Promise<void> {
  const jitter = Math.random() * 500; // Random jitter up to 500ms
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt) + jitter;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

// Ensure Markdown formatting
function ensureMarkdownFormat(text: string): string {
  if (!text.includes("#") && !text.includes("-")) {
    return `# Summary\n\n- ${text.replace(/\n+/g, "\n- ")}`;
  }
  return text;
}

// Function to summarize using Google Gemini
async function summarizeWithGemini(text: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    generationConfig: { temperature: 0.5 },
  });

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (apiFailureCount.get(genAI) ?? 0 >= CIRCUIT_BREAKER_THRESHOLD) break;

    try {
      const result = await model.generateContent(
        `Summarize the following text concisely, focusing on the main points. Format the summary in Markdown with a title and bullet points:\n\n${text}`
      );

      return ensureMarkdownFormat(await result.response.text());
    } catch (error: any) {
      console.error(`Gemini attempt ${attempt + 1} failed:`, error.message);

      // Track failure count
      apiFailureCount.set(genAI, (apiFailureCount.get(genAI) || 0) + 1);

      if (attempt === MAX_RETRIES - 1) {
        throw new Error("Unable to generate summary with Gemini after multiple attempts.");
      }
      await exponentialBackoff(attempt);
    }
  }

  throw new Error("Unexpected error in summarizeWithGemini");
}

// Function to summarize using OpenAI
async function summarizeWithOpenAI(text: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (apiFailureCount.get(openai) ?? 0 >= CIRCUIT_BREAKER_THRESHOLD) break;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [
          { role: "system", content: "Summarize the following text concisely, focusing on main points. Provide the output in Markdown format with a title and bullet points." },
          { role: "user", content: text },
        ],
        max_tokens: MAX_SUMMARY_TOKENS,
        temperature: 0.5,
      });

      return ensureMarkdownFormat(response.choices[0]?.message?.content?.trim() || "");
    } catch (error: any) {
      console.error(`OpenAI attempt ${attempt + 1} failed:`, error.message);

      // Track failure count
      apiFailureCount.set(openai, (apiFailureCount.get(openai) || 0) + 1);

      if (attempt === MAX_RETRIES - 1) {
        throw new Error("Unable to generate summary with OpenAI after multiple attempts.");
      }
      await exponentialBackoff(attempt);
    }
  }

  throw new Error("Unexpected error in summarizeWithOpenAI");
}

// Main function to generate a summary
export async function generateVideoSummary(transcript: string): Promise<string> {
  const sampledTranscript = sampleTranscript(transcript);

  // Try Gemini first
  try {
    return await summarizeWithGemini(sampledTranscript);
  } catch (geminiError: any) {
    console.warn("Gemini failed:", geminiError.message);
  }

  // If Gemini fails, try OpenAI
  try {
    return await summarizeWithOpenAI(sampledTranscript);
  } catch (openAIError: any) {
    console.warn("OpenAI failed:", openAIError.message);
    return "# Summary Generation Failed\n\n- Unable to generate summary due to API errors.\n- Please try again later.";
  }
}
