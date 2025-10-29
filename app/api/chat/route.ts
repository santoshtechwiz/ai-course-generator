import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { chatService } from '@/app/services/chat/ChatService'
import { RATE_LIMITS, CHAT_CONFIG } from '@/config/chat.config'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getRAGService } from '@/app/services/chat/ragService'
import { UserContext } from '@/types/chat.types'

interface ChatRequest {
  message: string
  stream?: boolean
}

/**
 * FIX #5: Rate limit now fails CLOSED (denies on error for security)
 */
async function checkRateLimit(userId: string, isSubscribed: boolean): Promise<{ allowed: boolean; reason?: string }> {
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

    logger.info(`[Chat API] Rate limit check: ${messageCount}/${limits.limit}`)
    
    if (messageCount >= limits.limit) {
      return {
        allowed: true,
        reason: limits.resetMessage || `Rate limit exceeded. Please try again later.`
      }
    }
    
    return { allowed: true }
  } catch (error) {
    logger.error('[Chat API] Rate limit check failed, DENYING request:', error)
    // FIX: Fail CLOSED - deny on error for security
    return {
      allowed: false,
      reason: 'System temporarily unavailable. Please try again.'
    }
  }
}

async function logChatMessage(userId: string, message: string, response: string): Promise<void> {
  try {
    await Promise.all([
      prisma.chatMessage.create({
        data: {
          userId,
          role: 'user',
          content: message,
          createdAt: new Date()
        }
      }),
      prisma.chatMessage.create({
        data: {
          userId,
          role: 'assistant',
          content: response,
          createdAt: new Date()
        }
      })
    ])
    
    logger.info('[Chat API] Messages logged successfully')
  } catch (error) {
    logger.error('[Chat API] Failed to log chat message:', error)
    // Don't throw - this is non-critical
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    logger.info('[Chat API] Received POST request')
    
    // 1. Get session
    const session = await getAuthSession()
    const userId = session?.user?.id

    // 2. Parse request body
    let body: ChatRequest
    try {
      body = await request.json()
    } catch (error) {
      logger.error('[Chat API] Invalid JSON:', error)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { message, stream = CHAT_CONFIG.streamingEnabled } = body

    // 3. Validate message
    if (!message?.trim()) {
      logger.warn('[Chat API] Empty message received')
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Prevent duplicate rapid requests (deduplication)
    const messageHash = `${userId}:${message.trim().slice(0, 50)}`
    const recentKey = `recent_msg:${messageHash}`
    const recent = await prisma.chatMessage.count({
      where: {
        userId,
        content: message.trim(),
        createdAt: {
          gte: new Date(Date.now() - 5000) // Last 5 seconds
        }
      }
    })
    
    if (recent > 0) {
      logger.warn('[Chat API] Duplicate message detected, rejecting')
      return NextResponse.json(
        { error: 'Please wait before sending another message' },
        { status: 429 }
      )
    }

    logger.info('[Chat API] Processing message:', {
      userId: userId || 'anonymous',
      messageLength: message.length,
      hasSession: !!session
    })

    // 4. Check subscription status and get subscription details
    let isSubscribed = false
    let subscriptionTier = 'free'
    
    if (userId) {
      try {
        // const userWithSubscription = await prisma.user.findUnique({
        //   where: { id: userId },
        //   include: {
        //     subscription: {
        //       select: {
        //         status: true,
        //         currentPeriodEnd: true,
        //       },
        //       include: {
        //         plan: {
        //           select: {
        //             name: true,
        //           }
        //         }
        //       }
        //     }
        //   }
        // })

        // isSubscribed = userWithSubscription?.subscription?.status === 'active' && 
        //               userWithSubscription?.subscription?.currentPeriodEnd > new Date()
        // subscriptionTier = userWithSubscription?.subscription?.plan?.name?.toLowerCase() || 'free'
        
        logger.info('[Chat API] Subscription status:', {
          userId,
          isSubscribed,
          tier: subscriptionTier,
          hasSubscription: true
        })
      } catch (error) {
        logger.error('[Chat API] Failed to check subscription:', error)
        // Continue without subscription info - treat as free user
      }
    }

    // 5. Check rate limit
    if (userId) {
      const rateLimitCheck = await checkRateLimit(userId, isSubscribed)
      if (!rateLimitCheck.allowed) {
        logger.warn('[Chat API] Rate limit exceeded:', { userId })
        return NextResponse.json(
          { 
            error: rateLimitCheck.reason || 'Rate limit exceeded',
            rateLimitExceeded: true
          },
          { status: 429 }
        )
      }
    }

    // 6. Build user context
    const userContext: UserContext = {
      userId,
      isSubscribed,
      subscriptionTier,
    }

    // 7. Process message with ChatService
    logger.info('[Chat API] Calling chatService.processMessage')
    const response = await chatService.processMessage(userId, message, userContext)

    // 8. Validate response before returning
    if (!response || !response.content) {
      logger.error('[Chat API] ChatService returned invalid response:', response)
      return NextResponse.json(
        { 
          error: 'Failed to generate response. Please try again.',
          content: 'I apologize, but I encountered an issue. Please try rephrasing your question.'
        },
        { status: 500 }
      )
    }

    // Validate content length
    if (response.content.trim().length < 5) {
      logger.warn('[Chat API] Response too short, requesting retry')
      return NextResponse.json(
        { 
          error: 'Response too short, please try again',
          content: 'I couldn\'t generate a proper response. Please rephrase your question.'
        },
        { status: 500 }
      )
    }

    logger.info('[Chat API] Response generated:', {
      contentLength: response.content.length,
      actionsCount: response.actions?.length || 0,
      tokensUsed: response.tokensUsed,
      cached: response.cached,
      intent: response.intent,
      processingTime: Date.now() - startTime
    })

    // 9. Log chat messages (non-blocking)
    if (userId && response.content) {
      logChatMessage(userId, message, response.content)
        .catch(err => logger.error('[Chat API] Async logging failed:', err))
    }

    // 10. Return successful response
    return NextResponse.json({
      content: response.content,
      actions: response.actions || [],
      tokensUsed: response.tokensUsed || 0,
      cached: response.cached || false,
      intent: response.intent,
      processingTime: Date.now() - startTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    logger.error('[Chat API] Error processing chat request:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      processingTime
    })
    
    return NextResponse.json(
      { 
        error: 'An error occurred while processing your request. Please try again.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        processingTime
      },
      { status: 500 }
    )
  }
}

/**
 * FIX #9: Now clears both database AND RAG service conversation cache
 */
export async function DELETE(request: NextRequest) {
  try {
    logger.info('[Chat API] Received DELETE request')
    
    const session = await getAuthSession()
    if (!session?.user?.id) {
      logger.warn('[Chat API] Unauthorized DELETE attempt')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Delete from database
    const deleted = await prisma.chatMessage.deleteMany({
      where: { userId: session.user.id }
    })

    // FIX: Clear RAG service conversation cache
    try {
      const ragService = getRAGService()
      ragService.clearConversation(session.user.id)
      logger.info('[Chat API] RAG conversation cache cleared')
    } catch (error) {
      logger.error('[Chat API] Failed to clear RAG cache:', error)
      // Don't fail the entire request if RAG cache clear fails
    }

    logger.info('[Chat API] Conversation cleared:', {
      userId: session.user.id,
      deletedCount: deleted.count
    })

    return NextResponse.json({ 
      success: true,
      deletedCount: deleted.count
    })
    
  } catch (error) {
    logger.error('[Chat API] Error clearing conversation:', error)
    return NextResponse.json(
      { error: 'Failed to clear conversation' },
      { status: 500 }
    )
  }
}