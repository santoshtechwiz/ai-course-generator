/**
 * RAG Service - Retrieval Augmented Generation for CourseAI
 * 
 * Features:
 * - Semantic search using embeddings
 * - Context building from relevant course content
 * - OpenAI chat completions with cost optimization
 * - Simple conversation memory (last few messages)
 */

import { OpenAI } from 'openai'
import { getEmbeddingService } from '../embeddingService'
import { logger } from '@/lib/logger'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

interface RAGContext {
  relevantDocuments: Array<{
    content: string
    metadata: any
    similarity: number
  }>
  conversationHistory: ChatMessage[]
}

interface RAGResponse {
  content: string
  tokensUsed: number
  relevantSources: number
  context?: RAGContext  // Include context for action generation
}

export class RAGService {
  private openai: OpenAI
  private embeddingService: ReturnType<typeof getEmbeddingService>
  
  // Simple in-memory conversation storage (in production, use Redis or DB)
  private conversations: Map<string, ChatMessage[]> = new Map()
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    this.embeddingService = getEmbeddingService()
  }

  /**
   * Initialize the RAG service
   */
  async initialize(): Promise<void> {
    await this.embeddingService.initialize()
    logger.info('[RAGService] Initialized successfully')
  }

  /**
   * Generate a response using RAG
   */
  async generateResponse(
    userId: string,
    message: string,
    options: {
      maxTokens?: number
      temperature?: number
      includeHistory?: boolean
      contextLimit?: number
    } = {}
  ): Promise<RAGResponse> {
    const {
      maxTokens = 300,
      temperature = 0.7,
      includeHistory = true,
      contextLimit = 3
    } = options

    try {
      // Build context using semantic search and conversation history
      const context = await this._buildContext(userId, message, {
        includeHistory,
        contextLimit
      })

      // Generate response using OpenAI
      const systemPrompt = this._buildSystemPrompt(context)
      const userPrompt = message

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature,
        stream: false
      })

      const content = response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'
      const tokensUsed = response.usage?.total_tokens || 0

      // Store the conversation
      this._addToConversation(userId, [
        { role: 'user', content: message, timestamp: Date.now() },
        { role: 'assistant', content, timestamp: Date.now() }
      ])

      return {
        content,
        tokensUsed,
        relevantSources: context.relevantDocuments.length,
        context  // Include context for action generation
      }
    } catch (error) {
      logger.error('[RAGService] Failed to generate response:', error)
      throw new Error('Failed to generate response. Please try again.')
    }
  }

  /**
   * Generate a streaming response using RAG
   */
  async generateStreamingResponse(
    userId: string,
    message: string,
    options: {
      maxTokens?: number
      temperature?: number
      includeHistory?: boolean
      contextLimit?: number
    } = {}
  ): Promise<ReadableStream<Uint8Array>> {
    const {
      maxTokens = 300,
      temperature = 0.7,
      includeHistory = true,
      contextLimit = 3
    } = options

    try {
      // Build context
      const context = await this._buildContext(userId, message, {
        includeHistory,
        contextLimit
      })

      // Generate streaming response
      const systemPrompt = this._buildSystemPrompt(context)
      const userPrompt = message

      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature,
        stream: true
      })

      // Create a readable stream that collects the full response for storage
      let fullResponse = ''
      const self = this
      
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || ''
              if (content) {
                fullResponse += content
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`))
              }
            }
            
            // Store the conversation after streaming completes
            self._addToConversation(userId, [
              { role: 'user', content: message, timestamp: Date.now() },
              { role: 'assistant', content: fullResponse, timestamp: Date.now() }
            ])
            
            controller.close()
          } catch (error) {
            logger.error('[RAGService] Streaming error:', error)
            controller.error(error)
          }
        }
      })

      return readableStream
    } catch (error) {
      logger.error('[RAGService] Failed to generate streaming response:', error)
      throw new Error('Failed to generate streaming response. Please try again.')
    }
  }

  /**
   * Build context from relevant documents and conversation history
   */
  private async _buildContext(
    userId: string,
    message: string,
    options: { includeHistory: boolean; contextLimit: number }
  ): Promise<RAGContext> {
    // Get relevant documents using semantic search
    const searchResults = await this.embeddingService.search(message, {
      topK: 5,
      threshold: 0.1
    })

    const relevantDocuments = searchResults.map(result => ({
      content: result.document.content,
      metadata: result.document.metadata,
      similarity: result.similarity
    }))

    // Get conversation history if requested
    let conversationHistory: ChatMessage[] = []
    if (options.includeHistory) {
      const fullHistory = this.conversations.get(userId) || []
      // Get last N messages (pairs of user-assistant)
      conversationHistory = fullHistory.slice(-options.contextLimit * 2)
    }

    return {
      relevantDocuments,
      conversationHistory
    }
  }

  /**
   * Build system prompt with context
   */
  private _buildSystemPrompt(context: RAGContext): string {
    let prompt = `You are CourseAI, an intelligent learning assistant for an online education platform. You help students with questions about their courses, provide explanations, and guide their learning journey.

Guidelines:
- Be helpful, accurate, and concise
- Focus on educational content and learning support
- If you don't have specific information, say so honestly
- Encourage learning and provide practical guidance
- Use the provided context to give relevant, specific answers

`

    // Add relevant documents context
    if (context.relevantDocuments.length > 0) {
      prompt += `Relevant Course Content:
${context.relevantDocuments.map((doc, index) => 
  `${index + 1}. ${doc.content} (Type: ${doc.metadata.type}, Similarity: ${doc.similarity.toFixed(2)})`
).join('\n')}

`
    }

    // Add conversation history
    if (context.conversationHistory.length > 0) {
      prompt += `Recent Conversation:
${context.conversationHistory.map(msg => 
  `${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.content}`
).join('\n')}

`
    }

    prompt += `Please provide a helpful response based on the context above. If the question is not related to the course content, politely redirect the conversation back to learning topics.`

    return prompt
  }

  /**
   * Add messages to conversation history
   */
  private _addToConversation(userId: string, messages: ChatMessage[]): void {
    const conversation = this.conversations.get(userId) || []
    conversation.push(...messages)
    
    // Keep only last 20 messages to prevent memory issues
    if (conversation.length > 20) {
      conversation.splice(0, conversation.length - 20)
    }
    
    this.conversations.set(userId, conversation)
  }

  /**
   * Clear conversation history for a user
   */
  clearConversation(userId: string): void {
    this.conversations.delete(userId)
    logger.info(`[RAGService] Cleared conversation for user ${userId}`)
  }

  /**
   * Get conversation history for a user
   */
  getConversationHistory(userId: string): ChatMessage[] {
    return this.conversations.get(userId) || []
  }

  /**
   * Get service statistics
   */
  getStats() {
    const embeddingStats = this.embeddingService.getStats()
    return {
      embedding: embeddingStats,
      conversations: {
        activeUsers: this.conversations.size,
        totalMessages: Array.from(this.conversations.values())
          .reduce((sum, conv) => sum + conv.length, 0)
      }
    }
  }

  /**
   * Check if a query is relevant to course content
   */
  async isRelevantQuery(query: string): Promise<boolean> {
    try {
      const results = await this.embeddingService.search(query, {
        topK: 1,
        threshold: 0.05 // Lower threshold for relevance check
      })
      return results.length > 0
    } catch (error) {
      logger.error('[RAGService] Failed to check query relevance:', error)
      return true // Default to relevant if check fails
    }
  }

  /**
   * Clean up old conversations (call periodically)
   */
  cleanupOldConversations(maxAgeHours: number = 24): void {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000)
    let cleaned = 0

    for (const [userId, messages] of this.conversations.entries()) {
      const filteredMessages = messages.filter(msg => 
        (msg.timestamp || 0) > cutoffTime
      )
      
      if (filteredMessages.length === 0) {
        this.conversations.delete(userId)
        cleaned++
      } else if (filteredMessages.length !== messages.length) {
        this.conversations.set(userId, filteredMessages)
      }
    }

    if (cleaned > 0) {
      logger.info(`[RAGService] Cleaned up ${cleaned} old conversations`)
    }
  }
}

// Singleton instance
let ragServiceInstance: RAGService | null = null

export function getRAGService(): RAGService {
  if (!ragServiceInstance) {
    ragServiceInstance = new RAGService()
  }
  return ragServiceInstance
}