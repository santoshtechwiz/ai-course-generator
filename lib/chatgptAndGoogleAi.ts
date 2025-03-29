import { GoogleGenerativeAI } from "@google/generative-ai"
import openai from "./chatgpt/openaiUtils"
import pRetry from "p-retry"
import { LRUCache } from "lru-cache"

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

// Constants
const MAX_SUMMARY_TOKENS = 300
const SAMPLE_RATIO = 0.3
const MAX_RETRIES = 3

// Create LRU cache for summaries
const summaryCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 60,
})

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

function ensureMarkdownFormat(text: string): string {
  if (!text.includes("#") && !text.includes("-")) {
    return `# Summary\n\n- ${text.replace(/\n+/g, "\n- ")}`
  }
  return text
}

async function summarizeWithGemini(text: string): Promise<string> {
  return pRetry(
    async () => {
      const prompt = `Summarize the following text concisely, focusing on the main points. Format the summary in Markdown with a title and bullet points:\n\n${text}`;
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      return ensureMarkdownFormat(result.response.text());
    },
    {
      retries: MAX_RETRIES,
      onFailedAttempt: (error) => {
        console.warn("Gemini attempt failed:", error.message);
      },
    }
  );
}

async function summarizeWithOpenAI(text: string): Promise<string> {
  return pRetry(
    async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [
          {
            role: "system",
            content: "Summarize the following text concisely, focusing on main points. Provide the output in Markdown format with a title and bullet points.",
          },
          { role: "user", content: text },
        ],
        max_tokens: MAX_SUMMARY_TOKENS,
        temperature: 0.5,
      });
      return ensureMarkdownFormat(response.choices[0]?.message?.content?.trim() || "");
    },
    {
      retries: MAX_RETRIES,
      onFailedAttempt: (error) => {
        console.warn("OpenAI attempt failed:", error.message);
      },
    }
  );
}

function summarizeLocally(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]/g) || []
  const importantSentences = sentences
    .filter((sentence) => {
      const words = sentence.toLowerCase().split(/\s+/)
      return words.some((word) => ["important", "significant", "key", "main", "crucial", "essential"].includes(word))
    })
    .slice(0, 5)

  if (importantSentences.length === 0) {
    importantSentences.push(...sentences.slice(0, 3))
  }

  const summary = importantSentences.join(" ")
  return `# Summary\n\n- ${summary.replace(/\.\s+/g, ".\n- ")}`
}

export async function generateVideoSummary(transcript: string): Promise<string> {
  const sampledTranscript = sampleTranscript(transcript)
  const cacheKey = sampledTranscript.slice(0, 100)
  
  const cachedSummary = summaryCache.get(cacheKey)
  if (cachedSummary) {
    return cachedSummary
  }

  // let summary: string;
  // try {
  //   summary = await summarizeWithGemini(sampledTranscript);
  // } catch (geminiError) {
  //   console.warn("Gemini summarization failed, trying OpenAI");
  //   try {
  //     summary = await summarizeWithOpenAI(sampledTranscript);
  //   } catch (openaiError) {
  //     console.warn("OpenAI summarization failed, using local summarization");
  //      summary = "";
  //   }
  // }

  summaryCache.set(cacheKey, sampledTranscript)
  return sampledTranscript
}