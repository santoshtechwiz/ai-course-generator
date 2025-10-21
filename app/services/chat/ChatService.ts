/**
 * Chat Service
 * Main orchestrator for chat functionality with intent-based routing
 */

import { IntentClassifier } from './IntentClassifier'
import { CacheManager } from './CacheManager'
import { RAGService } from '../ragService'
import { generateActions } from './actionGenerator'
import { ChatIntent, ChatResponse, ChatAction, UserContext } from '@/types/chat.types'
import { OFF_TOPIC_RESPONSE, CHAT_CONFIG } from '@/config/chat.config'
import { prisma } from '@/lib/db'

export class ChatService {
  private intentClassifier: IntentClassifier
  private cacheManager: CacheManager
  private ragService: RAGService

  constructor() {
    this.intentClassifier = new IntentClassifier()
    this.cacheManager = new CacheManager()
    this.ragService = new RAGService()
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
      // 1. Check cache first
      const cacheKey = this.cacheManager.generateKey(message, userId)
      const cached = await this.cacheManager.get(cacheKey)
      if (cached) {
        console.log(`[ChatService] Cache hit for key: ${cacheKey}`)
        return cached
      }

      // 2. Classify intent
      const intentResult = await this.intentClassifier.classify(message, userContext)
      console.log(`[ChatService] Intent: ${intentResult.intent} (${intentResult.confidence})`)

      // 3. Route based on intent
      let response: ChatResponse

      switch (intentResult.intent) {
        case ChatIntent.NAVIGATE_COURSE:
          response = await this.handleCourseNavigation(userId, intentResult, message)
          break

        case ChatIntent.NAVIGATE_QUIZ:
          response = await this.handleQuizNavigation(userId, intentResult, message)
          break

        case ChatIntent.CREATE_QUIZ:
          response = await this.handleQuizCreation(userId, intentResult, message, userContext)
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

      // 4. Add intent to response
      response.intent = intentResult.intent

      // 5. Cache the response
      await this.cacheManager.set(cacheKey, response)

      return response
    } catch (error) {
      console.error('[ChatService] Error processing message:', error)
      return this.getErrorResponse()
    }
  }

  /**
   * Handle course navigation requests
   */
  private async handleCourseNavigation(
    userId: string | undefined,
    intentResult: any,
    message: string
  ): Promise<ChatResponse> {
    // Extract topics from entities or message
    const topics = intentResult.entities.topics || []
    
    // Search courses
    const courses = await this.searchCourses(topics, userId)

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

    // Format response
    const courseList = courses
      .slice(0, 5)
      .map((c: any, i: number) => `${i + 1}. **${c.title}**${c.description ? ` - ${c.description.slice(0, 100)}...` : ''}`)
      .join('\n')

    return {
      content: `I found ${courses.length} course${courses.length > 1 ? 's' : ''} ${topics.length > 0 ? `related to "${topics[0]}"` : 'for you'}:\n\n${courseList}\n\nClick any course below to start learning!`,
      actions: courses.slice(0, 5).map((c: any) => ({
        type: 'view_course' as const,
        label: c.title,
        url: `/dashboard/course/${c.slug}`,
        metadata: { courseId: c.id },
      })),
      tokensUsed: 0,
      cached: false,
    }
  }

  /**
   * Handle quiz navigation requests
   */
  private async handleQuizNavigation(
    userId: string | undefined,
    intentResult: any,
    message: string
  ): Promise<ChatResponse> {
    const quizTypes = intentResult.entities.quizTypes || []
    const topics = intentResult.entities.topics || []

    const quizzes = await this.searchQuizzes(quizTypes, topics, userId)

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
      .map((q: any, i: number) => `${i + 1}. **${q.title}** (${q.type})`)
      .join('\n')

    return {
      content: `Found ${quizzes.length} quiz${quizzes.length > 1 ? 'zes' : ''}:\n\n${quizList}`,
      actions: quizzes.slice(0, 3).map((q: any) => ({
        type: 'view_quiz' as const,
        label: `Take ${q.title}`,
        url: `/dashboard/${q.type}/${q.slug}`,
        metadata: { quizId: q.id },
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

    const topics = intentResult.entities.topics || []
    const quizTypes = intentResult.entities.quizTypes || []
    const difficulty = intentResult.entities.difficulty

    // Generate suggested quiz parameters
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
            topic: topics[0],
            quizType: quizTypes[0],
            difficulty,
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
    
    // Use RAG service for explanation with proper options
    const ragResponse = await this.ragService.generateResponse(
      userId || 'anonymous',
      message,
      {
        maxTokens: isSubscribed ? 500 : 250,
        temperature: 0.7,
        includeHistory: true,
      }
    )

    // Generate related actions using RAG context
    const actions = ragResponse.context ? await generateActions({
      userId: userId || 'anonymous',
      query: message,
      relevantDocuments: ragResponse.context.relevantDocuments,
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
        currentUsage: {
          coursesThisMonth: 0,
          quizzesThisMonth: 0,
        },
        canCreate: {
          course: isSubscribed,
          quiz: true,
        },
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
    const isSubscribed = userContext?.isSubscribed

    if (isSubscribed) {
      return {
        content: `You're currently on a **Pro plan** with access to:

✅ Unlimited quiz generation
✅ Advanced AI explanations  
✅ Priority support
✅ All quiz types
✅ Custom courses

Need help with anything else?`,
        actions: [
          {
            type: 'navigate',
            label: 'View Subscription',
            url: '/dashboard/subscription',
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

Plans start at just $9/month!`,
      actions: [
        {
          type: 'upgrade_plan',
          label: 'View Plans',
          url: '/dashboard/subscription',
        },
      ],
      tokensUsed: 0,
      cached: false,
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
    // Use RAG to find relevant help articles
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
          url: '/contactus',
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
      relevantDocuments: ragResponse.context.relevantDocuments,
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
        currentUsage: {
          coursesThisMonth: 0,
          quizzesThisMonth: 0,
        },
        canCreate: {
          course: isSubscribed,
          quiz: true,
        },
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
   * Search courses
   */
  private async searchCourses(topics: string[], userId?: string): Promise<any[]> {
    try {
      const where: any = {
        isPublic: true,
        status: 'PUBLISHED',
      }
      
      if (topics.length > 0) {
        where.OR = topics.map(topic => ({
          OR: [
            { title: { contains: topic, mode: 'insensitive' } },
            { description: { contains: topic, mode: 'insensitive' } },
          ],
        }))
      }

      return await prisma.course.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
        },
      })
    } catch (error) {
      console.error('[ChatService] Error searching courses:', error)
      return []
    }
  }

  /**
   * Search quizzes
   */
  private async searchQuizzes(
    quizTypes: string[],
    topics: string[],
    userId?: string
  ): Promise<any[]> {
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

      return await prisma.userQuiz.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          quizType: true,
        },
      })
    } catch (error) {
      console.error('[ChatService] Error searching quizzes:', error)
      return []
    }
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

// Singleton instance
export const chatService = new ChatService()
