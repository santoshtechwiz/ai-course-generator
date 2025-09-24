/**
 * Content Matcher
 * 
 * Matches users with content based on various algorithms and strategies
 */

import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import { EmbeddingManager } from "../core/embedding-manager"
import { UserProfile } from "./user-analyzer"

export interface ContentItem {
  id: string
  title: string
  description?: string
  category?: string
  tags: string[]
  type: 'course' | 'quiz' | 'tutorial' | 'article'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration?: number // in minutes
  rating?: number
  enrollmentCount?: number
  prerequisites?: string[]
  topics: string[]
  content?: string // Full content for embedding
}

export interface MatchScore {
  contentId: string
  score: number
  reasons: string[]
  matchType: 'similarity' | 'collaborative' | 'knowledge_gap' | 'trending' | 'personalized'
}

export interface MatchingOptions {
  maxResults?: number
  minScore?: number
  includeTypes?: Array<'course' | 'quiz' | 'tutorial' | 'article'>
  excludeCompleted?: boolean
  difficulty?: Array<'beginner' | 'intermediate' | 'advanced'>
  topics?: string[]
}

export class ContentMatcher {
  private embeddingManager: EmbeddingManager
  private contentCache: Map<string, ContentItem[]> = new Map()
  private readonly CACHE_TTL = 60 * 60 * 1000 // 1 hour

  constructor(embeddingManager: EmbeddingManager) {
    this.embeddingManager = embeddingManager
  }

  async initialize(): Promise<void> {
    logger.info('Content Matcher initialized')
  }

  /**
   * Find content matches using multiple strategies
   */
  async findMatches(
    userProfile: UserProfile,
    options: MatchingOptions = {}
  ): Promise<MatchScore[]> {
    const {
      maxResults = 20,
      minScore = 0.3,
      includeTypes,
      excludeCompleted = true,
      difficulty,
      topics
    } = options

    try {
      // Get available content
      const content = await this.getAvailableContent(userProfile, {
        includeTypes,
        excludeCompleted,
        difficulty,
        topics
      })

      if (content.length === 0) {
        return []
      }

      // Apply different matching strategies
      const [
        similarityMatches,
        collaborativeMatches,
        knowledgeGapMatches,
        trendingMatches
      ] = await Promise.all([
        this.findSimilarityMatches(userProfile, content),
        this.findCollaborativeMatches(userProfile, content),
        this.findKnowledgeGapMatches(userProfile, content),
        this.findTrendingMatches(userProfile, content)
      ])

      // Combine and score all matches
      const allMatches = new Map<string, MatchScore>()

      // Add similarity matches
      similarityMatches.forEach(match => {
        allMatches.set(match.contentId, match)
      })

      // Merge collaborative matches
      collaborativeMatches.forEach(match => {
        const existing = allMatches.get(match.contentId)
        if (existing) {
          existing.score = Math.max(existing.score, match.score * 0.8)
          existing.reasons.push(...match.reasons)
          existing.matchType = 'personalized'
        } else {
          allMatches.set(match.contentId, { ...match, score: match.score * 0.8 })
        }
      })

      // Merge knowledge gap matches
      knowledgeGapMatches.forEach(match => {
        const existing = allMatches.get(match.contentId)
        if (existing) {
          existing.score = Math.max(existing.score, match.score * 0.9)
          existing.reasons.push(...match.reasons)
          existing.matchType = 'personalized'
        } else {
          allMatches.set(match.contentId, { ...match, score: match.score * 0.9 })
        }
      })

      // Merge trending matches
      trendingMatches.forEach(match => {
        const existing = allMatches.get(match.contentId)
        if (existing) {
          existing.score += match.score * 0.3 // Boost trending content
          existing.reasons.push(...match.reasons)
        } else {
          allMatches.set(match.contentId, { ...match, score: match.score * 0.5 })
        }
      })

      // Filter, sort, and return results
      return Array.from(allMatches.values())
        .filter(match => match.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(match => ({
          ...match,
          reasons: [...new Set(match.reasons)] // Remove duplicate reasons
        }))

    } catch (error) {
      logger.error('Failed to find content matches', { error, userId: userProfile.userId })
      return []
    }
  }

  /**
   * Find matches based on content similarity using embeddings
   */
  private async findSimilarityMatches(
    userProfile: UserProfile,
    content: ContentItem[]
  ): Promise<MatchScore[]> {
    try {
      // Create user preference vector from profile
      const userVector = await this.createUserVector(userProfile)
      if (!userVector) return []

      const matches: MatchScore[] = []

      for (const item of content) {
        // Get or create content embedding
        let contentEmbedding = await this.embeddingManager.getEmbedding(
          `content:${item.id}`,
          'content'
        )

        if (!contentEmbedding) {
          const contentText = this.createContentText(item)
          contentEmbedding = await this.embeddingManager.storeEmbedding(
            `content:${item.id}`,
            contentText,
            'content',
            { contentId: item.id, type: item.type }
          )
        }

        if (contentEmbedding) {
          // Calculate similarity
          const similarity = await this.embeddingManager.findSimilar(
            userVector,
            'content',
            { limit: 1, threshold: 0.0 }
          )

          const score = similarity.find(s => s.metadata?.contentId === item.id)?.similarity || 0

          if (score > 0) {
            matches.push({
              contentId: item.id,
              score,
              reasons: [`${Math.round(score * 100)}% content similarity`],
              matchType: 'similarity'
            })
          }
        }
      }

      return matches.sort((a, b) => b.score - a.score)
    } catch (error) {
      logger.error('Failed to find similarity matches', { error })
      return []
    }
  }

  /**
   * Find matches based on collaborative filtering
   */
  private async findCollaborativeMatches(
    userProfile: UserProfile,
    content: ContentItem[]
  ): Promise<MatchScore[]> {
    try {
      // Find similar users based on completed courses and quiz performance
      const similarUsers = await this.findSimilarUsers(userProfile)
      
      if (similarUsers.length === 0) return []

      const recommendations = new Map<string, { score: number; reasons: string[] }>()

      // Aggregate content from similar users
      for (const similarUser of similarUsers) {
        const userCourses = await this.getUserCompletedContent(similarUser.userId)
        
        for (const course of userCourses) {
          const contentItem = content.find(c => c.id === course.courseId)
          if (contentItem) {
            const existing = recommendations.get(contentItem.id)
            const score = similarUser.similarity * 0.8
            
            if (existing) {
              existing.score = Math.max(existing.score, score)
              existing.reasons.push(`Users with similar interests completed this`)
            } else {
              recommendations.set(contentItem.id, {
                score,
                reasons: [`Recommended by similar learners`]
              })
            }
          }
        }
      }

      return Array.from(recommendations.entries()).map(([contentId, data]) => ({
        contentId,
        score: data.score,
        reasons: data.reasons,
        matchType: 'collaborative' as const
      }))
    } catch (error) {
      logger.error('Failed to find collaborative matches', { error })
      return []
    }
  }

  /**
   * Find matches to fill knowledge gaps
   */
  private async findKnowledgeGapMatches(
    userProfile: UserProfile,
    content: ContentItem[]
  ): Promise<MatchScore[]> {
    const matches: MatchScore[] = []

    // Target weak areas
    for (const weakArea of userProfile.weakAreas) {
      const relevantContent = content.filter(item => 
        item.topics.some(topic => 
          topic.toLowerCase().includes(weakArea.topic.toLowerCase())
        ) || 
        item.category?.toLowerCase().includes(weakArea.topic.toLowerCase())
      )

      for (const item of relevantContent) {
        // Score based on how well it addresses the weak area
        const topicMatch = item.topics.filter(topic => 
          topic.toLowerCase().includes(weakArea.topic.toLowerCase())
        ).length / item.topics.length

        const difficultyMatch = this.getDifficultyMatch(item.difficulty, userProfile.level)
        
        const score = (topicMatch * 0.7 + difficultyMatch * 0.3) * (1 - weakArea.averageScore / 100)

        if (score > 0.3) {
          matches.push({
            contentId: item.id,
            score,
            reasons: [`Addresses weak area: ${weakArea.topic} (${weakArea.averageScore}% avg)`],
            matchType: 'knowledge_gap'
          })
        }
      }
    }

    // Look for next-level content
    const nextLevelContent = content.filter(item => {
      if (userProfile.level === 'beginner') return item.difficulty === 'intermediate'
      if (userProfile.level === 'intermediate') return item.difficulty === 'advanced'
      return false
    })

    for (const item of nextLevelContent) {
      const topicRelevance = item.topics.filter(topic => 
        userProfile.preferredTopics.some(pref => 
          pref.toLowerCase().includes(topic.toLowerCase())
        )
      ).length / Math.max(item.topics.length, 1)

      if (topicRelevance > 0.3) {
        matches.push({
          contentId: item.id,
          score: topicRelevance * 0.8,
          reasons: [`Next level content in your preferred topics`],
          matchType: 'knowledge_gap'
        })
      }
    }

    return matches.sort((a, b) => b.score - a.score)
  }

  /**
   * Find trending/popular content
   */
  private async findTrendingMatches(
    userProfile: UserProfile,
    content: ContentItem[]
  ): Promise<MatchScore[]> {
    try {
      // Get recent enrollment/completion stats
      const recentStats = await this.getRecentContentStats()
      
      return content
        .filter(item => recentStats.has(item.id))
        .map(item => {
          const stats = recentStats.get(item.id)!
          const topicRelevance = item.topics.filter(topic => 
            userProfile.preferredTopics.some(pref => 
              pref.toLowerCase().includes(topic.toLowerCase())
            )
          ).length / Math.max(item.topics.length, 1)

          const popularityScore = Math.min(stats.recentEnrollments / 100, 1)
          const score = (popularityScore * 0.6 + topicRelevance * 0.4) * 0.7

          return {
            contentId: item.id,
            score,
            reasons: [`Trending: ${stats.recentEnrollments} recent enrollments`],
            matchType: 'trending' as const
          }
        })
        .filter(match => match.score > 0.2)
        .sort((a, b) => b.score - a.score)
    } catch (error) {
      logger.error('Failed to find trending matches', { error })
      return []
    }
  }

  /**
   * Get available content based on filters
   */
  private async getAvailableContent(
    userProfile: UserProfile,
    options: Pick<MatchingOptions, 'includeTypes' | 'excludeCompleted' | 'difficulty' | 'topics'>
  ): Promise<ContentItem[]> {
    const cacheKey = JSON.stringify({ userProfile: userProfile.userId, options })
    
    // Check cache
    const cached = this.contentCache.get(cacheKey)
    if (cached) return cached

    try {
      // Get courses
      const courses = await prisma.course.findMany({
        where: {
          isPublished: true,
          ...(options.difficulty && { difficulty: { in: options.difficulty } }),
          ...(options.topics && {
            OR: [
              { category: { name: { in: options.topics } } },
              { tags: { hasSome: options.topics } }
            ]
          })
        },
        include: {
          category: true,
          chapters: { select: { title: true, content: true } }
        }
      })

      // Get quizzes
      const quizzes = await prisma.userQuiz.findMany({
        where: {
          isPublished: true,
          ...(options.topics && {
            OR: [
              { category: { in: options.topics } },
              { tags: { hasSome: options.topics } }
            ]
          })
        }
      })

      // Convert to ContentItem format
      let content: ContentItem[] = []

      // Add courses
      if (!options.includeTypes || options.includeTypes.includes('course')) {
        content.push(...courses.map(course => ({
          id: String(course.id),
          title: course.title,
          description: course.description || undefined,
          category: course.category?.name,
          tags: course.tags || [],
          type: 'course' as const,
          difficulty: (course.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
          duration: course.estimatedDuration,
          rating: course.averageRating || undefined,
          enrollmentCount: course.enrollmentCount || undefined,
          topics: [course.category?.name, ...(course.tags || [])].filter(Boolean) as string[],
          content: course.chapters?.map(ch => `${ch.title} ${ch.content || ''}`).join(' ')
        })))
      }

      // Add quizzes
      if (!options.includeTypes || options.includeTypes.includes('quiz')) {
        content.push(...quizzes.map(quiz => ({
          id: String(quiz.id),
          title: quiz.title,
          description: quiz.description || undefined,
          category: Array.isArray(quiz.category) ? quiz.category[0] : quiz.category || undefined,
          tags: quiz.tags || [],
          type: 'quiz' as const,
          difficulty: 'intermediate' as const, // Default for quizzes
          duration: quiz.timeLimit || undefined,
          topics: [
            ...(Array.isArray(quiz.category) ? quiz.category : quiz.category ? [quiz.category] : []),
            ...(quiz.tags || [])
          ].filter(Boolean) as string[]
        })))
      }

      // Filter out completed content if requested
      if (options.excludeCompleted) {
        const completedIds = new Set([
          ...userProfile.completedCourses.map(c => c.id),
          ...userProfile.attemptedQuizzes.map(q => q.id)
        ])
        content = content.filter(item => !completedIds.has(item.id))
      }

      // Cache the results
      this.contentCache.set(cacheKey, content)
      setTimeout(() => this.contentCache.delete(cacheKey), this.CACHE_TTL)

      return content
    } catch (error) {
      logger.error('Failed to get available content', { error })
      return []
    }
  }

  /**
   * Create user preference vector from profile
   */
  private async createUserVector(userProfile: UserProfile): Promise<number[] | null> {
    try {
      const userText = [
        `User interests: ${userProfile.preferredTopics.join(', ')}`,
        `Recent topics: ${userProfile.recentTopics.join(', ')}`,
        `Skill level: ${userProfile.level}`,
        `Strong areas: ${userProfile.strongAreas.map(a => a.topic).join(', ')}`,
        `Completed courses: ${userProfile.completedCourses.map(c => c.title).slice(0, 5).join(', ')}`
      ].join('. ')

      const userEmbedding = await this.embeddingManager.storeEmbedding(
        `user:${userProfile.userId}`,
        userText,
        'user_preference',
        { userId: userProfile.userId, level: userProfile.level }
      )

      return userEmbedding?.embedding || null
    } catch (error) {
      logger.error('Failed to create user vector', { error })
      return null
    }
  }

  /**
   * Create content text for embedding
   */
  private createContentText(item: ContentItem): string {
    return [
      item.title,
      item.description || '',
      `Category: ${item.category || 'General'}`,
      `Type: ${item.type}`,
      `Difficulty: ${item.difficulty}`,
      `Topics: ${item.topics.join(', ')}`,
      `Tags: ${item.tags.join(', ')}`,
      item.content || ''
    ].filter(Boolean).join('. ')
  }

  /**
   * Find users with similar learning patterns
   */
  private async findSimilarUsers(userProfile: UserProfile): Promise<Array<{ userId: string; similarity: number }>> {
    try {
      // This is a simplified version - in practice, you'd use more sophisticated similarity metrics
      const otherUsers = await prisma.courseProgress.findMany({
        where: {
          userId: { not: userProfile.userId },
          isCompleted: true
        },
        select: { userId: true, courseId: true },
        distinct: ['userId']
      })

      const userCourses = new Set(userProfile.completedCourses.map(c => c.id))
      const similarities = new Map<string, number>()

      for (const progress of otherUsers) {
        const otherUserId = progress.userId
        if (!similarities.has(otherUserId)) {
          similarities.set(otherUserId, 0)
        }

        if (userCourses.has(String(progress.courseId))) {
          similarities.set(otherUserId, similarities.get(otherUserId)! + 1)
        }
      }

      // Convert to similarity scores
      const maxCourses = Math.max(userProfile.completedCourses.length, 1)
      
      return Array.from(similarities.entries())
        .map(([userId, commonCourses]) => ({
          userId,
          similarity: commonCourses / maxCourses
        }))
        .filter(user => user.similarity > 0.2)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10)
    } catch (error) {
      logger.error('Failed to find similar users', { error })
      return []
    }
  }

  /**
   * Get completed content for a user
   */
  private async getUserCompletedContent(userId: string) {
    return await prisma.courseProgress.findMany({
      where: { userId, isCompleted: true },
      select: { courseId: true }
    })
  }

  /**
   * Get recent content statistics
   */
  private async getRecentContentStats(): Promise<Map<string, { recentEnrollments: number }>> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      const recentEnrollments = await prisma.courseProgress.groupBy({
        by: ['courseId'],
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: { userId: true }
      })

      const stats = new Map<string, { recentEnrollments: number }>()
      
      recentEnrollments.forEach(stat => {
        stats.set(String(stat.courseId), {
          recentEnrollments: stat._count.userId
        })
      })

      return stats
    } catch (error) {
      logger.error('Failed to get recent content stats', { error })
      return new Map()
    }
  }

  /**
   * Calculate difficulty match score
   */
  private getDifficultyMatch(contentDifficulty: string, userLevel: string): number {
    const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3 }
    const contentLevel = difficultyMap[contentDifficulty as keyof typeof difficultyMap] || 2
    const userLevelNum = difficultyMap[userLevel as keyof typeof difficultyMap] || 1

    // Perfect match gets 1.0, one level off gets 0.7, two levels off gets 0.3
    const difference = Math.abs(contentLevel - userLevelNum)
    if (difference === 0) return 1.0
    if (difference === 1) return 0.7
    return 0.3
  }

  /**
   * Clear content cache
   */
  clearCache(): void {
    this.contentCache.clear()
  }
}
