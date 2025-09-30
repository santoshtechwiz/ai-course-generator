/**
 * Chat Memory Manager
 * 
 * Handles conversation memory storage and retrieval with:
 * - Session-based conversation tracking
 * - Message persistence
 * - Memory cleanup and optimization
 * - Context window management
 */

import { ChatMessage } from "./chat-service"
import { logger } from "@/lib/logger"

export interface MemoryConfig {
  maxMessagesPerSession: number
  sessionTimeoutHours: number
  compressionThreshold: number
}

export class ChatMemoryManager {
  private config: MemoryConfig
  private memoryCache: Map<string, ChatMessage[]> = new Map()
  private userId: string

  constructor(userId: string, config?: Partial<MemoryConfig>) {
    this.userId = userId
    this.config = {
      maxMessagesPerSession: 50,
      sessionTimeoutHours: 24,
      compressionThreshold: 30,
      ...config
    }
  }

  /**
   * Add a message to session memory
   */
  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    try {
      // Add to cache
      const sessionMessages = this.memoryCache.get(sessionId) || []
      sessionMessages.push(message)
      
      // Maintain max messages limit
      if (sessionMessages.length > this.config.maxMessagesPerSession) {
        sessionMessages.splice(0, sessionMessages.length - this.config.maxMessagesPerSession)
      }
      
      this.memoryCache.set(sessionId, sessionMessages)

      // Persist to database - DISABLED: keep in-memory only for performance
      // (previously this.persistMessage wrote to Prisma). We intentionally
      // avoid any DB calls here to prevent latency and growth of chat tables.
      try {
        await this.persistMessage(sessionId, message)
      } catch (err) {
        // persistMessage is intentionally a no-op; keep silent on errors
      }

      // Check if compression is needed
      if (sessionMessages.length > this.config.compressionThreshold) {
        await this.compressSession(sessionId)
      }

    } catch (error) {
      logger.error('Failed to add message to memory', { error, sessionId, messageId: message.id })
      throw error
    }
  }

  /**
   * Get messages for a session
   */
  async getMessages(sessionId: string, limit?: number): Promise<ChatMessage[]> {
    try {
      // Try cache first
      let messages = this.memoryCache.get(sessionId)
      
      if (!messages) {
        // Load from database
        messages = await this.loadMessagesFromDB(sessionId)
        this.memoryCache.set(sessionId, messages)
      }

      // Apply limit if specified
      if (limit && messages.length > limit) {
        return messages.slice(-limit)
      }

      return messages
    } catch (error) {
      logger.error('Failed to get messages from memory', { error, sessionId })
      return []
    }
  }

  /**
   * Clear all messages for a session
   */
  async clearSession(sessionId: string): Promise<void> {
    try {
      // Clear from cache
      this.memoryCache.delete(sessionId)
      // Database persistence disabled: only clear in-memory cache
      logger.info(`Cleared in-memory session ${sessionId}`)
    } catch (error) {
      logger.error('Failed to clear session', { error, sessionId })
      throw error
    }
  }

  /**
   * Get recent conversation summary for context
   */
  async getConversationSummary(sessionId: string, maxMessages: number = 10): Promise<string> {
    try {
      const messages = await this.getMessages(sessionId, maxMessages)
      
      if (messages.length === 0) {
        return "No previous conversation history."
      }

      // Create a summary of the conversation
      const conversationText = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')

      return `Recent conversation:\n${conversationText}`
    } catch (error) {
      logger.error('Failed to get conversation summary', { error, sessionId })
      return "Unable to retrieve conversation history."
    }
  }

  /**
   * Persist message to database
   */
  private async persistMessage(sessionId: string, message: ChatMessage): Promise<void> {
    try {
      // NO-OP: DB persistence disabled. Keep messages in-memory only.
      // This prevents inserting chat data into the database and improves
      // performance when embeddings are used as the primary source of truth.
      if (process.env.NODE_ENV === 'development') {
        logger.debug('persistMessage skipped (DB persistence disabled)', { sessionId, messageId: message.id })
      }
    } catch (error) {
      // If database operation fails, log but don't throw to keep chat working
      logger.error('persistMessage encountered an error (ignored)', {
        error,
        sessionId,
        messageId: message.id,
        userId: this.userId,
      })
      // Chat will continue to work with in-memory storage only
    }
  }

  /**
   * Load messages from database
   */
  private async loadMessagesFromDB(sessionId: string): Promise<ChatMessage[]> {
    try {
      // DB reads disabled: start with an empty message list and rely on
      // in-memory cache for conversation history. Embeddings should be
      // used for cross-session or global knowledge instead of chat logs.
      return []
    } catch (error) {
      logger.error('Failed to load messages from database', { error, sessionId })
      return []
    }
  }

  /**
   * Compress session by summarizing older messages
   */
  private async compressSession(sessionId: string): Promise<void> {
    try {
      const messages = await this.getMessages(sessionId)
      
      if (messages.length <= this.config.compressionThreshold) {
        return
      }

      // Keep recent messages and summarize older ones
      const keepCount = Math.floor(this.config.compressionThreshold * 0.7)
      const recentMessages = messages.slice(-keepCount)
      const oldMessages = messages.slice(0, -keepCount)

      if (oldMessages.length === 0) {
        return
      }

      // Create summary of old messages
      const summary = this.createMessagesSummary(oldMessages)
      
      const summaryMessage: ChatMessage = {
        id: `summary_${Date.now()}`,
        role: 'system',
        content: `[Conversation Summary]: ${summary}`,
        timestamp: Date.now(),
        metadata: { type: 'summary', originalMessageCount: oldMessages.length }
      }

      // Update cache with compressed messages
      const compressedMessages = [summaryMessage, ...recentMessages]
      this.memoryCache.set(sessionId, compressedMessages)

      // Update database (remove old messages and add summary)
      await this.replaceSessionMessages(sessionId, compressedMessages)

      logger.info(`Compressed session ${sessionId}: ${oldMessages.length} messages -> 1 summary`)
    } catch (error) {
      logger.error('Failed to compress session', { error, sessionId })
    }
  }

  /**
   * Create a summary of multiple messages
   */
  private createMessagesSummary(messages: ChatMessage[]): string {
    const userMessages = messages.filter(m => m.role === 'user')
    const assistantMessages = messages.filter(m => m.role === 'assistant')

    if (userMessages.length === 0) {
      return "No significant conversation to summarize."
    }

    const topics = this.extractTopics(userMessages)
    const summary = `User discussed ${topics.join(', ')}. Assistant provided guidance and information.`

    return summary
  }

  /**
   * Extract topics from user messages
   */
  private extractTopics(messages: ChatMessage[]): string[] {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'how', 'what', 'why', 'when', 'where'])
    const topicMap = new Map<string, number>()

    messages.forEach(message => {
      const words = message.content.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word))

      words.forEach(word => {
        topicMap.set(word, (topicMap.get(word) || 0) + 1)
      })
    })

    return Array.from(topicMap.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word)
  }

  /**
   * Replace all session messages with new set
   */
  private async replaceSessionMessages(sessionId: string, messages: ChatMessage[]): Promise<void> {
    try {
      // Replace session messages in-memory only. Database persistence is
      // disabled, so we update the cache and skip any Prisma operations.
      this.memoryCache.set(sessionId, messages)
    } catch (error) {
      logger.error('Failed to replace session messages', { error, sessionId })
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      // Use Prisma to delete expired messages; convert interval calculation to JS Date
      // Database cleanup disabled: only clean up in-memory cache
      // const cutoff = new Date(Date.now() - this.config.sessionTimeoutHours * 2 * 60 * 60 * 1000)
      // await prisma.chatMessage.deleteMany({ where: { createdAt: { lt: cutoff } } })

      // Clean up cache
      const expiredSessions: string[] = []
      this.memoryCache.forEach((messages, sessionId) => {
        const lastMessage = messages[messages.length - 1]
        if (lastMessage && lastMessage.timestamp) {
          const ageHours = (Date.now() - lastMessage.timestamp) / (1000 * 60 * 60)
          if (ageHours > this.config.sessionTimeoutHours) {
            expiredSessions.push(sessionId)
          }
        }
      })

      expiredSessions.forEach(sessionId => {
        this.memoryCache.delete(sessionId)
      })

      logger.info(`Cleaned up expired sessions: ${expiredSessions.length} from cache`)
    } catch (error) {
      logger.error('Failed to cleanup expired sessions', { error })
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string): Promise<{
    messageCount: number
    firstMessage: Date | null
    lastMessage: Date | null
    participantRoles: string[]
  }> {
    try {
      const messages = await this.getMessages(sessionId)
      
      if (messages.length === 0) {
        return {
          messageCount: 0,
          firstMessage: null,
          lastMessage: null,
          participantRoles: []
        }
      }

      const roles = [...new Set(messages.map(m => m.role))]
      const timestamps = messages
        .map(m => m.timestamp)
        .filter(t => t !== undefined) as number[]

      return {
        messageCount: messages.length,
        firstMessage: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
        lastMessage: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null,
        participantRoles: roles
      }
    } catch (error) {
      logger.error('Failed to get session stats', { error, sessionId })
      return {
        messageCount: 0,
        firstMessage: null,
        lastMessage: null,
        participantRoles: []
      }
    }
  }
}
