import { GoogleGenerativeAI } from "@google/generative-ai"
import { OpenAI } from "openai"
import https from "https"
import pRetry from "p-retry"
import { LRUCache } from "lru-cache"

// Initialize providers
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
const openaiAgent = new https.Agent({ rejectUnauthorized: false })
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  httpAgent: openaiAgent,
})

// Constants
const MAX_SUMMARY_TOKENS = 300
const SAMPLE_RATIO = 0.3
const MAX_RETRIES = 3
const DEFAULT_SUMMARY = "# Summary\n\n- No meaningful summary could be generated."

// LRU Cache for summaries
const summaryCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour
})

/**
 * Sample transcript to reduce token usage
 */
function sampleTranscript(transcript: string): string {
  const sentences = transcript.match(/[^.!?]+[.!?]/g) || [transcript]
  const sampleSize = Math.min(Math.ceil(sentences.length * SAMPLE_RATIO), 50)
  const sampledSentences = sentences
    .sort(() => 0.5 - Math.random())
    .slice(0, sampleSize)

  return sampledSentences.join(" ")
}

/**
 * Ensure summary is in proper Markdown format
 */
function ensureMarkdownFormat(text: string): string {
  if (!text || text.trim().length < 20) return ""
  if (!text.includes("#") && !text.includes("-")) {
    return `# Summary\n\n- ${text.replace(/\n+/g, "\n- ")}`
  }
  return text
}

/**
 * Summarize using Google Gemini
 */
async function summarizeWithGemini(text: string): Promise<string> {
  return pRetry(
    async () => {
      const prompt = `Summarize the following text concisely, focusing on the main points. Format the summary in Markdown with a title and bullet points:\n\n${text}`
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
      const result = await model.generateContent(prompt)
      const markdown = ensureMarkdownFormat(result.response.text())
      if (!markdown) throw new Error("Empty or invalid Gemini summary")
      return markdown
    },
    {
      retries: MAX_RETRIES,
      onFailedAttempt: (error) => {
        console.warn("[VideoSummary] Gemini attempt failed:", error.message)
      },
    },
  )
}

/**
 * Summarize using OpenAI
 */
async function summarizeWithOpenAI(text: string): Promise<string> {
  return pRetry(
    async () => {
      const response = await openaiClient.chat.completions.create({
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

      const markdown = ensureMarkdownFormat(response.choices[0]?.message?.content?.trim() || "")
      if (!markdown) throw new Error("Empty or invalid OpenAI summary")
      return markdown
    },
    {
      retries: MAX_RETRIES,
      onFailedAttempt: (error) => {
        console.warn("[VideoSummary] OpenAI attempt failed:", error.message)
      },
    },
  )
}

/**
 * Fallback local summarization (keyword-based)
 */
function summarizeLocally(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]/g) || []
  const importantSentences = sentences
    .filter((sentence) => {
      const words = sentence.toLowerCase().split(/\s+/)
      return words.some((word) => ["important", "significant", "key", "main", "crucial", "essential"].includes(word))
    })
    .slice(0, 5)

  const finalSentences = importantSentences.length ? importantSentences : sentences.slice(0, 3)
  const summary = finalSentences.join(" ")

  return ensureMarkdownFormat(summary) || DEFAULT_SUMMARY
}

/**
 * Generate video summary with multi-provider fallback
 * Tries: OpenAI GPT-3.5-turbo -> Gemini -> Local extraction (cheaper first)
 * 
 * @param transcript - Video transcript text
 * @returns Markdown-formatted summary
 * 
 * @example
 * const summary = await generateVideoSummaryFromTranscript(transcript)
 */
export async function generateVideoSummaryFromTranscript(transcript: string): Promise<string> {
  const sampledTranscript = sampleTranscript(transcript)
  const cacheKey = sampledTranscript.slice(0, 100)

  // Check cache first
  const cachedSummary = summaryCache.get(cacheKey)
  if (cachedSummary) {
    console.log("[VideoSummary] Cache hit")
    return cachedSummary
  }

  let summary = ""

  // Try OpenAI GPT-3.5-turbo first (cheaper)
  try {
    console.log("[VideoSummary] Attempting with OpenAI GPT-3.5-turbo...")
    summary = await summarizeWithOpenAI(sampledTranscript)
    if (summary) {
      summaryCache.set(cacheKey, summary)
      console.log("[VideoSummary] Success with OpenAI GPT-3.5-turbo")
      return summary
    }
  } catch (error) {
    console.warn("[VideoSummary] OpenAI GPT-3.5-turbo failed, trying Gemini:", error instanceof Error ? error.message : String(error))
  }

  // Fallback to Gemini
  try {
    console.log("[VideoSummary] Attempting with Gemini...")
    summary = await summarizeWithGemini(sampledTranscript)
    if (summary) {
      summaryCache.set(cacheKey, summary)
      console.log("[VideoSummary] Success with Gemini")
      return summary
    }
  } catch (error) {
    console.warn("[VideoSummary] Gemini failed, using local summarization:", error instanceof Error ? error.message : String(error))
  }

  // Final fallback to local
  console.log("[VideoSummary] Using local summarization")
  summary = summarizeLocally(sampledTranscript) || DEFAULT_SUMMARY
  summaryCache.set(cacheKey, summary)
  return summary
}

/**
 * @deprecated Use generateVideoSummaryFromTranscript instead
 * Backward compatibility export
 */
const generateVideoSummary = generateVideoSummaryFromTranscript
