// route.ts
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { type CoreMessage } from "ai"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"
import type { NextRequest } from "next/server"
import { OpenAIEmbeddings } from "@langchain/openai"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { Document } from "langchain/document"
import { rateLimit } from "@/lib/rate-limit"
import { encode } from "gpt-tokenizer"

interface Message {
  role: string;
  content: string;
  id: string;
  timestamp?: number;
}

class MemoryManager {
  private messages: Message[] = []
  private lastMessageTime: number = 0
  private messageCount: number = 0

  constructor(
    private sessionId: string,
    private maxMessages: number = 10,
    private cooldownMs: number = 1000 // 1 second cooldown between messages
  ) {}

  async addMessage(message: Message) {
    // Add timestamp if not provided
    if (!message.timestamp) {
      message.timestamp = Date.now()
    }
    
    this.lastMessageTime = message.timestamp
    this.messageCount++
    
    this.messages.push(message)
    this.messages = this.messages.slice(-this.maxMessages)
    
    // Update in-memory cache to keep track of user activity
    MemoryManager.updateUserActivity(this.sessionId, {
      lastMessageTime: this.lastMessageTime,
      messageCount: this.messageCount
    })
  }

  async getMessages() {
    return this.messages.map(({ role, content }) => ({ role, content }))
  }
  
  isOnCooldown(): boolean {
    return (Date.now() - this.lastMessageTime) < this.cooldownMs
  }
  
  // Global cache for messages and rate limiting
  static cache = new Map<string, any>()
  static userActivity = new Map<string, { lastMessageTime: number, messageCount: number, warnings: number }>()
  
  static set = (k: string, v: any) => this.cache.set(k, v)
  static get = (k: string) => this.cache.get(k)
  
  static updateUserActivity(userId: string, data: Partial<{ lastMessageTime: number, messageCount: number }>) {
    const current = this.userActivity.get(userId) || { lastMessageTime: 0, messageCount: 0, warnings: 0 }
    this.userActivity.set(userId, { ...current, ...data })
  }
  
  static getUserActivity(userId: string) {
    return this.userActivity.get(userId) || { lastMessageTime: 0, messageCount: 0, warnings: 0 }
  }
  
  static incrementWarning(userId: string) {
    const current = this.getUserActivity(userId)
    current.warnings++
    this.userActivity.set(userId, current)
    return current.warnings
  }
}

const CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_URL!,
  MAX_RESULTS: 3,
  MEMORY_LIMIT: 3,
  MAX_RESPONSE_TOKENS: 100,
  
  // Rate limiting settings
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 10,    // 10 requests per minute
    REQUESTS_PER_HOUR: 100,     // 100 requests per hour
    COOLDOWN_MS: 1500,          // 1.5 second cooldown between messages
  },
  
  // Input validation
  VALIDATION: {
    MAX_MESSAGE_LENGTH: 500,    // Maximum message length in characters
    MAX_MESSAGE_TOKENS: 150,    // Maximum message length in tokens
    MIN_MESSAGE_LENGTH: 2,      // Minimum message length
  },
  
  // Spam prevention
  SPAM: {
    WARNING_THRESHOLD: 3,       // Number of warnings before temporary ban
    BAN_DURATION_MINUTES: 30,   // Ban duration in minutes after warnings threshold
  }
}

let vectorStore: MemoryVectorStore | null = null

import { checkForSpam } from "@/lib/spam-detection"

export async function POST(req: NextRequest) {
  try {
    // 1. Basic authentication
    const { messages } = await req.json()
    const session = await getAuthSession()
    const userId = session?.user?.id

    if (!userId) return new Response("Unauthorized", { status: 401 })
    
    // 2. Extract and validate the message
    const lastMessage = messages.at(-1)?.content?.trim()
    if (!lastMessage) {
      return new Response(JSON.stringify({ 
        error: "Invalid message", 
        details: "Message cannot be empty" 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    
    // 3. Check message length
    if (lastMessage.length < CONFIG.VALIDATION.MIN_MESSAGE_LENGTH) {
      return new Response(JSON.stringify({ 
        error: "Message too short", 
        details: `Message must be at least ${CONFIG.VALIDATION.MIN_MESSAGE_LENGTH} characters` 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    
    if (lastMessage.length > CONFIG.VALIDATION.MAX_MESSAGE_LENGTH) {
      return new Response(JSON.stringify({ 
        error: "Message too long", 
        details: `Message cannot exceed ${CONFIG.VALIDATION.MAX_MESSAGE_LENGTH} characters` 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    
    // 4. Check token count if needed
    try {
      const tokens = encode(lastMessage).length
      if (tokens > CONFIG.VALIDATION.MAX_MESSAGE_TOKENS) {
        return new Response(JSON.stringify({ 
          error: "Message too complex", 
          details: `Message exceeds the maximum allowed tokens (${CONFIG.VALIDATION.MAX_MESSAGE_TOKENS})` 
        }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
    } catch (e) {
      // If tokenizer fails, fall back to character check only
      console.warn("Token counting failed:", e)
    }
    
    // 5. Check for spam content
    const spamCheck = checkForSpam(lastMessage)
    if (spamCheck.isSpam) {
      const warnings = MemoryManager.incrementWarning(userId)
      
      // If user has too many warnings, implement a temporary ban
      if (warnings >= CONFIG.SPAM.WARNING_THRESHOLD) {
        return new Response(JSON.stringify({ 
          error: "Too many spam attempts", 
          details: `You have been temporarily limited due to multiple spam attempts. Please try again in ${CONFIG.SPAM.BAN_DURATION_MINUTES} minutes.`,
          cooldown: CONFIG.SPAM.BAN_DURATION_MINUTES * 60, // in seconds
        }), { status: 429, headers: { 'Content-Type': 'application/json' } })
      }
      
      return new Response(JSON.stringify({ 
        error: "Spam detected", 
        details: `Your message was flagged as potential spam: ${spamCheck.reason}. Warning ${warnings}/${CONFIG.SPAM.WARNING_THRESHOLD}` 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    
    // 6. Apply rate limiting
    // Per-minute rate limit
    const minuteRateLimit = await rateLimit(userId, {
      limit: CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE,
      windowInSeconds: 60,
      identifier: 'chat:minute'
    })
    
    if (!minuteRateLimit.success) {
      return new Response(JSON.stringify({ 
        error: "Rate limit exceeded", 
        details: `You've sent too many messages. Please wait ${Math.ceil(minuteRateLimit.reset - Math.floor(Date.now()/1000))} seconds.`,
        cooldown: minuteRateLimit.reset - Math.floor(Date.now()/1000),
      }), { 
        status: 429, 
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(minuteRateLimit.limit),
          'X-RateLimit-Remaining': String(minuteRateLimit.remaining),
          'X-RateLimit-Reset': String(minuteRateLimit.reset),
        } 
      })
    }
    
    // Per-hour rate limit
    const hourRateLimit = await rateLimit(userId, {
      limit: CONFIG.RATE_LIMIT.REQUESTS_PER_HOUR,
      windowInSeconds: 3600,
      identifier: 'chat:hour'
    })
    
    if (!hourRateLimit.success) {
      return new Response(JSON.stringify({ 
        error: "Hourly limit exceeded", 
        details: `You've reached your hourly message limit. Please try again later.`,
        cooldown: hourRateLimit.reset - Math.floor(Date.now()/1000),
      }), { 
        status: 429, 
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(hourRateLimit.limit),
          'X-RateLimit-Remaining': String(hourRateLimit.remaining),
          'X-RateLimit-Reset': String(hourRateLimit.reset),
        } 
      })
    }
    
    // 7. Initialize memory manager with cooldown
    const memory = new MemoryManager(userId, CONFIG.MEMORY_LIMIT, CONFIG.RATE_LIMIT.COOLDOWN_MS)
    
    // 8. Check for rapid message sending (cooldown)
    if (memory.isOnCooldown()) {
      return new Response(JSON.stringify({ 
        error: "Please slow down", 
        details: "You're sending messages too quickly." 
      }), { status: 429, headers: { 'Content-Type': 'application/json' } })
    }
    
    // 9. Add message to memory
    await memory.addMessage({ role: "user", content: lastMessage, id: "", timestamp: Date.now() })
    
    // 10. Process the message with the vector store
    if (!vectorStore) vectorStore = await initializeVectorStore()
    
    const similarDocs = await vectorStore.similaritySearch(lastMessage, CONFIG.MAX_RESULTS)
    const systemMessage = buildSystemMessage(similarDocs)
    
    const memoryHistory = await memory.getMessages()    // Convert messages to the format expected by the AI SDK
    const finalMessages: CoreMessage[] = [
      { role: "system", content: systemMessage },
      ...memoryHistory.map(m => ({ 
        role: m.role === "user" ? "user" : 
              m.role === "assistant" ? "assistant" : 
              m.role === "system" ? "system" : "user", 
        content: m.content 
      })) as CoreMessage[]
    ]
    
    // 11. Generate response
    const result = await streamText({
      model: openai("gpt-3.5-turbo"),
      messages: finalMessages,
      temperature: 0.7,
      maxTokens: CONFIG.MAX_RESPONSE_TOKENS,
    })
    
    // 12. Save the AI's response
    result.text.then(async (aiReply) => {
      try {
        await memory.addMessage({ role: "assistant", content: aiReply, id: "", timestamp: Date.now() })
      } catch (e) {
        console.error("Failed to save AI response:", e)
      }
    })
    
    return result.toDataStreamResponse()
    
  } catch (err) {
    console.error("Chatbot error:", err)
    return new Response(JSON.stringify({ 
      error: "Internal Server Error", 
      details: "An unexpected error occurred" 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } })
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
