import { EmbeddingManager } from "@/app/aimodel/core/embedding-manager"
import { ChatMemoryManager } from "@/app/aimodel/chat/memory-manager"
import { ContextBuilder } from "@/app/aimodel/chat/context-builder"
import { getAuthSession } from "@/lib/auth"
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import type { NextRequest } from "next/server"
import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"

// Initialize services globally
let embeddingManager: EmbeddingManager | null = null
let contextBuilder: ContextBuilder | null = null
const memoryManagers: Map<string, ChatMemoryManager> = new Map()

async function getEmbeddingManager(): Promise<EmbeddingManager> {
  if (!embeddingManager) {
    embeddingManager = new EmbeddingManager()
    await embeddingManager.initialize()
  }
  return embeddingManager
}

function getContextBuilder(): ContextBuilder {
  if (!contextBuilder) {
    contextBuilder = new ContextBuilder()
  }
  return contextBuilder
}

function getMemoryManager(userId: string): ChatMemoryManager {
  if (!memoryManagers.has(userId)) {
    memoryManagers.set(userId, new ChatMemoryManager(userId))
  }
  return memoryManagers.get(userId)!
}

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

    // Get services
    const embeddingMgr = await getEmbeddingManager()
    const contextBldr = getContextBuilder()
    const memoryMgr = getMemoryManager(userId)

    const sessionId = `user_${userId}_${Date.now()}`

    // Get relevant content using embeddings
    const relevantDocs = await embeddingMgr.similaritySearch(userMessage, {
      limit: 3,
      threshold: 0.7,
    })

    // Build system message with context
    const systemMessage = await contextBldr.buildSystemMessage(userId, relevantDocs)

    // Get conversation history
    const history = await memoryMgr.getMessages(sessionId, 5)

    // Build messages array
    const chatMessages = [
      { role: "system" as const, content: systemMessage },
      ...history.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      ...messages,
    ]

    // Save user message to memory
    await memoryMgr.addMessage(sessionId, {
      role: "user",
      content: userMessage,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    })

    // Generate streaming response
    const result = await streamText({
      model: openai("gpt-4o-mini"),
      messages: chatMessages,
      temperature: 0.7,
      maxTokens: 500,
    })

    // Save assistant response after streaming finishes
    result.text
      .then(async (assistantText) => {
        await memoryMgr.addMessage(sessionId, {
          role: "assistant",
          content: assistantText,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        })
      })
      .catch((error) => {
        logger.error("Failed to save assistant message to memory", { error, sessionId })
      })

    // Use the AI SDK's text stream response with proper headers
    const response = result.toTextStreamResponse()

    // Ensure proper headers for the client's data stream parser
    const headers = new Headers(response.headers)
    headers.set("Content-Type", "text/plain; charset=utf-8")
    headers.set("Cache-Control", "no-cache")
    headers.set("Connection", "keep-alive")
    headers.set("X-Accel-Buffering", "no")

    return new Response(response.body, {
      status: 200,
      headers,
    })
  } catch (error) {
    logger.error("Chat API error", { error })
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}

