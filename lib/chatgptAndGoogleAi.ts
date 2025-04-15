import { GoogleGenerativeAI } from "@google/generative-ai";
import openai from "./chatgpt/openaiUtils";
import pRetry from "p-retry";
import { LRUCache } from "lru-cache";

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

// Constants
const MAX_SUMMARY_TOKENS = 300;
const SAMPLE_RATIO = 0.3;
const MAX_RETRIES = 3;
const DEFAULT_SUMMARY = "# Summary\n\n- No meaningful summary could be generated.";

// LRU Cache
const summaryCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 60,
});

function sampleTranscript(transcript: string): string {
  const sentences = transcript.match(/[^.!?]+[.!?]/g) || [transcript];
  const sampleSize = Math.min(Math.ceil(sentences.length * SAMPLE_RATIO), 50); // Limit to 50 sentences for efficiency
  const sampledSentences = sentences
    .sort(() => 0.5 - Math.random()) // Shuffle sentences
    .slice(0, sampleSize); // Take the first `sampleSize` sentences

  return sampledSentences.join(" ");
}

function ensureMarkdownFormat(text: string): string {
  if (!text || text.trim().length < 20) return ""; // garbage guard
  if (!text.includes("#") && !text.includes("-")) {
    return `# Summary\n\n- ${text.replace(/\n+/g, "\n- ")}`;
  }
  return text;
}

async function summarizeWithGemini(text: string): Promise<string> {
  return pRetry(
    async () => {
      const prompt = `Summarize the following text concisely, focusing on the main points. Format the summary in Markdown with a title and bullet points:\n\n${text}`;
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const markdown = ensureMarkdownFormat(result.response.text());
      if (!markdown) throw new Error("Empty or invalid Gemini summary");
      return markdown;
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

      const markdown = ensureMarkdownFormat(response.choices[0]?.message?.content?.trim() || "");
      if (!markdown) throw new Error("Empty or invalid OpenAI summary");
      return markdown;
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
  const sentences = text.match(/[^.!?]+[.!?]/g) || [];
  const importantSentences = sentences
    .filter((sentence) => {
      const words = sentence.toLowerCase().split(/\s+/);
      return words.some((word) =>
        ["important", "significant", "key", "main", "crucial", "essential"].includes(word)
      );
    })
    .slice(0, 5);

  const finalSentences = importantSentences.length ? importantSentences : sentences.slice(0, 3);
  const summary = finalSentences.join(" ");

  return ensureMarkdownFormat(summary) || DEFAULT_SUMMARY;
}

export async function generateVideoSummary(transcript: string): Promise<string> {
  const sampledTranscript = sampleTranscript(transcript);
  const cacheKey = sampledTranscript.slice(0, 100);

  const cachedSummary = summaryCache.get(cacheKey);
  if (cachedSummary) {
    return cachedSummary;
  }

  let summary = "";

  try {
    summary = await summarizeWithGemini(sampledTranscript);
    if (summary) {
      summaryCache.set(cacheKey, summary);
      return summary;
    }
  } catch {
    console.warn("Gemini summarization failed, trying OpenAI");
  }

  try {
    summary = await summarizeWithOpenAI(sampledTranscript);
    if (summary) {
      summaryCache.set(cacheKey, summary);
      return summary;
    }
  } catch {
    console.warn("OpenAI summarization failed, using local summarization");
  }

  summary = summarizeLocally(sampledTranscript) || DEFAULT_SUMMARY;
  summaryCache.set(cacheKey, summary);
  return summary;
}
