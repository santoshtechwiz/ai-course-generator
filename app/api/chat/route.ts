// route.ts
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"
import type { NextRequest } from "next/server"
import { OpenAIEmbeddings } from "@langchain/openai"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { Document } from "langchain/document"

class MemoryManager {
  private messages: { role: string; content: string; id: string }[] = []

  constructor(private sessionId: string, private maxMessages: number = 10) {}

  async addMessage(message: { role: string; content: string; id: string }) {
    this.messages.push(message)
    this.messages = this.messages.slice(-this.maxMessages)
  }

  async getMessages() {
    return this.messages.slice(-this.maxMessages)
  }

  static cache = new Map<string, any>()
  static set = (k: string, v: any) => this.cache.set(k, v)
  static get = (k: string) => this.cache.get(k)
}

const CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_URL!,
  MAX_RESULTS: 3,
  MEMORY_LIMIT: 3,
  MAX_RESPONSE_TOKENS: 100,
}

let vectorStore: MemoryVectorStore | null = null

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const session = await getAuthSession()
    const userId = session?.user?.id

    if (!userId) return new Response("Unauthorized", { status: 401 })

    const lastMessage = messages.at(-1)?.content?.trim()
    if (!lastMessage) return new Response("Invalid message", { status: 400 })

    const memory = new MemoryManager(userId, CONFIG.MEMORY_LIMIT)
    await memory.addMessage({ role: "user", content: lastMessage, id: "" })

    if (!vectorStore) vectorStore = await initializeVectorStore()

    const similarDocs = await vectorStore.similaritySearch(lastMessage, CONFIG.MAX_RESULTS)
    const systemMessage = buildSystemMessage(similarDocs)

    const memoryHistory = await memory.getMessages()
    const finalMessages = [{ role: "system", content: systemMessage }, ...memoryHistory, { role: "user", content: lastMessage }]

    const result = await streamText({
      model: openai("gpt-3.5-turbo"),
      messages: finalMessages,
      temperature: 0.7,
      maxTokens: CONFIG.MAX_RESPONSE_TOKENS,
    })

    result.text.then(async (aiReply) => {
      try {
        await memory.addMessage({ role: "assistant", content: aiReply, id: "" })
      } catch (e) {
        console.error("Failed to save AI response:", e)
      }
    })

    return result.toDataStreamResponse()

  } catch (err) {
    console.error("Chatbot error:", err)
    return new Response("Internal Server Error", { status: 500 })
  }
}

async function initializeVectorStore(): Promise<MemoryVectorStore> {
  try {
    const [courses, quizzes] = await Promise.all([
      prisma.course.findMany({ select: { title: true, slug: true, description: true }, where: { isPublic: true }, take: 100 }),
      prisma.userQuiz.findMany({ select: { title: true, slug: true, quizType: true }, where: { isPublic: true }, take: 100 }),
    ])

    const documents: Document[] = [
      ...courses.map(c => new Document({
        pageContent: `Course: ${c.title}\n${c.description ?? ""}`,
        metadata: { type: "course", slug: c.slug },
      })),
      ...quizzes.map(q => new Document({
        pageContent: `Quiz: ${q.title}`,
        metadata: { type: "quiz", slug: q.slug, quizType: q.quizType },
      })),
    ]

    const embeddings = new OpenAIEmbeddings()
    return await MemoryVectorStore.fromDocuments(documents, embeddings)

  } catch (err) {
    console.error("Vector init error:", err)
    return new MemoryVectorStore(new OpenAIEmbeddings())
  }
}

function buildSystemMessage(docs: Document[]): string {
  let message = `You are a helpful AI assistant on a learning platform. Here are relevant resources:\n\n`

  if (docs.length) {
    for (const doc of docs) {
      const name = doc.pageContent.split("\n")[0].replace(/^Course: |^Quiz: /, "")
      const link = doc.metadata.type === "course"
        ? `${CONFIG.BASE_URL}/dashboard/course/${doc.metadata.slug}`
        : `${CONFIG.BASE_URL}/dashboard/${doc.metadata.quizType}/${doc.metadata.slug}`

      message += `- ${doc.metadata.type === "course" ? "Course" : "Quiz"}: [${name}](${link})\n`
    }
  } else {
    message += "No matching items found.\n"
  }

  message += `\nIf no content matches, suggest creating:\n- [New Course](${CONFIG.BASE_URL}/dashboard/explore)\n- [New Quiz](${CONFIG.BASE_URL}/dashboard/quiz)\n\nKeep answers short and friendly.`

  return message
}
