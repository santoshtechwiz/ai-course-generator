/**
 * Enhanced Recommendations Service
 * 
 * Provides AI-powered personalized recommendations using:
 * - Advanced user behavior analysis
 * - Vector similarity matching
 * - Machine learning insights
 * - Collaborative filtering
 * - Content-based filtering
 */

import { BaseAIService, AIServiceContext } from "../core/base-ai-service"
import { EmbeddingManager, EmbeddingDocument } from "../core/embedding-manager"
import { UserAnalyzer, UserProfile } from "./user-analyzer"
import { ContentMatcher } from "./content-matcher"
import OpenAI from 'openai'
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

export interface RecommendationRequest {
  userId: string
  type?: 'course' | 'quiz' | 'mixed'
  limit?: number
  includeExplanation?: boolean
  forceRefresh?: boolean
  context?: {
    currentCourse?: string
    currentTopic?: string
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
  }
}

export interface Recommendation {
  id: string
  type: 'course' | 'quiz'
  title: string
  slug: string
  description?: string
  category?: string
  difficulty?: string
  estimatedTime?: number
  confidence: number
  reasoning: string
  aiExplanation?: string
  metadata: {
    contentType: string
    tags: string[]
    prerequisites?: string[]
    learningObjectives?: string[]
  }
}

export interface RecommendationResponse {
  recommendations: Recommendation[]
  totalCount: number
  generatedAt: Date
  cacheExpiry: Date
  explanations?: {
    methodology: string
    userProfileSummary: string
    factors: string[]
  }
}

export class RecommendationService extends BaseAIService {
  private embeddingManager: EmbeddingManager
  private userAnalyzer: UserAnalyzer
  private contentMatcher: ContentMatcher

  constructor() {
    super({
      name: 'recommendations',
      rateLimits: {
        free: { limit: 20, windowInSeconds: 3600 }, // 20 requests per hour for free users
        subscribed: { limit: 100, windowInSeconds: 3600 } // 100 requests per hour for subscribers
      },
      cacheConfig: {
        enabled: true,
        ttl: 1800 // 30 minutes
      },
      retryConfig: {
        maxRetries: 2,
        backoffMs: 1000
      }
    })

    this.embeddingManager = new EmbeddingManager()
    this.userAnalyzer = new UserAnalyzer()
    this.contentMatcher = new ContentMatcher()
  }

  /**
   * Initialize the recommendation service
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.embeddingManager.initialize(),
      this.userAnalyzer.initialize(),
      this.contentMatcher.initialize()
    ])
    logger.info('Recommendation Service initialized')
  }

  /**
   * Generate personalized recommendations
   */
  async process(request: RecommendationRequest, context: AIServiceContext): Promise<RecommendationResponse> {
    const startTime = Date.now()

    // Check rate limits
    const rateLimitResult = await this.checkRateLimit(context)
    if (!rateLimitResult.success) {
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.reset || 0) - Date.now() / 1000)} seconds`)
    }

    // Check cache unless force refresh is requested
    if (!request.forceRefresh) {
      const cacheKey = this.buildCacheKey(request)
      const cached = this.getCachedData<RecommendationResponse>(cacheKey)
      if (cached) {
        this.logActivity('cache_hit', context, { userId: request.userId })
        return cached
      }
    }

    this.logActivity('generate_recommendations', context, { 
      userId: request.userId, 
      type: request.type,
      limit: request.limit 
    })

    return this.executeWithRetry(async () => {
      // Analyze user profile
      const userProfile = await this.userAnalyzer.analyzeUser(request.userId)
      
      // Get content recommendations using multiple strategies
      const recommendations = await this.generateRecommendations(request, userProfile)
      
      // Enhance with AI explanations if requested
      if (request.includeExplanation) {
        await this.enhanceWithAIExplanations(recommendations, userProfile)
      }

      const response: RecommendationResponse = {
        recommendations,
        totalCount: recommendations.length,
        generatedAt: new Date(),
        cacheExpiry: new Date(Date.now() + this.config.cacheConfig.ttl * 1000),
        explanations: request.includeExplanation ? {
          methodology: this.getMethodologyExplanation(),
          userProfileSummary: this.getUserProfileSummary(userProfile),
          factors: this.getRecommendationFactors(userProfile)
        } : undefined
      }

      // Cache the result
      if (!request.forceRefresh) {
        const cacheKey = this.buildCacheKey(request)
        this.setCachedData(cacheKey, response)
      }

      this.logActivity('recommendations_generated', context, {
        userId: request.userId,
        count: recommendations.length,
        processingTime: Date.now() - startTime
      })

      return response
    }, context)
  }

  /**
   * Generate recommendations using multiple strategies
   */
  private async generateRecommendations(
    request: RecommendationRequest,
    userProfile: UserProfile
  ): Promise<Recommendation[]> {
    const limit = request.limit || 5
    const recommendations: Recommendation[] = []

    try {
      // Strategy 1: Content-based filtering
      const contentBased = await this.getContentBasedRecommendations(request, userProfile, Math.ceil(limit * 0.4))
      recommendations.push(...contentBased)

      // Strategy 2: Collaborative filtering
      const collaborative = await this.getCollaborativeRecommendations(request, userProfile, Math.ceil(limit * 0.3))
      recommendations.push(...collaborative)

      // Strategy 3: Knowledge gap analysis
      const knowledgeGap = await this.getKnowledgeGapRecommendations(request, userProfile, Math.ceil(limit * 0.3))
      recommendations.push(...knowledgeGap)

      // Remove duplicates and sort by confidence
      const uniqueRecommendations = this.deduplicateRecommendations(recommendations)
      uniqueRecommendations.sort((a, b) => b.confidence - a.confidence)

      return uniqueRecommendations.slice(0, limit)

    } catch (error) {
      logger.error('Failed to generate recommendations', { error, userId: request.userId })
      
      // Fallback to simple recommendations
      return await this.getFallbackRecommendations(request, userProfile)
    }
  }

  /**
   * Get content-based recommendations
   */
  private async getContentBasedRecommendations(
    request: RecommendationRequest,
    userProfile: UserProfile,
    limit: number
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []

    try {
      // Create a query based on user interests
      const queryTerms = [
        ...userProfile.preferredTopics,
        ...userProfile.recentTopics,
        request.context?.currentTopic || ''
      ].filter(Boolean).join(' ')

      if (!queryTerms) {
        return []
      }

      // Search for similar content
      const similarDocs = await this.embeddingManager.similaritySearch(
        queryTerms,
        { limit: limit * 2, threshold: 0.6 }
      )

      // Convert to recommendations
      for (const doc of similarDocs) {
        if (recommendations.length >= limit) break

        const recommendation = await this.documentToRecommendation(
          doc,
          'content_similarity',
          `Matches your interests in ${userProfile.preferredTopics.slice(0, 2).join(' and ')}`
        )

        if (recommendation && !this.isAlreadyCompleted(recommendation, userProfile)) {
          recommendations.push(recommendation)
        }
      }

    } catch (error) {
      logger.error('Failed to get content-based recommendations', { error, userId: request.userId })
    }

    return recommendations
  }

  /**
   * Get collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(
    request: RecommendationRequest,
    userProfile: UserProfile,
    limit: number
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []

    try {
      // Find similar users based on course completion patterns
      const similarUsers = await this.findSimilarUsers(request.userId, userProfile)

      if (similarUsers.length === 0) {
        return []
      }

      // Get content that similar users have completed but current user hasn't
      const userCompletedIds = new Set([
        ...userProfile.completedCourses.map(c => c.id),
        ...userProfile.attemptedQuizzes.map(q => q.id)
      ])

      for (const similarUser of similarUsers.slice(0, 3)) {
        const theirCompletions = await this.getUserCompletions(similarUser.userId)
        
        for (const completion of theirCompletions) {
          if (recommendations.length >= limit) break
          if (userCompletedIds.has(completion.id)) continue

          const recommendation = await this.contentToRecommendation(
            completion,
            'collaborative_filtering',
            `Popular among learners with similar interests (${Math.round(similarUser.similarity * 100)}% similarity)`
          )

          if (recommendation) {
            recommendations.push(recommendation)
          }
        }
      }

    } catch (error) {
      logger.error('Failed to get collaborative recommendations', { error, userId: request.userId })
    }

    return recommendations
  }

  /**
   * Get knowledge gap recommendations
   */
  private async getKnowledgeGapRecommendations(
    request: RecommendationRequest,
    userProfile: UserProfile,
    limit: number
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []

    try {
      // Identify knowledge gaps from weak quiz performance
      for (const weakArea of userProfile.weakAreas.slice(0, 2)) {
        if (recommendations.length >= limit) break

        // Find content that can help with this weak area
        const helpfulContent = await this.findContentForWeakArea(weakArea, request.type)
        
        for (const content of helpfulContent) {
          if (recommendations.length >= limit) break

          const recommendation = await this.contentToRecommendation(
            content,
            'knowledge_gap',
            `Helps improve your ${weakArea.topic} skills (current score: ${Math.round(weakArea.averageScore)}%)`
          )

          if (recommendation && !this.isAlreadyCompleted(recommendation, userProfile)) {
            recommendations.push(recommendation)
          }
        }
      }

    } catch (error) {
      logger.error('Failed to get knowledge gap recommendations', { error, userId: request.userId })
    }

    return recommendations
  }

  /**
   * Enhance recommendations with AI explanations
   */
  private async enhanceWithAIExplanations(
    recommendations: Recommendation[],
    userProfile: UserProfile
  ): Promise<void> {
    try {
      const prompt = this.buildAIExplanationPrompt(recommendations, userProfile)
      
      const openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })

      const result = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })

      // Parse AI explanations and enhance recommendations
      const explanations = this.parseAIExplanations(result.choices[0]?.message?.content || '')
      
      recommendations.forEach((rec, index) => {
        if (explanations[index]) {
          rec.aiExplanation = explanations[index]
        }
      })

    } catch (error) {
      logger.error('Failed to enhance with AI explanations', { error })
    }
  }

  /**
   * Convert document to recommendation
   */
  private async documentToRecommendation(
    doc: EmbeddingDocument,
    strategy: string,
    reasoning: string
  ): Promise<Recommendation | null> {
    try {
      const metadata = doc.metadata
      
      return {
        id: metadata.id || doc.id || '',
        type: metadata.type,
        title: metadata.title,
        slug: metadata.slug,
        description: this.extractDescription(doc.content),
        category: metadata.category,
        difficulty: metadata.difficulty,
        confidence: doc.similarity || 0.8,
        reasoning,
        metadata: {
          contentType: metadata.type,
          tags: metadata.tags || [],
          prerequisites: metadata.prerequisites || [],
          learningObjectives: metadata.learningObjectives || []
        }
      }
    } catch (error) {
      logger.error('Failed to convert document to recommendation', { error })
      return null
    }
  }

  /**
   * Helper methods and utilities
   */
  
  private buildCacheKey(request: RecommendationRequest): string {
    return `rec:${request.userId}:${request.type || 'mixed'}:${request.limit || 5}:${JSON.stringify(request.context || {})}`
  }

  private deduplicateRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Set<string>()
    return recommendations.filter(rec => {
      const key = `${rec.type}:${rec.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private extractDescription(content: string): string {
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.toLowerCase().includes('description:')) {
        return line.replace(/description:\s*/i, '').trim()
      }
    }
    return content.substring(0, 150) + (content.length > 150 ? '...' : '')
  }

  private isAlreadyCompleted(recommendation: Recommendation, userProfile: UserProfile): boolean {
    if (recommendation.type === 'course') {
      return userProfile.completedCourses.some((c: any) => c.id === recommendation.id)
    } else {
      return userProfile.attemptedQuizzes.some((q: any) => q.id === recommendation.id)
    }
  }

  private getMethodologyExplanation(): string {
    return "Recommendations generated using content-based filtering, collaborative filtering, and knowledge gap analysis with AI enhancement."
  }

  private getUserProfileSummary(userProfile: UserProfile): string {
    return `Learning level: ${userProfile.level}, Preferred topics: ${userProfile.preferredTopics.join(', ')}, Activity: ${userProfile.activityLevel}`
  }

  private getRecommendationFactors(userProfile: UserProfile): string[] {
    const factors = ['Learning history', 'Topic preferences', 'Performance patterns']
    
    if (userProfile.weakAreas.length > 0) {
      factors.push('Knowledge gaps identified')
    }
    
    if (userProfile.currentStreak > 0) {
      factors.push('Learning momentum')
    }
    
    return factors
  }

  // Placeholder methods that would need implementation based on specific requirements
  private async findSimilarUsers(userId: string, userProfile: UserProfile): Promise<Array<{userId: string, similarity: number}>> {
    // Implementation would involve comparing user learning patterns
    return []
  }

  private async getUserCompletions(userId: string): Promise<Array<{id: string, type: string, title: string}>> {
    // Implementation would fetch user's completed content
    return []
  }

  private async contentToRecommendation(content: any, strategy: string, reasoning: string): Promise<Recommendation | null> {
    // Implementation would convert content to recommendation format
    return null
  }

  private async findContentForWeakArea(weakArea: any, contentType?: string): Promise<any[]> {
    // Implementation would find content to help with weak areas
    return []
  }

  private buildAIExplanationPrompt(recommendations: Recommendation[], userProfile: UserProfile): string {
    return `Explain why these recommendations are suitable for a learner with the following profile: ${JSON.stringify(userProfile, null, 2)}`
  }

  private parseAIExplanations(text: string): string[] {
    // Implementation would parse AI response into individual explanations
    return []
  }

  private async getFallbackRecommendations(request: RecommendationRequest, userProfile: UserProfile): Promise<Recommendation[]> {
    // Implementation would provide simple fallback recommendations
    return []
  }
}
