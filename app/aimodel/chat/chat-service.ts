/**
 * Enhanced Chat Service
 * 
 * Provides intelligent chat capabilities using LangChain with:
 * - Context awareness from user's learning data
 * - Vector similarity search for relevant content
 * - Memory management for conversations
 * - PostgreSQL-backed embeddings
 */

import { BaseAIService, AIServiceContext, StringLengthRule, RequiredFieldRule } from "../core/base-ai-service"
import { EmbeddingManager, EmbeddingDocument } from "../core/embedding-manager"
import { ChatMemoryManager } from "./memory-manager"
import { ContextBuilder } from "./context-builder"
import { openai } from "@ai-sdk/openai"
import { streamText, generateText } from "ai"
import { type CoreMessage } from "ai"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  id: string
  timestamp?: number
  metadata?: Record<string, any>
}

export interface ChatRequest {
  message: string
  sessionId?: string
  includeContext?: boolean
  maxContextItems?: number
}

export interface ChatResponse {
  message: string
  messageId: string
  sessionId: string
  context?: EmbeddingDocument[]
  tokensUsed?: number
  processingTime?: number
}

export interface ChatStreamResponse {
  stream: ReadableStream
  sessionId: string
}

export class ChatService extends BaseAIService {
  private embeddingManager: EmbeddingManager
  private memoryManagers: Map<string, ChatMemoryManager> = new Map()
  private contextBuilder: ContextBuilder

  constructor() {
    super({
      name: 'chat',
      rateLimits: {
        free: { limit: 10, windowInSeconds: 3600 }, // 10 messages per hour for free users
        subscribed: { limit: 100, windowInSeconds: 3600 } // 100 messages per hour for subscribers
      },
      cacheConfig: {
        enabled: true,
        ttl: 300 // 5 minutes
      },
      retryConfig: {
        maxRetries: 2,
        backoffMs: 1000
      }
    })

    this.embeddingManager = new EmbeddingManager()
    this.contextBuilder = new ContextBuilder()
  }

  /**
   * Get or create memory manager for user
   */
  private getMemoryManager(userId: string): ChatMemoryManager {
    if (!this.memoryManagers.has(userId)) {
      this.memoryManagers.set(userId, new ChatMemoryManager(userId))
    }
    return this.memoryManagers.get(userId)!
  }

  /**
   * Initialize the chat service
   */
  async initialize(): Promise<void> {
    await this.embeddingManager.initialize()
    await this.initializeKnowledgeBase()
    logger.info('Chat Service initialized')
  }

  /**
   * Initialize knowledge base with course and quiz content
   */
  private async initializeKnowledgeBase(): Promise<void> {
    try {
      const documentCount = await this.embeddingManager.getDocumentCount()
      
      if (documentCount > 0) {
        logger.info(`Knowledge base already initialized with ${documentCount} documents`)
        return
      }

      logger.info('Initializing knowledge base...')

      // Get courses and quizzes for knowledge base
      const [courses, quizzes] = await Promise.all([
        prisma.course.findMany({
          select: { 
            id: true, 
            title: true, 
            slug: true, 
            description: true,
            category: { select: { name: true } }
          },
          where: { isPublic: true },
          take: 200
        }),
        prisma.userQuiz.findMany({
          select: { 
            id: true, 
            title: true, 
            slug: true, 
            quizType: true,
            description: true
          },
          where: { isPublic: true },
          take: 200
        })
      ])

      // Convert to embedding documents
      const documents: EmbeddingDocument[] = [
        ...courses.map(course => ({
          content: `Course: ${course.title}\nDescription: ${course.description || 'No description available'}\nCategory: ${course.category?.name || 'General'}`,
          metadata: {
            type: 'course',
            id: course.id,
            title: course.title,
            slug: course.slug,
            category: course.category?.name
          }
        })),
        ...quizzes.map(quiz => ({
          content: `Quiz: ${quiz.title}\nType: ${quiz.quizType}\nDescription: ${quiz.description || 'No description available'}`,
          metadata: {
            type: 'quiz',
            id: quiz.id,
            title: quiz.title,
            slug: quiz.slug,
            quizType: quiz.quizType
          }
        }))
      ]

      await this.embeddingManager.addDocuments(documents)
      logger.info(`Knowledge base initialized with ${documents.length} documents`)
    } catch (error) {
      logger.error('Failed to initialize knowledge base', { error })
    }
  }

  /**
   * Process chat message with streaming response
   */
  async processStream(request: ChatRequest, context: AIServiceContext): Promise<ChatStreamResponse> {
    const startTime = Date.now()
    
    // Check rate limits
    const rateLimitResult = await this.checkRateLimit(context)
    if (!rateLimitResult.success) {
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.reset || 0) - Date.now() / 1000)} seconds`)
    }

    // Validate input
    const validation = this.validateInput(request, [
      new RequiredFieldRule('message'),
      new StringLengthRule(1, 2000, 'message')
    ])

    if (!validation.isValid) {
      throw new Error(`Invalid input: ${validation.message}`)
    }

    this.logActivity('stream_chat_request', context, { messageLength: request.message.length })

    return this.executeWithRetry(async () => {
      const sessionId = request.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const memoryManager = this.getMemoryManager(context.userId)

      // Get conversation context
      const messages = await this.buildConversationContext(request, context, sessionId, memoryManager)

      // Generate streaming response
      const result = await streamText({
        model: openai("gpt-4o-mini"),
        messages,
        temperature: 0.7,
        maxTokens: 500,
        stream: true
      })

      // Save user message to memory
      const userMessage: ChatMessage = {
        role: 'user',
        content: request.message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      }

      await memoryManager.addMessage(sessionId, userMessage)

      // Handle assistant response saving asynchronously
      result.text.then(async (assistantText) => {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: assistantText,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        }

        await memoryManager.addMessage(sessionId, assistantMessage)
        
        this.logActivity('stream_chat_response', context, {
          sessionId,
          responseLength: assistantText.length,
          processingTime: Date.now() - startTime
        })
      })

      return {
        stream: result.textStream,
        sessionId
      }
    }, context)
  }

  /**
   * Process chat message with complete response
   */
  async process(request: ChatRequest, context: AIServiceContext): Promise<ChatResponse> {
    const startTime = Date.now()
    
    // Check rate limits
    const rateLimitResult = await this.checkRateLimit(context)
    if (!rateLimitResult.success) {
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.reset || 0) - Date.now() / 1000)} seconds`)
    }

    // Validate input
    const validation = this.validateInput(request, [
      new RequiredFieldRule('message'),
      new StringLengthRule(1, 2000, 'message')
    ])

    if (!validation.isValid) {
      throw new Error(`Invalid input: ${validation.message}`)
    }

    this.logActivity('chat_request', context, { messageLength: request.message.length })

    return this.executeWithRetry(async () => {
      const sessionId = request.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const memoryManager = this.getMemoryManager(context.userId)

      // Get conversation context
      const messages = await this.buildConversationContext(request, context, sessionId, memoryManager)

      // Generate response
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        messages,
        temperature: 0.7,
        maxTokens: 500
      })

      // Save messages to memory
      const userMessage: ChatMessage = {
        role: 'user',
        content: request.message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.text,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      }

      await Promise.all([
        memoryManager.addMessage(sessionId, userMessage),
        memoryManager.addMessage(sessionId, assistantMessage)
      ])

      const processingTime = Date.now() - startTime

      this.logActivity('chat_response', context, {
        sessionId,
        responseLength: result.text.length,
        processingTime
      })

      return {
        message: result.text,
        messageId: assistantMessage.id,
        sessionId,
        tokensUsed: result.usage?.totalTokens,
        processingTime
      }
    }, context)
  }

  /**
   * Build conversation context including history and relevant content
   */
  private async buildConversationContext(
    request: ChatRequest, 
    context: AIServiceContext, 
    sessionId: string,
    memoryManager: ChatMemoryManager
  ): Promise<CoreMessage[]> {
    const messages: CoreMessage[] = []

    // Get relevant content if requested
    let relevantDocs: EmbeddingDocument[] = []
    if (request.includeContext !== false) {
      relevantDocs = await this.embeddingManager.similaritySearch(
        request.message,
        { 
          limit: request.maxContextItems || 3,
          threshold: 0.7
        }
      )
    }

    // Build system message with context
    const systemContent = await this.contextBuilder.buildSystemMessage(
      context.userId,
      relevantDocs
    )

    messages.push({
      role: 'system',
      content: systemContent
    })

    // Get conversation history
    const history = await memoryManager.getMessages(sessionId, 10)
    
    // Add conversation history
    for (const msg of history) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: request.message
    })

    return messages
  }

  /**
   * Clear conversation history for a session
   */
  async clearSession(sessionId: string, context: AIServiceContext): Promise<void> {
    const memoryManager = this.getMemoryManager(context.userId)
    await memoryManager.clearSession(sessionId)
    this.logActivity('session_cleared', context, { sessionId })
  }

  /**
   * Get conversation history for a session
   */
  async getSessionHistory(sessionId: string, context: AIServiceContext): Promise<ChatMessage[]> {
    const memoryManager = this.getMemoryManager(context.userId)
    this.logActivity('session_history_requested', context, { sessionId })
    return await memoryManager.getMessages(sessionId)
  }

  /**
   * Update knowledge base with new content
   */
  async updateKnowledgeBase(documents: EmbeddingDocument[]): Promise<void> {
    await this.embeddingManager.addDocuments(documents)
    logger.info(`Added ${documents.length} documents to knowledge base`)
  }

  /**
   * Search knowledge base
   */
  async searchKnowledgeBase(
    query: string, 
    limit: number = 5,
    context?: AIServiceContext
  ): Promise<EmbeddingDocument[]> {
    if (context) {
      this.logActivity('knowledge_search', context, { query, limit })
    }
    
    return await this.embeddingManager.similaritySearch(query, { limit })
  }
}
