import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"
import type { NextRequest } from "next/server"

import { OpenAIEmbeddings } from "@langchain/openai"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { Document } from "langchain/document"

class MemoryManager {
  constructor(private options: { sessionId: string; maxTokens: number }) {}
  private messages: { role: string; content: string; id: string }[] = []

  // Corrected: Added addMessage method
  async addMessage(message: { role: string; content: string; id: string }): Promise<void> {
    this.messages.push(message);
    // Keep only the last 'maxTokens' messages
    if (this.messages.length > this.options.maxTokens) {
      this.messages = this.messages.slice(-this.options.maxTokens);
    }
  }

  async getMessages(): Promise<{ role: string; content: string; id: string }[]> {
    // Simulate fetching messages from a database or cache
    return this.messages.slice(-this.options.maxTokens)
  }
  static cache = new Map<string, any>()

  static set(key: string, value: any): void {
    this.cache.set(key, value)
  }

  static get(key: string): any | undefined {
    return this.cache.get(key)
  }

  static delete(key: string): boolean {
    return this.cache.delete(key)
  }

  static clear(): void {
    this.cache.clear()
  }
}
const CONFIG = {
  URL: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
  MAX_RESULTS: 3, // Reduced from 5 to 3
  MEMORY_LIMIT: 3, // Limit chat history to last 3 messages
  MAX_TOKENS: 100, // Reduced token limit for responses
}

// Use a singleton pattern for the vector store to avoid reinitializing
let vectorStore: MemoryVectorStore | null = null

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const authSession = await getAuthSession()
    const userId = authSession?.user?.id

    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const userMessage = messages[messages.length - 1]?.content || ""
    if (!userMessage.trim()) {
      return new Response("Invalid request", { status: 400 })
    }

    // Initialize memory manager with reduced maxTokens
    const memory = new MemoryManager({
      sessionId: userId,
      maxTokens: 300, // Reduced from 500
    })

    // Get conversation history (limited to last few messages)
    const chatHistory = (await memory.getMessages()).slice(-CONFIG.MEMORY_LIMIT)

    // Add current message to history
    await memory.addMessage({
      role: "user",
      content: userMessage,
      id: "",
    })

    // Initialize or retrieve vector store
    if (!vectorStore) {
      vectorStore = await initializeVectorStore()
    }

    // Perform similarity search
    const similarDocs = await vectorStore.similaritySearch(userMessage, CONFIG.MAX_RESULTS)

    // Build system message
    const systemMessage = buildSystemMessage(similarDocs)

    // Generate the final response with memory context
    const result = await streamText({
      model: openai("gpt-3.5-turbo"),
      messages: [{ role: "system", content: systemMessage }, ...chatHistory, ...messages],
      temperature: 0.7,
      maxTokens: CONFIG.MAX_TOKENS,
    })

    // Add AI response to memory
    result.text.then(async (aiResponse) => {
      await memory.addMessage({
        role: "assistant",
        content: aiResponse,
        id: "",
      })
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

async function initializeVectorStore(): Promise<MemoryVectorStore> {
  try {
    const [allCourses, allQuizzes] = await Promise.all([
      prisma.course.findMany({
        select: { title: true, slug: true, description: true },
        where: { isPublic: true }, // Only index public courses
        take: 100, // Limit the number of courses to index
      }),
      prisma.userQuiz.findMany({
        select: { title: true, slug: true, quizType: true },
        where: { isPublic: true }, // Only index public quizzes
        take: 100, // Limit the number of quizzes to index
      }),
    ])

    const documents: Document[] = [
      ...allCourses.map(
        (course) =>
          new Document({
            pageContent: `Course: ${course.title}\n${course.description || ""}`,
            metadata: { type: "course", slug: course.slug },
          }),
      ),
      ...allQuizzes.map(
        (quiz) =>
          new Document({
            pageContent: `Quiz: ${quiz.title}`,
            metadata: { type: "quiz", slug: quiz.slug, quizType: quiz.quizType },
          }),
      ),
    ]

    const embeddings = new OpenAIEmbeddings()
    return await MemoryVectorStore.fromDocuments(documents, embeddings)
  } catch (error) {
    console.error("Error initializing vector store:", error)
    // Return an empty vector store as fallback
    const embeddings = new OpenAIEmbeddings()
    return new MemoryVectorStore(embeddings)
  }
}

function buildSystemMessage(similarDocs: Document[]): string {
  let message = `You are a concise AI assistant for our learning platform. Help users find courses and quizzes or suggest creating new content. Relevant items:\n\n`

  if (similarDocs.length > 0) {
    similarDocs.forEach((doc) => {
      if (doc.metadata.type === "course") {
        message += `- Course: [${doc.pageContent.split("\n")[0].replace("Course: ", "")}](${CONFIG.URL}/dashboard/course/${doc.metadata.slug})\n`
      } else if (doc.metadata.type === "quiz") {
        message += `- Quiz: [${doc.pageContent.replace("Quiz: ", "")}](${CONFIG.URL}/dashboard/${doc.metadata.quizType}/${doc.metadata.slug})\n`
      }
    })
  } else {
    message += "No directly relevant content found.\n"
  }

  message += `\nIf no suitable content, suggest:
- [Create Course](${CONFIG.URL}/dashboard/explore)
- [Create Quiz](${CONFIG.URL}/dashboard/quiz)

Be helpful and brief. Don't provide external info. For specific course details, advise checking the course page.`

  return message
}


