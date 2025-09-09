/**
 * AI Model Services - Main Export
 * 
 * Centralized AI services for the CourseAI platform including:
 * - Enhanced chat functionality with memory and context
 * - Personalized recommendations with multiple strategies
 * - Vector embeddings for content similarity
 * - User behavior analysis and profiling
 */

export { BaseAIService } from './core/base-ai-service'
export { EmbeddingManager } from './core/embedding-manager'

export { ChatService } from './chat/chat-service'
export { ChatMemoryManager } from './chat/memory-manager'
export { ContextBuilder } from './chat/context-builder'

export { RecommendationService } from './recommendations/recommendation-service'
export { UserAnalyzer } from './recommendations/user-analyzer'
export { ContentMatcher } from './recommendations/content-matcher'

// Re-export types
export type { 
  AIServiceContext,
  ValidationRule
} from './core/base-ai-service'

export type {
  EmbeddingDocument
} from './core/embedding-manager'

export type {
  ChatRequest,
  ChatResponse,
  ChatMessage
} from './chat/chat-service'

export type {
  RecommendationRequest,
  Recommendation
} from './recommendations/recommendation-service'

export type {
  UserProfile
} from './recommendations/user-analyzer'

export type {
  ContentItem,
  MatchScore,
  MatchingOptions
} from './recommendations/content-matcher'

// Import the classes for the initialization function
import { EmbeddingManager } from './core/embedding-manager'
import { ChatService } from './chat/chat-service'
import { RecommendationService } from './recommendations/recommendation-service'
import { UserAnalyzer } from './recommendations/user-analyzer'
import { ContentMatcher } from './recommendations/content-matcher'

/**
 * Initialize all AI services
 */
export async function initializeAIServices(): Promise<{
  embeddingManager: EmbeddingManager
  chatService: ChatService
  recommendationService: RecommendationService
  userAnalyzer: UserAnalyzer
  contentMatcher: ContentMatcher
}> {
  // Initialize embedding manager
  const embeddingManager = new EmbeddingManager()
  await embeddingManager.initialize()

  // Initialize user analyzer
  const userAnalyzer = new UserAnalyzer()
  await userAnalyzer.initialize()

  // Initialize content matcher
  const contentMatcher = new ContentMatcher(embeddingManager)
  await contentMatcher.initialize()

  // Initialize chat service
  const chatService = new ChatService(embeddingManager)
  await chatService.initialize()

  // Initialize recommendation service
  const recommendationService = new RecommendationService(
    embeddingManager,
    userAnalyzer,
    contentMatcher
  )
  await recommendationService.initialize()

  return {
    embeddingManager,
    chatService,
    recommendationService,
    userAnalyzer,
    contentMatcher
  }
}
