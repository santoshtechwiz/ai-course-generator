/**
 * Shared types for chat module
 * Prevents circular dependencies between chat-service and memory-manager
 */

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
  context?: any[]
  tokensUsed?: number
  processingTime?: number
}

export interface ChatStreamResponse {
  stream: ReadableStream
  sessionId: string
}
