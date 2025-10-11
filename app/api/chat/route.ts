/**
 * Simplified Chat API Route for CourseAI
 * 
 * Features:
 * - RAG-based responses using course content
 * - Cost-optimized with GPT-4o-mini
 * - Subscription-based rate limiting
 * - Streaming and non-streaming responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { getRAGService } from '@/app/services/ragService'
import { generateActions, type ChatAction } from '@/app/services/actionGenerator'
import { checkSubscriptionLimits, getRemainingQuota } from '@/app/services/subscriptionLimits'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/db'

// Rate limiting configuration
const RATE_LIMITS = {
  free: { limit: 10, windowHours: 1 },
  subscribed: { limit: 100, windowHours: 1 }
}

interface ChatRequest {
  message: string
  stream?: boolean
}

interface EnhancedChatResponse {
  content: string
  tokensUsed: number
  relevantSources: number
  actions?: ChatAction[]
  subscriptionInfo?: {
    tier: string
    remaining: {
      courses: string
      quizzes: string
    }
  }
}

/**
 * Check rate limits for user
 */
async function checkRateLimit(userId: string, isSubscribed: boolean): Promise<boolean> {
  try {
    const limits = isSubscribed ? RATE_LIMITS.subscribed : RATE_LIMITS.free
    const windowStart = new Date(Date.now() - limits.windowHours * 60 * 60 * 1000)

    const messageCount = await prisma.chatMessage.count({
      where: {
        userId,
        createdAt: {
          gte: windowStart
        }
      }
    })

    return messageCount < limits.limit
  } catch (error) {
    logger.error('[Chat API] Rate limit check failed:', error)
    return true // Allow on error
  }
}

/**
 * Log chat message for rate limiting
 */
async function logChatMessage(userId: string, message: string, response: string): Promise<void> {
  try {
    // Log user message
    await prisma.chatMessage.create({
      data: {
        userId,
        role: 'user',
        content: message,
        createdAt: new Date()
      }
    })
    
    // Log assistant response
    await prisma.chatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: response,
        createdAt: new Date()
      }
    })
  } catch (error) {
    logger.error('[Chat API] Failed to log chat message:', error)
    // Don't throw - logging failure shouldn't break chat
  }
}

/**
 * POST /api/chat - Generate chat response
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Parse request body
    let body: ChatRequest
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { message, stream = false } = body

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check user subscription status
    const userWithSubscription = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true
      }
    })

    const isSubscribed = userWithSubscription?.subscription?.status === 'active' && 
                        userWithSubscription?.subscription?.currentPeriodEnd > new Date()

    // Check rate limits
    const canUseChat = await checkRateLimit(userId, isSubscribed)
    if (!canUseChat) {
      const limits = 10;// isSubscribed ? RATE_LIMITS.subscribed : RATE_LIMITS.free
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. ${isSubscribed ? 'Subscribers' : 'Free users'} can send ${limits.limit} messages per ${limits.windowHours} hour(s).`,
          rateLimitExceeded: true
        },
        { status: 429 }
      )
    }

    // Initialize RAG service
    const ragService = getRAGService()
    await ragService.initialize()

    // Check if query is relevant to course content
    const isRelevant = await ragService.isRelevantQuery(message)
    if (!isRelevant) {
      const politeResponse = "I'm CourseAI, your learning assistant. I'm here to help with questions about your courses, learning materials, and educational content. How can I assist you with your studies today?"
      
      // Log the interaction
      await logChatMessage(userId, message, politeResponse)
      
      return NextResponse.json({
        content: politeResponse,
        tokensUsed: 0,
        relevantSources: 0
      })
    }

    // Generate response
    if (stream) {
      // Streaming response
      const responseStream = await ragService.generateStreamingResponse(userId, message, {
        maxTokens: isSubscribed ? 500 : 250,
        temperature: 0.7,
        includeHistory: true,
        contextLimit: isSubscribed ? 5 : 3
      })

      return new Response(responseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    } else {
      // Non-streaming response
      const response = await ragService.generateResponse(userId, message, {
        maxTokens: isSubscribed ? 500 : 250,
        temperature: 0.7,
        includeHistory: true,
        contextLimit: isSubscribed ? 5 : 3
      })

      // Log the interaction
      await logChatMessage(userId, message, response.content)

      // Check subscription limits
      const subscriptionStatus = await checkSubscriptionLimits(userId)
      const remainingQuota = getRemainingQuota(subscriptionStatus)

      // Generate contextual actions
      const actions = await generateActions({
        userId,
        query: message,
        relevantDocuments: response.context?.relevantDocuments || [],
        subscriptionStatus
      })

      const enhancedResponse: EnhancedChatResponse = {
        content: response.content,
        tokensUsed: response.tokensUsed,
        relevantSources: response.relevantSources,
        actions: actions.length > 0 ? actions : undefined,
        subscriptionInfo: {
          tier: subscriptionStatus.tier,
          remaining: remainingQuota
        }
      }

      return NextResponse.json(enhancedResponse)
    }
  } catch (error) {
    logger.error('[Chat API] Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/chat - Get conversation history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const ragService = getRAGService()
    const history = ragService.getConversationHistory(session.user.id)

    return NextResponse.json({ history })
  } catch (error) {
    logger.error('[Chat API] Error getting conversation history:', error)
    return NextResponse.json(
      { error: 'Failed to get conversation history' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/chat - Clear conversation history
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const ragService = getRAGService()
    ragService.clearConversation(session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[Chat API] Error clearing conversation:', error)
    return NextResponse.json(
      { error: 'Failed to clear conversation' },
      { status: 500 }
    )
  }
}
