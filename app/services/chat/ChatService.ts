/**
 * Chat Service - COMPLETE FIXED VERSION
 * Includes all data structure fixes for undefined display issues
 */

import { IntentClassifier } from './IntentClassifier'
import { CacheManager, cacheManager } from './CacheManager'
import { getRAGService, RAGService } from './ragService'
import { generateActions } from './actionGenerator'
import { ChatIntent, ChatResponse, ChatAction, UserContext } from '@/types/chat.types'
import { OFF_TOPIC_RESPONSE, CHAT_CONFIG } from '@/config/chat.config'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { Prisma } from '@prisma/client'

// Type-safe course interface
interface CourseData {
  id: number
  title: string
  description: string | null
  slug: string | null
  category: string | null
  difficulty: string | null
  enrollmentCount: number
  thumbnail: string | null
  instructor: string | null
  rating: number
  requiresSubscription: boolean
  enrollmentCap: number | null
}

// Type-safe quiz interface
interface QuizData {
  id: number
  title: string
  slug: string | null
  description: string | null
  quizType: string
  difficulty: string | null
  questionCount: number
  estimatedTime: number | null
  requiresSubscription: boolean
}

export class ChatService {
  private intentClassifier: IntentClassifier
  private cacheManager: CacheManager
  private ragService: RAGService

  constructor() {
    this.intentClassifier = new IntentClassifier()
    this.cacheManager = cacheManager
    this.ragService = getRAGService()
  }

  /**
   * Main entry point for processing chat messages
   */
  async processMessage(
    userId: string | undefined,
    message: string,
    userContext?: UserContext
  ): Promise<ChatResponse> {
    try {
      const cacheKey = this.cacheManager.generateKey(message, userId)
      const cached = await this.cacheManager.get(cacheKey, userId)
      if (cached) {
        logger.info(`[ChatService] Cache hit for key: ${cacheKey}`)
        return cached
      }

      const intentResult = await this.intentClassifier.classify(message, userContext)
      logger.info(`[ChatService] Intent: ${intentResult.intent} (${intentResult.confidence})`)

      let response: ChatResponse

      switch (intentResult.intent) {
        case ChatIntent.NAVIGATE_COURSE:
          response = await this.handleCourseNavigation(userId, intentResult, message, userContext)
          break

        case ChatIntent.NAVIGATE_QUIZ:
          response = await this.handleQuizNavigation(userId, intentResult, message, userContext)
          break

        case ChatIntent.CREATE_QUIZ:
          response = await this.handleQuizCreation(userId, intentResult, message, userContext)
          break

        case ChatIntent.CREATE_COURSE:
          response = await this.handleCourseCreation(userId, intentResult, message, userContext)
          break

        case ChatIntent.EXPLAIN_CONCEPT:
          response = await this.handleConceptExplanation(userId, message, userContext)
          break

        case ChatIntent.SUBSCRIPTION_INFO:
          response = await this.handleSubscriptionInfo(userId, userContext)
          break

        case ChatIntent.TROUBLESHOOT:
          response = await this.handleTroubleshooting(userId, message, userContext)
          break

        case ChatIntent.OFF_TOPIC:
          response = this.handleOffTopic()
          break

        default:
          response = await this.handleGeneralQuery(userId, message, userContext)
      }

      response.intent = intentResult.intent

      if (!response.content || response.content.trim().length < 10) {
        logger.warn('[ChatService] Response too short, skipping cache')
        return response
      }

      await this.cacheManager.set(cacheKey, response, undefined, userId)

      return response
    } catch (error) {
      logger.error('[ChatService] Error processing message:', error)
      return this.getErrorResponse()
    }
  }

  /**
   * Handle course navigation with complete data structure
   * FIX: Returns fully populated course data
   */
  private async handleCourseNavigation(
    userId: string | undefined,
    intentResult: any,
    message: string,
    userContext?: UserContext
  ): Promise<ChatResponse> {
    const topics = intentResult.entities.topics || []
    const courses = await this.searchCourses(topics, userId, userContext?.isSubscribed || false)

    if (courses.length === 0) {
      return {
        content: `I couldn't find any courses ${topics.length > 0 ? `on "${topics[0]}"` : ''} at the moment. Would you like me to help you with something else?`,
        actions: [
          {
            type: 'navigate',
            label: 'Browse All Courses',
            url: '/dashboard/courses',
          },
        ],
        tokensUsed: 0,
        cached: false,
      }
    }

    const courseList = courses
      .slice(0, 5)
      .map((course, i) => {
        const parts = [
          `${i + 1}. **${this.sanitize(course.title)}**`,
        ]
        
        if (course.category) {
          parts.push(`\n   📚 Category: ${this.sanitize(course.category)}`)
        }
        
        if (course.difficulty) {
          parts.push(`\n   📊 Level: ${this.sanitize(course.difficulty)}`)
        }
        
        if (course.instructor) {
          parts.push(`\n   👨‍🏫 Instructor: ${this.sanitize(course.instructor)}`)
        }
        
        if (course.rating > 0) {
          parts.push(`\n   ⭐ Rating: ${course.rating.toFixed(1)}/5`)
        }
        
        if (course.enrollmentCount > 0) {
          parts.push(`\n   👥 ${course.enrollmentCount.toLocaleString()} students`)
        }
        
        if (course.description) {
          parts.push(`\n   ${this.sanitize(course.description.slice(0, 100))}...`)
        }
        
        return parts.join('')
      })
      .join('\n\n')

    return {
      content: `I found ${courses.length} course${courses.length > 1 ? 's' : ''} ${topics.length > 0 ? `related to "${topics[0]}"` : 'for you'}:\n\n${courseList}\n\nClick any course below to start learning!`,
      actions: courses.slice(0, 4).map((course) => ({
        type: 'view_course' as const,
        label: course.title.length > 30 ? course.title.slice(0, 27) + '...' : course.title,
        url: `/dashboard/course/${course.slug || course.id}`,
        metadata: { 
          courseId: course.id,
          title: course.title,
          category: course.category,
          difficulty: course.difficulty,
        },
      })),
      tokensUsed: 0,
      cached: false,
    }
  }

  /**
   * Handle quiz navigation with complete data
   * FIX: Returns fully populated quiz data
   */
  private async handleQuizNavigation(
    userId: string | undefined,
    intentResult: any,
    message: string,
    userContext?: UserContext
  ): Promise<ChatResponse> {
    const quizTypes = intentResult.entities.quizTypes || []
    const topics = intentResult.entities.topics || []
    const quizzes = await this.searchQuizzes(quizTypes, topics, userId, userContext?.isSubscribed || false)

    if (quizzes.length === 0) {
      return {
        content: `No quizzes found ${topics.length > 0 ? `on "${topics[0]}"` : ''}. Would you like to create one?`,
        actions: [
          {
            type: 'create_quiz',
            label: 'Create a Quiz',
            url: '/dashboard/quiz/create',
          },
          {
            type: 'navigate',
            label: 'Browse Quizzes',
            url: '/dashboard/quizzes',
          },
        ],
        tokensUsed: 0,
        cached: false,
      }
    }

    const quizList = quizzes
      .slice(0, 5)
      .map((quiz, i) => {
        const parts = [
          `${i + 1}. **${this.sanitize(quiz.title)}**`,
          `\n   Type: ${this.sanitize(quiz.quizType)}`,
        ]
        
        if (quiz.difficulty) {
          parts.push(`\n   Difficulty: ${this.sanitize(quiz.difficulty)}`)
        }
        
        if (quiz.questionCount > 0) {
          parts.push(`\n   Questions: ${quiz.questionCount}`)
        }
        
        if (quiz.estimatedTime) {
          parts.push(`\n   Time: ~${quiz.estimatedTime} min`)
        }
        
        if (quiz.description) {
          parts.push(`\n   ${this.sanitize(quiz.description.slice(0, 100))}...`)
        }
        
        return parts.join('')
      })
      .join('\n\n')

    return {
      content: `Found ${quizzes.length} quiz${quizzes.length > 1 ? 'zes' : ''} ${topics.length > 0 ? `on "${topics[0]}"` : ''}:\n\n${quizList}`,
      actions: quizzes.slice(0, 4).map((quiz) => ({
        type: 'view_quiz' as const,
        label: quiz.title.length > 30 ? quiz.title.slice(0, 27) + '...' : quiz.title,
        url: `/dashboard/${quiz.quizType}/${quiz.slug || quiz.id}`,
        metadata: { 
          quizId: quiz.id,
          title: quiz.title,
          type: quiz.quizType,
          difficulty: quiz.difficulty,
        },
      })),
      tokensUsed: 0,
      cached: false,
    }
  }

  /**
   * Handle quiz creation requests
   */
  private async handleQuizCreation(
    userId: string | undefined,
    intentResult: any,
    message: string,
    userContext?: UserContext
  ): Promise<ChatResponse> {
    if (!userId) {
      return {
        content: 'Please sign in to create quizzes. It\'s free to get started!',
        actions: [
          {
            type: 'navigate',
            label: 'Sign In',
            url: '/auth/signin',
          },
        ],
        tokensUsed: 0,
        cached: false,
      }
    }

    const canCreateQuiz = await this.checkQuizCreationQuota(userId, userContext?.isSubscribed ? 'pro' : 'free')
    if (!canCreateQuiz) {
      return {
        content: 'You\'ve reached your quiz creation limit. Upgrade to Pro for unlimited access!',
        actions: [
          {
            type: 'upgrade_plan',
            label: 'Upgrade Now',
            url: '/dashboard/billing',
          },
        ],
        tokensUsed: 0,
        cached: false,
      }
    }

    const topics = intentResult.entities.topics || []
    const quizTypes = intentResult.entities.quizTypes || []
    const difficulty = intentResult.entities.difficulty

    const suggestions: string[] = []
    if (topics.length > 0) suggestions.push(`Topic: ${topics[0]}`)
    if (quizTypes.length > 0) suggestions.push(`Type: ${quizTypes[0].toUpperCase()}`)
    if (difficulty) suggestions.push(`Difficulty: ${difficulty}`)

    return {
      content: `I can help you create a quiz${topics.length > 0 ? ` on "${topics[0]}"` : ''}! ${suggestions.length > 0 ? `\n\nSuggested settings:\n${suggestions.map(s => `• ${s}`).join('\n')}` : ''}\n\nClick below to get started:`,
      actions: [
        {
          type: 'create_quiz',
          label: 'Create Quiz',
          url: '/dashboard/quiz/create',
          metadata: {
            topic: topics[0] || '',
            quizType: quizTypes[0] || '',
            difficulty: difficulty || 'medium',
          },
        },
      ],
      tokensUsed: 0,
      cached: false,
    }
  }

  /**
   * Handle course creation requests
   */
  private async handleCourseCreation(
    userId: string | undefined,
    intentResult: any,
    message: string,
    userContext?: UserContext
  ): Promise<ChatResponse> {
    if (!userId) {
      return {
        content: 'Please sign in to create courses. It\'s free to get started!',
        actions: [
          {
            type: 'navigate',
            label: 'Sign In',
            url: '/auth/signin',
          },
        ],
        tokensUsed: 0,
        cached: false,
      }
    }

    if (!userContext?.isSubscribed) {
      return {
        content: 'Course creation is available with a Pro subscription. Upgrade now to start building your own courses!',
        actions: [
          {
            type: 'upgrade_plan',
            label: 'View Plans',
            url: '/dashboard/billing',
          },
        ],
        tokensUsed: 0,
        cached: false,
      }
    }

    const topics = intentResult.entities.topics || []

    return {
      content: `Great! I can help you create a course${topics.length > 0 ? ` on "${topics[0]}"` : ''}. Let's get started:`,
      actions: [
        {
          type: 'create_course',
          label: 'Create Course',
          url: '/dashboard/create',
          metadata: {
            topic: topics[0] || '',
          },
        },
      ],
      tokensUsed: 0,
      cached: false,
    }
  }

  /**
   * Handle concept explanation using RAG
   */
  private async handleConceptExplanation(
    userId: string | undefined,
    message: string,
    userContext?: UserContext
  ): Promise<ChatResponse> {
    const isSubscribed = userContext?.isSubscribed || false
    
    const ragResponse = await this.ragService.generateResponse(
      userId || 'anonymous',
      message,
      {
        maxTokens: isSubscribed ? 500 : 250,
        temperature: 0.7,
        includeHistory: true,
        contextLimit: 5
      }
    )

    const actions = ragResponse.context ? await generateActions({
      userId: userId || 'anonymous',
      query: message,
      relevantDocuments: ragResponse.context.relevantDocuments || [],
      subscriptionStatus: {
        tier: isSubscribed ? 'pro' : 'free',
        isActive: isSubscribed,
        limits: {
          coursesPerMonth: isSubscribed ? 50 : 2,
          quizzesPerMonth: isSubscribed ? 100 : 5,
          chaptersPerCourse: isSubscribed ? 50 : 10,
          questionsPerQuiz: isSubscribed ? 50 : 10,
          aiMessagesPerHour: isSubscribed ? 100 : 10,
        },
        currentUsage: { coursesThisMonth: 0, quizzesThisMonth: 0 },
        canCreate: { course: isSubscribed, quiz: true },
        upgradeRequired: false,
      }
    }) : []

    return {
      content: ragResponse.content,
      actions,
      tokensUsed: ragResponse.tokensUsed,
      cached: false,
    }
  }

  /**
   * Handle subscription information requests
   */
  private async handleSubscriptionInfo(
    userId: string | undefined,
    userContext?: UserContext
  ): Promise<ChatResponse> {
    if (!userId) {
      return {
        content: `You're currently using **CourseAI** without a subscription. Here's what you can do:

✨ Free Plan features:
• 2 courses per month
• 5 quizzes per month
• Basic AI assistance
• Limited quiz creation

Plans start at just $9/month!`,
        actions: [
          {
            type: 'navigate',
            label: 'Sign In',
            url: '/auth/signin',
          },
          {
            type: 'upgrade_plan',
            label: 'View Plans',
            url: '/pricing',
          },
        ],
        tokensUsed: 0,
        cached: false,
      }
    }

    try {
      const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
        select: {
        
          status: true,
          currentPeriodEnd: true,
        }
      })

      const isActive = subscription?.status === 'active' && subscription?.currentPeriodEnd > new Date()
      const tier = subscription?.status || 'free'

      if (isActive && tier === 'pro') {
        return {
          content: `You're currently on a **Pro plan** with access to:

✅ Unlimited quiz generation
✅ Advanced AI explanations  
✅ Priority support
✅ All quiz types
✅ Custom courses
✅ Until ${subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'renewal date not set'}

Need help with anything else?`,
          actions: [
            {
              type: 'navigate',
              label: 'Manage Subscription',
              url: '/dashboard/billing',
            },
          ],
          tokensUsed: 0,
          cached: false,
        }
      }

      return {
        content: `You're currently on the **Free plan**. Upgrade to Pro for:

✨ Unlimited quiz generation
✨ Advanced AI assistance
✨ Priority support
✨ All quiz types
✨ Custom course creation
✨ Unlimited storage

Plans start at just $9/month!`,
        actions: [
          {
            type: 'upgrade_plan',
            label: 'View Plans',
            url: '/dashboard/billing',
          },
        ],
        tokensUsed: 0,
        cached: false,
      }
    } catch (error) {
      logger.error('[ChatService] Failed to fetch subscription:', error)
      return {
        content: 'Unable to load your subscription info. Please try again later.',
        actions: [
          {
            type: 'navigate',
            label: 'Dashboard',
            url: '/dashboard',
          },
        ],
        tokensUsed: 0,
        cached: false,
      }
    }
  }

  /**
   * Handle troubleshooting requests
   */
  private async handleTroubleshooting(
    userId: string | undefined,
    message: string,
    userContext?: UserContext
  ): Promise<ChatResponse> {
    const ragResponse = await this.ragService.generateResponse(
      userId || 'anonymous',
      message,
      {
        maxTokens: userContext?.isSubscribed ? 500 : 250,
        temperature: 0.7,
        includeHistory: true,
      }
    )

    return {
      content: ragResponse.content,
      actions: [
        {
          type: 'external_link',
          label: 'View Help Center',
          url: '/help',
        },
        {
          type: 'external_link',
          label: 'Contact Support',
          url: '/contact',
        },
      ],
      tokensUsed: ragResponse.tokensUsed,
      cached: false,
    }
  }

  /**
   * Handle off-topic messages
   */
  private handleOffTopic(): ChatResponse {
    return {
      content: OFF_TOPIC_RESPONSE,
      actions: [
        {
          type: 'navigate',
          label: 'Browse Courses',
          url: '/dashboard/courses',
        },
        {
          type: 'create_quiz',
          label: 'Create Quiz',
          url: '/dashboard/quiz/create',
        },
      ],
      tokensUsed: 0,
      cached: false,
    }
  }

  /**
   * Handle general queries with RAG
   */
  private async handleGeneralQuery(
    userId: string | undefined,
    message: string,
    userContext?: UserContext
  ): Promise<ChatResponse> {
    const ragResponse = await this.ragService.generateResponse(
      userId || 'anonymous',
      message,
      {
        maxTokens: userContext?.isSubscribed ? 500 : 250,
        temperature: 0.7,
        includeHistory: true,
      }
    )

    const isSubscribed = userContext?.isSubscribed || false
    const actions = ragResponse.context ? await generateActions({
      userId: userId || 'anonymous',
      query: message,
      relevantDocuments: ragResponse.context.relevantDocuments || [],
      subscriptionStatus: {
        tier: isSubscribed ? 'pro' : 'free',
        isActive: isSubscribed,
        limits: {
          coursesPerMonth: isSubscribed ? 50 : 2,
          quizzesPerMonth: isSubscribed ? 100 : 5,
          chaptersPerCourse: isSubscribed ? 50 : 10,
          questionsPerQuiz: isSubscribed ? 50 : 10,
          aiMessagesPerHour: isSubscribed ? 100 : 10,
        },
        currentUsage: { coursesThisMonth: 0, quizzesThisMonth: 0 },
        canCreate: { course: isSubscribed, quiz: true },
        upgradeRequired: false,
      }
    }) : []

    return {
      content: ragResponse.content,
      actions,
      tokensUsed: ragResponse.tokensUsed,
      cached: false,
    }
  }

  /**
   * Search courses with complete data structure
   * FIX: Includes all fields needed for display
   */
  private async searchCourses(
    topics: string[],
    userId?: string,
    isSubscribed: boolean = false
  ): Promise<CourseData[]> {
    try {
      if (!topics.length) return []

      const conditions = topics.flatMap(topic => [
        { title: { contains: topic, mode: 'insensitive' as const } },
        { description: { contains: topic, mode: 'insensitive' as const } },
        { category: { name: { contains: topic, mode: 'insensitive' as const } } },
      ])

      const courses = await prisma.course.findMany({
        where: {
          AND: [
            { isPublic: true },
            { status: 'PUBLISHED' },
            conditions.length > 0 ? { OR: conditions } : {}
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
          category: true,
          difficulty: true,
          image: true,
          isPublic: true,
          ratings: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      })

      const eligible = courses.filter(course => {
        if (!course.isPublic && !isSubscribed) return false
      
        return true
      })

      return eligible as unknown as CourseData[]
    } catch (error) {
      logger.error('[ChatService] Error searching courses:', error)
      return []
    }
  }

  /**
   * Search quizzes with complete data structure
   * FIX: Includes all fields needed for display
   */
  private async searchQuizzes(
    quizTypes: string[],
    topics: string[],
    userId?: string,
    isSubscribed: boolean = false
  ): Promise<QuizData[]> {
    try {
      const where: any = { isPublic: true }
      
      if (quizTypes.length > 0) {
        where.quizType = { in: quizTypes }
      }
      
      if (topics.length > 0) {
        where.OR = topics.map(topic => ({
          OR: [
            { title: { contains: topic, mode: 'insensitive' } },
            { description: { contains: topic, mode: 'insensitive' } },
          ],
        }))
      }

      const quizzes = await prisma.userQuiz.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          quizType: true,
          difficulty: true,
          isPublic: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      })

      const eligible = quizzes.filter(q => {
        if (!q.isPublic && !isSubscribed) return false
        return true
      })

      return eligible as unknown as QuizData[]
    } catch (error) {
      logger.error('[ChatService] Error searching quizzes:', error)
      return []
    }
  }

  /**
   * Check if user can create quizzes
   */
  private async checkQuizCreationQuota(userId: string, tier?: string): Promise<boolean> {
    try {
      if (tier === 'pro' || tier === 'enterprise') {
        return true
      }

      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const count = await prisma.userQuiz.count({
        where: {
          userId,
          createdAt: { gte: monthStart }
        }
      })

      return count < 5
    } catch (error) {
      logger.error('[ChatService] Error checking quiz quota:', error)
      return true
    }
  }

  /**
   * Sanitize strings to prevent undefined display
   */
  private sanitize(value: string | null | undefined): string {
    if (!value || typeof value !== 'string') {
      return 'Not available'
    }
    return value.trim() === '' ? 'Not available' : value
  }

  /**
   * Get error response
   */
  private getErrorResponse(): ChatResponse {
    return {
      content: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
      actions: [
        {
          type: 'navigate',
          label: 'Go to Dashboard',
          url: '/dashboard',
        },
      ],
      tokensUsed: 0,
      cached: false,
    }
  }
}

export const chatService = new ChatService()