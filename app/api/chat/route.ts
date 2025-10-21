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

    return messageCount < limits.limit
  } catch (error) {
    logger.error('[Chat API] Rate limit check failed:', error)
    return true
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
  } catch (error) {
    logger.error('[Chat API] Failed to log chat message:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    const userId = session?.user?.id

    let body: ChatRequest
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { message, stream = CHAT_CONFIG.streamingEnabled } = body

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    let isSubscribed = false
    if (userId) {
      const userWithSubscription = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true
        }
      })

      isSubscribed = userWithSubscription?.subscription?.status === 'active' && 
                    userWithSubscription?.subscription?.currentPeriodEnd > new Date()
    }

    if (userId) {
      const canUseChat = await checkRateLimit(userId, isSubscribed)
      if (!canUseChat) {
        const limits = isSubscribed ? RATE_LIMITS.subscribed : RATE_LIMITS.free
        return NextResponse.json(
          { 
            error: limits.resetMessage || `Rate limit exceeded. Please try again later.`,
            rateLimitExceeded: true
          },
          { status: 429 }
        )
      }
    }

    const userContext: UserContext = {
      userId,
      isSubscribed,
    }

    const response = await chatService.processMessage(userId, message, userContext)

    if (userId) {
      await logChatMessage(userId, message, response.content)
    }

    return NextResponse.json({
      content: response.content,
      actions: response.actions,
      tokensUsed: response.tokensUsed,
      cached: response.cached,
      intent: response.intent,
    })

  } catch (error) {
    logger.error('[Chat API] Error processing chat request:', error)
    return NextResponse.json(
      { 
        error: 'An error occurred while processing your request. Please try again.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await prisma.chatMessage.deleteMany({
      where: { userId: session.user.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[Chat API] Error clearing conversation:', error)
    return NextResponse.json(
      { error: 'Failed to clear conversation' },
      { status: 500 }
    )
  }
}
