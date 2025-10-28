/**
 * Chat Service - FIXED VERSION
 * Main orchestrator for chat functionality with intent-based routing
 * Bug Fixes:
 * - Added proper RAG error handling
 * - Fixed empty response handling
 * - Added response validation
 * - Improved logging and debugging
 * - Added fallback mechanisms
 */

import { ChatIntent, ChatResponse, ChatAction, UserContext } from '@/types/chat.types'
import { OFF_TOPIC_RESPONSE, CHAT_CONFIG } from '@/config/chat.config'
import { prisma } from '@/lib/db'
import { generateActions } from '@/app/services/chat/actionGenerator'
import { CacheManager } from '@/app/services/chat/CacheManager'
import { IntentClassifier } from '@/app/services/chat/IntentClassifier'
import { RAGService } from '@/app/services/chat/ragService'
import { SafeRAGService } from '@/app/services/chat/safeRagService'

export class ChatService {
  private intentClassifier: IntentClassifier
  private cacheManager: CacheManager
  private ragService: SafeRAGService

  constructor() {
    this.intentClassifier = new IntentClassifier()
    this.cacheManager = new CacheManager()

    // Initialize RAG Service with proper configuration
    try {
      const rawRAGService = new RAGService()
      this.ragService = new SafeRAGService(rawRAGService)
      console.log('[ChatService] RAG Service initialized successfully')
    } catch (error) {
      console.error('[ChatService] Failed to initialize RAG Service:', error)
      throw new Error('RAG Service initialization failed')
    }
  }

  /**
   * Main entry point for processing chat messages
   */
  async processMessage(
    userId: string | undefined,
    message: string,
    userContext?: UserContext
  ): Promise<ChatResponse> {
    console.log('[ChatService] Processing message:', { userId, messageLength: message.length })
    
    try {
      // 1. Validate input
      if (!message?.trim()) {
        throw new Error('Empty message received')
      }

      // 2. Check cache first
      const cacheKey = this.cacheManager.generateKey(message, userId)
      const cached = await this.cacheManager.get(cacheKey)
      if (cached) {
        console.log('[ChatService] ✓ Cache hit for key:', cacheKey)
        return cached
      }

      // 3. Classify intent
      const intentResult = await this.intentClassifier.classify(message, userContext)
      console.log('[ChatService] Intent classified:', {
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        entities: intentResult.entities
      })

      // 4. Route based on intent
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

      // 5. Validate response
      if (!response || !response.content) {
        console.error('[ChatService] Empty response generated, using fallback')
        response = this.getFallbackResponse(message)
      }

      // 6. Add intent to response
      response.intent = intentResult.intent

      // 7. Cache the response (only if valid)
      if (response.content && response.content.length > 10) {
        await this.cacheManager.set(cacheKey, response)
        console.log('[ChatService] Response cached successfully')
      }

      console.log('[ChatService] ✓ Message processed successfully')
      return response

    } catch (error) {
      console.error('[ChatService] ERROR processing message:', error)
      return this.getErrorResponse(error instanceof Error ? error.message : 'Unknown error')
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
    console.log('[ChatService] Handling course navigation')
    
    const topics = intentResult.entities.topics || []
    const courses = await this.searchCourses(topics, userId)

    console.log('[ChatService] Found courses:', courses.length)

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
    console.log('[ChatService] Handling quiz navigation')
    
    const quizTypes = intentResult.entities.quizTypes || []
    const topics = intentResult.entities.topics || []
    const quizzes = await this.searchQuizzes(quizTypes, topics, userId)

    console.log('[ChatService] Found quizzes:', quizzes.length)

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
    console.log('[ChatService] Handling quiz creation')
    
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
   * Handle concept explanation using RAG - FIXED VERSION
   */
  private async handleConceptExplanation(
    userId: string | undefined,
    message: string,
    userContext?: UserContext
  ): Promise<ChatResponse> {
    console.log('[ChatService] Handling concept explanation with RAG')
    
    const isSubscribed = userContext?.isSubscribed || false
    
    try {
      // Call RAG service with proper error handling
      const ragResponse = await this.ragService.generateResponse(
        userId || 'anonymous',
        message,
        {
          maxTokens: isSubscribed ? 500 : 250,
          temperature: 0.7,
          includeHistory: true,
        }
      )

      // CRITICAL FIX: Validate RAG response
      if (!ragResponse || !ragResponse.content || ragResponse.content.trim().length === 0) {
        console.error('[ChatService] RAG returned empty/invalid response')
        return this.getFallbackResponse(message)
      }

      // Log retrieval stats for debugging
      console.log('[ChatService] RAG retrieval success:', {
        contentLength: ragResponse.content.length,
        documentsFound: ragResponse.context?.relevantDocuments?.length || 0,
        tokensUsed: ragResponse.tokensUsed,
      })

      // Generate actions if context exists
      const actions = ragResponse?.context?.relevantDocuments?.length > 0 
        ? await this.generateActionsFromContext(userId, message, ragResponse.context.relevantDocuments, isSubscribed)
        : []

      return {
        content: ragResponse.content,
        actions,
        tokensUsed: ragResponse.tokensUsed,
        cached: false,
      }

    } catch (error) {
      console.error('[ChatService] RAG error:', error)
      return this.getFallbackResponse(message)
    }
  }

  /**
   * Handle subscription information requests
   */
  private async handleSubscriptionInfo(
    userId: string | undefined,
    userContext?: UserContext
  ): Promise<ChatResponse> {
    console.log('[ChatService] Handling subscription info')
    
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
   * Handle troubleshooting requests - FIXED VERSION
   */
  private async handleTroubleshooting(
    userId: string | undefined,
    message: string,
    userContext?: UserContext
  ): Promise<ChatResponse> {
    console.log('[ChatService] Handling troubleshooting')
    
    try {
      const ragResponse = await this.ragService.generateResponse(
        userId || 'anonymous',
        message,
        {
          maxTokens: userContext?.isSubscribed ? 500 : 250,
          temperature: 0.7,
          includeHistory: true,
        }
      )

      if (!ragResponse?.content) {
        throw new Error('Empty RAG response')
      }

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
    } catch (error) {
      console.error('[ChatService] Troubleshooting error:', error)
      return {
        content: `I'm here to help! Here are some common solutions:

**Common Issues:**
• **Can't access course** - Try refreshing the page or clearing your browser cache
• **Quiz not loading** - Check your internet connection and try again
• **Payment issues** - Contact our support team for immediate assistance

For more help, visit our Help Center or contact support.`,
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
        tokensUsed: 0,
        cached: false,
      }
    }
  }

  /**
   * Handle off-topic messages
   */
  private handleOffTopic(): ChatResponse {
    console.log('[ChatService] Handling off-topic message')
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
   * Handle general queries with RAG - FIXED VERSION
   */
  private async handleGeneralQuery(
    userId: string | undefined,
    message: string,
    userContext?: UserContext
  ): Promise<ChatResponse> {
    console.log('[ChatService] Handling general query')
    
    try {
      const ragResponse = await this.ragService.generateResponse(
        userId || 'anonymous',
        message,
        {
          maxTokens: userContext?.isSubscribed ? 500 : 250,
          temperature: 0.7,
          includeHistory: true,
        }
      )

      if (!ragResponse?.content) {
        throw new Error('Empty RAG response')
      }

      console.log('[ChatService] General query RAG success:', {
        contentLength: ragResponse.content.length,
        documentsFound: ragResponse.context?.relevantDocuments?.length || 0,
      })

      const isSubscribed = userContext?.isSubscribed || false
      const actions = ragResponse.context?.relevantDocuments?.length > 0
        ? await this.generateActionsFromContext(userId, message, ragResponse.context.relevantDocuments, isSubscribed)
        : []

      return {
        content: ragResponse.content,
        actions,
        tokensUsed: ragResponse.tokensUsed,
        cached: false,
      }

    } catch (error) {
      console.error('[ChatService] General query error:', error)
      return this.getFallbackResponse(message)
    }
  }

  /**
   * Helper: Generate actions from RAG context
   */
  private async generateActionsFromContext(
    userId: string | undefined,
    query: string,
    relevantDocuments: any[],
    isSubscribed: boolean
  ): Promise<ChatAction[]> {
    try {
      return await generateActions({
        userId: userId || 'anonymous',
        query,
        relevantDocuments,
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
      })
    } catch (error) {
      console.error('[ChatService] Error generating actions:', error)
      return []
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

      const courses = await prisma.course.findMany({
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

      console.log('[ChatService] Course search returned:', courses.length)
      return courses

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

      const quizzes = await prisma.userQuiz.findMany({
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

      console.log('[ChatService] Quiz search returned:', quizzes.length)
      return quizzes

    } catch (error) {
      console.error('[ChatService] Error searching quizzes:', error)
      return []
    }
  }

  /**
   * Get fallback response when RAG fails
   */
  private getFallbackResponse(message: string): ChatResponse {
    console.log('[ChatService] Using fallback response')
    
    return {
      content: `I'm having trouble finding specific information about that right now. Let me help you explore what we have available:

**What I can help with:**
• 📚 Browse our course catalog
• 🎯 Create and take quizzes
• ✨ Explore learning topics
• 💡 Get platform guidance

What would you like to do?`,
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
   * Get error response
   */
  private getErrorResponse(errorMessage?: string): ChatResponse {
    console.error('[ChatService] Returning error response:', errorMessage)
    
    return {
      content: `I apologize, but I encountered an error processing your request. ${errorMessage ? `(${errorMessage})` : ''} Please try again or rephrase your question.`,
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