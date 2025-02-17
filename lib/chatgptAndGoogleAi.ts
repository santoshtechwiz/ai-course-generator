import { GoogleGenerativeAI } from "@google/generative-ai"
import openai from "./chatgpt/openaiUtils"
import pRetry from "p-retry"
import { LRUCache } from "lru-cache"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI({apiKey: process.env.GOOGLE_API_KEY!});

// Constants
const MAX_SUMMARY_TOKENS = 300
const SAMPLE_RATIO = 0.3
const MAX_RETRIES = 3

// Create LRU cache for summaries
const summaryCache = new LRUCache<string, string>({
  max: 100, // Maximum number of items to store in the cache
  ttl: 1000 * 60 * 60, // Cache for 1 hour
})

// Function to sample the transcript (avoiding mid-sentence cuts)
function sampleTranscript(transcript: string): string {
  const sentences = transcript.match(/[^.!?]+[.!?]/g) || [transcript]
  const sampleSize = Math.ceil(sentences.length * SAMPLE_RATIO)
  const sampledSentences = new Set<string>()

  while (sampledSentences.size < sampleSize) {
    const randomSentence = sentences[Math.floor(Math.random() * sentences.length)]
    sampledSentences.add(randomSentence.trim())
  }

  return [...sampledSentences].join(" ")
}

// Ensure Markdown formatting
function ensureMarkdownFormat(text: string): string {
  if (!text.includes("#") && !text.includes("-")) {
    return `# Summary\n\n- ${text.replace(/\n+/g, "\n- ")}`
  }
  return text
}

// Function to summarize using Google Gemini
async function summarizeWithGemini(text: string): Promise<string> {
  const model = google("gemini-pro")

  const result = await generateText({
    model,
    prompt: `Summarize the following text concisely, focusing on the main points. Format the summary in Markdown with a title and bullet points:\n\n${text}`,
    maxTokens: MAX_SUMMARY_TOKENS,
    temperature: 0.5,
  })

  return ensureMarkdownFormat(result.text)
}

// Function to summarize using OpenAI
async function summarizeWithOpenAI(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    messages: [
      {
        role: "system",
        content:
          "Summarize the following text concisely, focusing on main points. Provide the output in Markdown format with a title and bullet points.",
      },
      { role: "user", content: text },
    ],
    max_tokens: MAX_SUMMARY_TOKENS,
    temperature: 0.5,
  })

  return ensureMarkdownFormat(response.choices[0]?.message?.content?.trim() || "")
}

// Main function to generate a summary
export async function generateVideoSummary(transcript: string): Promise<string> {
  const sampledTranscript = sampleTranscript(transcript)

  // Check cache first
  const cacheKey = sampledTranscript.slice(0, 100) // Use first 100 characters as cache key
  const cachedSummary = summaryCache.get(cacheKey)
  if (cachedSummary) {
    return cachedSummary
  }

  // Retry logic with p-retry
  const summary = await pRetry(
    async () => {
      try {
        return await summarizeWithGemini(sampledTranscript)
      } catch (geminiError) {
        console.warn("Gemini failed:", geminiError)
        return await summarizeWithOpenAI(sampledTranscript)
      }
    },
    {
      retries: MAX_RETRIES,
      onFailedAttempt: (error) => {
        console.error(`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`)
      },
    },
  )

  // Cache the result
  summaryCache.set(cacheKey, summary)

  return summary
}

