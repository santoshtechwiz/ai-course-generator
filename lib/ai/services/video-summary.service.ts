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

// Constants - Enhanced for better quality
const MAX_SUMMARY_TOKENS = 500 // Increased for more detailed summaries
const SAMPLE_RATIO = 0.4 // Increased sampling for better context
const MAX_RETRIES = 3
const DEFAULT_SUMMARY = "# Chapter Summary\n\n- No meaningful summary could be generated from this chapter content."

// LRU Cache for summaries - Increased cache size
const summaryCache = new LRUCache<string, string>({
  max: 200, // Increased cache size
  ttl: 1000 * 60 * 60 * 2, // 2 hours (longer cache)
})

/**
 * Enhanced transcript sampling with intelligent content selection
 * Prioritizes important sentences and maintains context flow
 */
function sampleTranscript(transcript: string): string {
  const sentences = transcript.match(/[^.!?]+[.!?]/g) || [transcript]

  if (sentences.length <= 20) {
    // For short transcripts, use everything
    return transcript
  }

  // Score sentences by importance
  const scoredSentences = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().split(/\s+/)
    let score = 0

    // Keywords that indicate important content
    const importantKeywords = [
      'important', 'key', 'main', 'essential', 'crucial', 'core', 'fundamental',
      'summary', 'overview', 'conclusion', 'finally', 'therefore', 'thus',
      'remember', 'note', 'learn', 'understand', 'concept', 'principle',
      'example', 'demonstrate', 'explain', 'define', 'introduce'
    ]

    // Add points for important keywords
    words.forEach(word => {
      if (importantKeywords.some(keyword => word.includes(keyword))) {
        score += 3
      }
    })

    // Prefer sentences with technical terms or numbers
    if (/\d+/.test(sentence)) score += 1
    if (/[a-z]{8,}/.test(sentence)) score += 1 // Long words might be technical

    // Prefer middle sentences (often contain main content)
    const positionScore = 1 - Math.abs(index - sentences.length / 2) / (sentences.length / 2)
    score += positionScore * 2

    return { sentence, score, index }
  })

  // Sort by score and take top sentences, maintaining some order
  scoredSentences.sort((a, b) => b.score - a.score)
  const topSentences = scoredSentences.slice(0, Math.min(30, Math.ceil(sentences.length * SAMPLE_RATIO)))

  // Sort back by original position to maintain flow
  topSentences.sort((a, b) => a.index - b.index)

  const sampledSentences = topSentences.map(item => item.sentence)

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
 * Summarize using Google Gemini with enhanced educational prompts
 */
async function summarizeWithGemini(text: string): Promise<string> {
  return pRetry(
    async () => {
      const prompt = `You are an expert at summarizing educational content. Analyze this video transcript and create a structured summary that helps students learn effectively.

**Instructions:**
- Identify the main topic and learning objectives
- Extract key concepts, definitions, and explanations
- Include important examples or demonstrations
- Note any practical applications or real-world connections
- Structure the summary with clear headings and bullet points
- Use educational language that's easy to understand
- Focus on information that would be most valuable for students to remember

**Transcript to summarize:**
${text}

**Output Format:**
Use markdown with:
- A clear, descriptive title
- Main concepts section
- Key learning points
- Important examples (if any)
- Practical applications (if mentioned)`

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.3, // More focused than default
          maxOutputTokens: MAX_SUMMARY_TOKENS,
        }
      })

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
 * Summarize using OpenAI GPT-4o (upgraded from GPT-3.5-turbo)
 */
async function summarizeWithOpenAI(text: string): Promise<string> {
  return pRetry(
    async () => {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o", // Upgraded from gpt-3.5-turbo-1106
        messages: [
          {
            role: "system",
            content: `You are an expert educational content summarizer. Create concise, well-structured summaries of educational video transcripts.

Guidelines:
- Focus on key learning objectives and main concepts
- Use clear, educational language suitable for students
- Structure with descriptive headers and bullet points
- Include important examples, definitions, and explanations
- Highlight practical applications when mentioned
- Keep summaries focused and actionable
- Use markdown formatting for readability`
          },
          {
            role: "user",
            content: `Please create a comprehensive summary of this educational video transcript. Focus on the main learning points, key concepts, and any important examples or explanations:

${text}

Format the summary with:
- A descriptive title
- Main concepts and learning objectives
- Key points and explanations
- Any important examples or demonstrations
- Practical applications (if mentioned)`
          }
        ],
        max_tokens: MAX_SUMMARY_TOKENS,
        temperature: 0.3, // Lower temperature for more focused summaries
      })

      const markdown = ensureMarkdownFormat(response.choices[0]?.message?.content?.trim() || "")
      if (!markdown) throw new Error("Empty or invalid OpenAI summary")
      return markdown
    },
    {
      retries: MAX_RETRIES,
      onFailedAttempt: (error) => {
        console.warn("[VideoSummary] GPT-4o attempt failed:", error.message)
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

// Export internal functions for testing
export { sampleTranscript, summarizeWithOpenAI, summarizeWithGemini }
