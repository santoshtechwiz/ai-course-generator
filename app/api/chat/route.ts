import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { chatService } from '@/app/services/chat/ChatService'
import { RATE_LIMITS, CHAT_CONFIG } from '@/config/chat.config'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { UserContext } from '@/types/chat.types'

interface ChatRequest {
  message: string
  stream?: boolean
}

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

    logger.info(`[Chat API] Rate limit check: ${messageCount}/${limits.limit}`)
    return messageCount < limits.limit
  } catch (error) {
    logger.error('[Chat API] Rate limit check failed:', error)
    return true // Allow on error
  }
}

async function logChatMessage(userId: string, message: string, response: string): Promise<void> {
  try {
    await prisma.chatMessage.create({
      data: {
        userId,
        role: 'user',
        content: message,
        createdAt: new Date()
      }
    })
    
    await prisma.chatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: response,
        createdAt: new Date()
      }
    })
    
    logger.info('[Chat API] Messages logged successfully')
  } catch (error) {
    logger.error('[Chat API] Failed to log chat message:', error)
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

    logger.info('[Chat API] Processing message:', {
      userId: userId || 'anonymous',
      messageLength: message.length,
      hasSession: !!session
    })

    // 4. Check subscription status
    let isSubscribed = false
    if (userId) {
      try {
        const userWithSubscription = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            subscription: true
          }
        })

        isSubscribed = userWithSubscription?.subscription?.status === 'active' && 
                      userWithSubscription?.subscription?.currentPeriodEnd > new Date()
        
        logger.info('[Chat API] Subscription status:', {
          userId,
          isSubscribed,
          hasSubscription: !!userWithSubscription?.subscription
        })
      } catch (error) {
        logger.error('[Chat API] Failed to check subscription:', error)
      }
    }

    // 5. Check rate limit
    if (userId) {
      const canUseChat = await checkRateLimit(userId, isSubscribed)
      if (!canUseChat) {
        const limits = isSubscribed ? RATE_LIMITS.subscribed : RATE_LIMITS.free
        logger.warn('[Chat API] Rate limit exceeded:', { userId })
        return NextResponse.json(
          { 
            error: limits.resetMessage || `Rate limit exceeded. Please try again later.`,
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
    }

    // 7. Process message with ChatService
    logger.info('[Chat API] Calling chatService.processMessage')
    const response = await chatService.processMessage(userId, message, userContext)

    // 8. Validate response
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

    logger.info('[Chat API] Response generated:', {
      contentLength: response.content.length,
      actionsCount: response.actions?.length || 0,
      tokensUsed: response.tokensUsed,
      cached: response.cached,
      intent: response.intent,
      processingTime: Date.now() - startTime
    })

    // 9. Log chat messages
    if (userId && response.content) {
      // Fire and forget - don't block response
      logChatMessage(userId, message, response.content).catch(err => {
        logger.error('[Chat API] Async logging failed:', err)
      })
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

    const deleted = await prisma.chatMessage.deleteMany({
      where: { userId: session.user.id }
    })

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