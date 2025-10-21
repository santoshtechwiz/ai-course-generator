/**
 * AI Model Services - Main Export
 * 
 * Centralized AI services for the CourseAI platform including:
 * - Enhanced chat functionality with memory and context
 * - Personalized recommendations with multiple strategies
 * - Vector embeddings for content similarity
 * - User behavior analysis and profiling
 */












// Re-export types






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
