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

import OpenAI from 'openai'
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"
import { CACHE_DURATION } from "@/constants/global"

import { BaseAIService, AIServiceContext } from "../core/base-ai-service"
import { EmbeddingManager, EmbeddingDocument } from "../core/embedding-manager"
import { UserAnalyzer, UserProfile } from "./user-analyzer"
import { ContentMatcher } from "./content-matcher"

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
  signal?: AbortSignal // Add abort signal support
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

  constructor(
    embeddingManager: EmbeddingManager,
    userAnalyzer: UserAnalyzer,
    contentMatcher: ContentMatcher
  ) {
    super({
      name: 'recommendations',
      rateLimits: {
        free: { limit: 20, windowInSeconds: 3600 }, // 20 requests per hour for free users
        subscribed: { limit: 100, windowInSeconds: 3600 } // 100 requests per hour for subscribers
      },
      cacheConfig: {
        enabled: true,
        ttl: CACHE_DURATION.RECOMMENDATIONS // Use standardized cache duration
      },
      retryConfig: {
        maxRetries: 2,
        backoffMs: 1000
      }
    })

    this.embeddingManager = embeddingManager
    this.userAnalyzer = userAnalyzer
    this.contentMatcher = contentMatcher
  }

  /**
   * Initialize the recommendation service
   */
  async initialize(): Promise<void> {
    // Services are already initialized and passed through constructor
    logger.info('Recommendation Service initialized')
  }

  /**
   * Generate personalized recommendations
   */
  async process(request: RecommendationRequest, context: AIServiceContext): Promise<RecommendationResponse> {
    const startTime = Date.now()

    // Check for abort signal
    if (request.signal?.aborted) {
      throw new Error('Request was aborted')
    }

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

      // Performance monitoring
      const processingTime = Date.now() - startTime
      if (processingTime > 10000) { // Log if > 10 seconds
        logger.warn('Slow recommendation generation', {
          userId: request.userId,
          processingTime,
          recommendationCount: recommendations.length
        })
      }

      return response
    }, context)
  }

  /**
   * Generate recommendations using multiple strategies
   *
   * Combines content-based filtering, collaborative filtering, and knowledge gap analysis
   * to provide personalized recommendations. Uses weighted allocation across strategies
   * and includes fallback mechanisms for reliability.
   *
   * @param request - The recommendation request with user preferences
   * @param userProfile - Analyzed user profile with learning patterns
   * @returns Array of personalized recommendations sorted by confidence
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
   *
   * Uses OpenAI GPT to generate personalized explanations for why each recommendation
   * is suitable for the user. Handles API failures gracefully with fallback explanations.
   *
   * @param recommendations - Array of recommendations to enhance
   * @param userProfile - User profile for context in AI prompts
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

  private async findSimilarUsers(userId: string, userProfile: UserProfile): Promise<Array<{userId: string, similarity: number}>> {
    try {
      // Get current user's completed courses
      const userCompletions = await prisma.userCourseProgress.findMany({
        where: {
          userId: userId,
          completed: true
        },
        select: {
          courseId: true
        }
      })

      const userCourseIds = new Set(userCompletions.map(c => c.courseId))

      if (userCourseIds.size === 0) {
        return []
      }

      // Find other users who have completed similar courses
      const similarUsersData = await prisma.userCourseProgress.groupBy({
        by: ['userId'],
        where: {
          courseId: {
            in: Array.from(userCourseIds)
          },
          completed: true,
          userId: {
            not: userId
          }
        },
        _count: {
          courseId: true
        },
        orderBy: {
          _count: {
            courseId: 'desc'
          }
        },
        take: 10
      })

      // Calculate similarity scores
      const similarUsers = similarUsersData.map(user => ({
        userId: user.userId,
        similarity: user._count.courseId / userCourseIds.size
      })).filter(user => user.similarity > 0.3)

      return similarUsers
    } catch (error) {
      logger.error('Failed to find similar users', { error, userId })
      return []
    }
  }

  private async getUserCompletions(userId: string): Promise<Array<{id: string, type: string, title: string}>> {
    try {
      // Get completed courses
      const courses = await prisma.userCourseProgress.findMany({
        where: {
          userId: userId,
          completed: true
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        }
      })

      // Get completed quizzes
      const quizzes = await prisma.quizResult.findMany({
        where: {
          userId: userId,
          completed: true
        },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        }
      })

      const courseCompletions = courses.map(c => ({
        id: c.course.id,
        type: 'course' as const,
        title: c.course.title
      }))

      const quizCompletions = quizzes.map(q => ({
        id: q.quiz.id,
        type: 'quiz' as const,
        title: q.quiz.title
      }))

      return [...courseCompletions, ...quizCompletions]
    } catch (error) {
      logger.error('Failed to get user completions', { error, userId })
      return []
    }
  }

  private async contentToRecommendation(content: any, strategy: string, reasoning: string): Promise<Recommendation | null> {
    try {
      if (!content || !content.id) {
        return null
      }

      // Determine content type and fetch additional metadata
      let metadata: any = {}
      let title = content.title || 'Unknown Content'
      let description = content.description || ''

      if (content.type === 'course' || strategy.includes('course')) {
        const course = await prisma.course.findUnique({
          where: { id: content.id },
          select: {
            id: true,
            title: true,
            description: true,
            slug: true,
            difficulty: true,
            category: true,
            estimatedDuration: true
          }
        })

        if (course) {
          title = course.title
          description = course.description || ''
          metadata = {
            contentType: 'course',
            tags: [],
            prerequisites: [],
            learningObjectives: [],
            difficulty: course.difficulty,
            category: course.category,
            estimatedTime: course.estimatedDuration
          }
        }
      } else if (content.type === 'quiz' || strategy.includes('quiz')) {
        const quiz = await prisma.quiz.findUnique({
          where: { id: content.id },
          select: {
            id: true,
            title: true,
            description: true,
            slug: true,
            difficulty: true,
            category: true
          }
        })

        if (quiz) {
          title = quiz.title
          description = quiz.description || ''
          metadata = {
            contentType: 'quiz',
            tags: [],
            prerequisites: [],
            learningObjectives: [],
            difficulty: quiz.difficulty,
            category: quiz.category
          }
        }
      }

      return {
        id: content.id,
        type: content.type || (strategy.includes('course') ? 'course' : 'quiz'),
        title,
        slug: content.slug || '',
        description,
        category: metadata.category,
        difficulty: metadata.difficulty,
        estimatedTime: metadata.estimatedTime,
        confidence: content.confidence || 0.7,
        reasoning,
        metadata
      }
    } catch (error) {
      logger.error('Failed to convert content to recommendation', { error, contentId: content?.id })
      return null
    }
  }

  private async findContentForWeakArea(weakArea: any, contentType?: string): Promise<any[]> {
    try {
      const topic = weakArea.topic || weakArea.category || ''

      if (!topic) {
        return []
      }

      // Search for courses/quizzes related to the weak area
      let content: any[] = []

      if (!contentType || contentType === 'course') {
        const courses = await prisma.course.findMany({
          where: {
            OR: [
              { title: { contains: topic, mode: 'insensitive' } },
              { description: { contains: topic, mode: 'insensitive' } },
              { category: { contains: topic, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            title: true,
            description: true,
            slug: true,
            difficulty: true,
            category: true,
            type: 'course'
          },
          take: 3
        })
        content.push(...courses)
      }

      if (!contentType || contentType === 'quiz') {
        const quizzes = await prisma.quiz.findMany({
          where: {
            OR: [
              { title: { contains: topic, mode: 'insensitive' } },
              { description: { contains: topic, mode: 'insensitive' } },
              { category: { contains: topic, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            title: true,
            description: true,
            slug: true,
            difficulty: true,
            category: true,
            type: 'quiz'
          },
          take: 3
        })
        content.push(...quizzes)
      }

      return content
    } catch (error) {
      logger.error('Failed to find content for weak area', { error, weakArea })
      return []
    }
  }

  private buildAIExplanationPrompt(recommendations: Recommendation[], userProfile: UserProfile): string {
    return `Explain why these recommendations are suitable for a learner with the following profile: ${JSON.stringify(userProfile, null, 2)}`
  }

  private parseAIExplanations(text: string): string[] {
    try {
      if (!text || text.trim() === '') {
        return []
      }

      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed)) {
          return parsed.map(item => typeof item === 'string' ? item : item.explanation || item.reasoning || '')
        }
      } catch {
        // Not JSON, continue with text parsing
      }

      // Parse as numbered list or bullet points
      const lines = text.split('\n').filter(line => line.trim())
      const explanations: string[] = []

      for (const line of lines) {
        const trimmed = line.trim()

        // Remove numbering (1., 2., etc.) or bullets (-, *, etc.)
        const cleanLine = trimmed
          .replace(/^\d+\.\s*/, '')
          .replace(/^[-*•]\s*/, '')
          .trim()

        if (cleanLine && cleanLine.length > 10) { // Only include substantial explanations
          explanations.push(cleanLine)
        }
      }

      return explanations
    } catch (error) {
      logger.error('Failed to parse AI explanations', { error, text: text.substring(0, 100) })
      return []
    }
  }

  private async getFallbackRecommendations(request: RecommendationRequest, userProfile: UserProfile): Promise<Recommendation[]> {
    try {
      // Provide basic fallback recommendations based on popularity and recency
      const limit = request.limit || 5

      // Get popular courses
      const popularCourses = await prisma.course.findMany({
        where: {
          published: true
        },
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
          difficulty: true,
          category: true,
          estimatedDuration: true,
          _count: {
            select: {
              userProgress: {
                where: {
                  completed: true
                }
              }
            }
          }
        },
        orderBy: {
          userProgress: {
            _count: 'desc'
          }
        },
        take: Math.ceil(limit / 2)
      })

      // Get recent quizzes
      const recentQuizzes = await prisma.quiz.findMany({
        where: {
          published: true
        },
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
          difficulty: true,
          category: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: Math.ceil(limit / 2)
      })

      const recommendations: Recommendation[] = []

      // Convert courses to recommendations
      for (const course of popularCourses) {
        if (recommendations.length >= limit) break

        recommendations.push({
          id: course.id,
          type: 'course',
          title: course.title,
          slug: course.slug,
          description: course.description || '',
          category: course.category,
          difficulty: course.difficulty,
          estimatedTime: course.estimatedDuration,
          confidence: 0.6, // Lower confidence for fallback
          reasoning: 'Popular course recommended as fallback',
          metadata: {
            contentType: 'course',
            tags: [],
            prerequisites: [],
            learningObjectives: []
          }
        })
      }

      // Convert quizzes to recommendations
      for (const quiz of recentQuizzes) {
        if (recommendations.length >= limit) break

        recommendations.push({
          id: quiz.id,
          type: 'quiz',
          title: quiz.title,
          slug: quiz.slug,
          description: quiz.description || '',
          category: quiz.category,
          difficulty: quiz.difficulty,
          confidence: 0.5, // Lower confidence for fallback
          reasoning: 'Recent quiz recommended as fallback',
          metadata: {
            contentType: 'quiz',
            tags: [],
            prerequisites: [],
            learningObjectives: []
          }
        })
      }

      return recommendations
    } catch (error) {
      logger.error('Failed to get fallback recommendations', { error, userId: request.userId })

      // Ultimate fallback: return empty array
      return []
    }
  }
}
