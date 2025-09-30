import type { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { ChatMemoryManager } from '@/app/aimodel/chat/memory-manager'
import { EmbeddingManager } from '@/app/aimodel/core/embedding-manager'

// Vector-only chat POST handler

const memoryManagers: Map<string, ChatMemoryManager> = new Map()

function getMemoryManager(userId: string): ChatMemoryManager {
  if (!memoryManagers.has(userId)) memoryManagers.set(userId, new ChatMemoryManager(userId))
  return memoryManagers.get(userId)!
}

function sanitizeHeaderValue(text?: string, maxLen = 200): string | undefined {
  if (!text) return undefined
  try {
    let s = String(text).replace(/\r?\n|\r/g, ' ')
    s = s.replace(/\s+/g, ' ').trim()
    s = s.replace(/[^\x20-\x7E]/g, '')
    if (s.length === 0) return undefined
    if (s.length > maxLen) s = s.slice(0, maxLen - 3).trim() + '...'
    return s
  } catch {
    return undefined
  }
}

function makeJsonResponse(obj: any, status = 200) {
  const body = JSON.stringify(obj)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const assistantText = obj && (obj.assistant || obj.message || obj.error)
  const safe = sanitizeHeaderValue(assistantText)
  if (safe) headers['x-assistant-text'] = safe
  return new Response(body, { status, headers })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const incomingMessages = body?.messages || body?.msgs || null
    const singleQuestion = body?.question || body?.message || ''

    const authSession = await getAuthSession()
    const userId = authSession?.user?.id
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (!userId && !isDevelopment) return new Response('Unauthorized', { status: 401 })
    const effectiveUserId = userId || 'test-user-dev'
    const sessionId = `user_${effectiveUserId}`

    let userMessage = ''
    if (incomingMessages && Array.isArray(incomingMessages) && incomingMessages.length > 0) {
      const lastUser = [...incomingMessages].slice().reverse().find((m: any) => m && (m.role === 'user' || m.role === 'User'))
      userMessage = lastUser?.content || ''
    } else {
      userMessage = String(singleQuestion || '').trim()
    }
    if (!userMessage || !userMessage.trim()) return makeJsonResponse({ assistant: 'Please provide a question.' }, 400)

    const memoryMgr = getMemoryManager(effectiveUserId)

    const similarityThreshold = Number(process.env.EMBEDDING_SIMILARITY_THRESHOLD || '0.1')
    const similarityTopK = Number(process.env.EMBEDDING_TOP_K || '12')
    const enableDebug = Boolean(process.env.EMBEDDING_DEBUG === '1' || process.env.NODE_ENV !== 'production')

    try {
      const embMgr = new EmbeddingManager()
      await embMgr.initialize()

      const docs = await embMgr.similaritySearch(userMessage, { limit: similarityTopK, threshold: similarityThreshold })

      if (docs && docs.length > 0) {
        const grouped = {
          courses: docs.filter((d: any) => d.metadata?.type === 'course'),
          chapters: docs.filter((d: any) => d.metadata?.type === 'chapter'),
          flashcards: docs.filter((d: any) => d.metadata?.type === 'flashcard'),
          quizzes: docs.filter((d: any) => d.metadata?.type === 'quiz')
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"
        let assistantText = ''
        let hasRelevantInfo = false

        // Build contextual response based on found content
        if (grouped.courses.length) {
          hasRelevantInfo = true
          assistantText += `I found ${grouped.courses.length} course${grouped.courses.length > 1 ? 's' : ''} related to your question:\n\n`
          grouped.courses.slice(0, 3).forEach((c: any, i: number) => {
            const title = c.metadata?.title || 'Untitled Course'
            const description = c.metadata?.description || c.content || 'No description available'
            const slug = c.metadata?.slug
            const link = slug ? `${siteUrl}/courses/${slug}` : `${siteUrl}/courses`
            assistantText += `**${title}**\n${description.slice(0, 150)}...\n[View Course](${link})\n\n`
          })
        }

        if (grouped.chapters.length) {
          hasRelevantInfo = true
          if (!assistantText) assistantText += `Here are learning materials related to your query:\n\n`
          assistantText += `**Related Chapters:**\n`
          grouped.chapters.slice(0, 3).forEach((c: any, i: number) => {
            const title = c.metadata?.title || 'Untitled Chapter'
            const content = c.content || 'No content available'
            const unitId = c.metadata?.unitId
            const link = unitId ? `${siteUrl}/courses/unit/${unitId}` : `${siteUrl}/courses`
            assistantText += `• **${title}**: ${content.slice(0, 120)}...\n[Study Chapter](${link})\n`
          })
          assistantText += '\n'
        }

        if (grouped.quizzes.length) {
          hasRelevantInfo = true
          if (!assistantText) assistantText += `I found assessment materials for your topic:\n\n`
          assistantText += `**Practice Quizzes:**\n`
          grouped.quizzes.slice(0, 3).forEach((c: any, i: number) => {
            const title = c.metadata?.title || 'Untitled Quiz'
            const description = c.metadata?.description || 'Test your knowledge'
            const slug = c.metadata?.slug
            const link = slug ? `${siteUrl}/quizzes/${slug}` : `${siteUrl}/quizzes`
            assistantText += `• **${title}**: ${description}\n[Take Quiz](${link})\n`
          })
          assistantText += '\n'
        }

        if (grouped.flashcards.length) {
          hasRelevantInfo = true
          if (!assistantText) assistantText += `Here are key concepts related to your question:\n\n`
          assistantText += `**Key Concepts:**\n`
          grouped.flashcards.slice(0, 4).forEach((c: any, i: number) => {
            const content = String(c.content).slice(0, 200)
            assistantText += `• ${content}\n`
          })
          assistantText += '\n'
        }

        if (hasRelevantInfo) {
          // Add contextual suggestion based on content type distribution
          const totalItems = grouped.courses.length + grouped.chapters.length + grouped.quizzes.length + grouped.flashcards.length
          
          if (grouped.quizzes.length > grouped.courses.length) {
            assistantText += `Based on your question, practice might help reinforce these concepts. `
          } else if (grouped.courses.length > 0) {
            assistantText += `The courses above provide comprehensive coverage of this topic. `
          }
          
          assistantText += `Would you like me to help you create additional learning materials for this subject?`
        }

        const matches = docs.map((d: any) => ({
          id: d.id,
          type: d.metadata?.type,
          title: d.metadata?.title,
          description: d.metadata?.description,
          slug: d.metadata?.slug,
          link: d.metadata?.type === 'course' && d.metadata?.slug ? `${siteUrl}/courses/${d.metadata.slug}` :
                d.metadata?.type === 'quiz' && d.metadata?.slug ? `${siteUrl}/quizzes/${d.metadata.slug}` :
                d.metadata?.type === 'chapter' && d.metadata?.unitId ? `${siteUrl}/courses/unit/${d.metadata.unitId}` : null,
          similarity: d.similarity,
          contentPreview: d.content?.slice(0, 100) + '...'
        }))
        
        try { 
          await memoryMgr.addMessage(sessionId, { 
            role: 'assistant', 
            content: assistantText, 
            id: `msg_${Date.now()}`, 
            timestamp: Date.now() 
          }) 
        } catch {}
        
        if (enableDebug) {
          return makeJsonResponse({ 
            assistant: assistantText, 
            matches, 
            debug: { 
              thresholdUsed: similarityThreshold, 
              topK: similarityTopK,
              totalMatches: docs.length,
              contentTypes: Object.keys(grouped).reduce((acc, key) => {
                acc[key] = grouped[key as keyof typeof grouped].length
                return acc
              }, {} as Record<string, number>)
            } 
          }, 200)
        }
        return makeJsonResponse({ assistant: assistantText, matches }, 200)
      }

      // No results found - try relaxed search
      const relaxedThreshold = Math.max(0.35, similarityThreshold - 0.2)
      const relaxedTopK = Math.min(50, similarityTopK * 2)
      
      try {
        const relaxedDocs = await embMgr.similaritySearch(userMessage, { 
          limit: relaxedTopK, 
          threshold: relaxedThreshold 
        })

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"
        
        if (relaxedDocs && relaxedDocs.length > 0) {
          // Found some content with relaxed parameters
          const relaxedGrouped = {
            courses: relaxedDocs.filter((d: any) => d.metadata?.type === 'course'),
            quizzes: relaxedDocs.filter((d: any) => d.metadata?.type === 'quiz'),
            chapters: relaxedDocs.filter((d: any) => d.metadata?.type === 'chapter')
          }

          let assistantText = `I found some potentially related content that might help with "${userMessage}":\n\n`

          if (relaxedGrouped.courses.length > 0) {
            assistantText += `**Related Courses:**\n`
            relaxedGrouped.courses.slice(0, 2).forEach((c: any) => {
              const title = c.metadata?.title || 'Untitled Course'
              const slug = c.metadata?.slug
              const link = slug ? `${siteUrl}/courses/${slug}` : `${siteUrl}/courses`
              assistantText += `• [${title}](${link})\n`
            })
            assistantText += '\n'
          }

          if (relaxedGrouped.quizzes.length > 0) {
            assistantText += `**Related Quizzes:**\n`
            relaxedGrouped.quizzes.slice(0, 2).forEach((c: any) => {
              const title = c.metadata?.title || 'Untitled Quiz'
              const slug = c.metadata?.slug
              const link = slug ? `${siteUrl}/quizzes/${slug}` : `${siteUrl}/quizzes`
              assistantText += `• [${title}](${link})\n`
            })
            assistantText += '\n'
          }

          assistantText += `If this doesn't address your question, you might consider creating custom learning materials for this topic.`

          const relaxedMatches = relaxedDocs.map((d: any) => ({
            id: d.id,
            type: d.metadata?.type,
            title: d.metadata?.title,
            similarity: d.similarity
          }))
          
          try { 
            await memoryMgr.addMessage(sessionId, { 
              role: 'assistant', 
              content: assistantText, 
              id: `msg_${Date.now()}`, 
              timestamp: Date.now() 
            }) 
          } catch {}
          
          if (enableDebug) {
            return makeJsonResponse({ 
              assistant: assistantText, 
              matches: relaxedMatches, 
              debug: { 
                thresholdUsed: similarityThreshold, 
                relaxedThreshold, 
                relaxedTopK 
              } 
            }, 200)
          }
          return makeJsonResponse({ assistant: assistantText, matches: relaxedMatches }, 200)
        }
      } catch (err) {
        logger.warn('Relaxed vector search failed', { error: err })
      }

      // Final fallback - no content found at all
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"
      let assistantText = `I searched our learning materials but couldn't find specific content about "${userMessage}".\n\n`
      assistantText += `This appears to be a topic we haven't covered yet. Would you like to help build our knowledge base?\n\n`
      assistantText += `You can:\n`
      assistantText += `• [Create a Quiz](${siteUrl}/quizzes/create) to test knowledge on this topic\n`
      assistantText += `• [Create a Course](${siteUrl}/courses/create) to teach others about "${userMessage}"\n\n`
      assistantText += `Or try rephrasing your question to see if we have related materials.`

      try { 
        await memoryMgr.addMessage(sessionId, { 
          role: 'assistant', 
          content: assistantText, 
          id: `msg_${Date.now()}`, 
          timestamp: Date.now() 
        }) 
      } catch {}
      
      return makeJsonResponse({ assistant: assistantText }, 200)

    } catch (err) {
      logger.error('Vector search failed', { error: err })
      
      // Fallback when vector search completely fails
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"
      let assistantText = `I encountered a technical issue while searching for "${userMessage}".\n\n`
      assistantText += `In the meantime, you might want to:\n`
      assistantText += `• [Browse Existing Courses](${siteUrl}/courses)\n`
      assistantText += `• [Create Your Own Content](${siteUrl}/courses/create)\n\n`
      assistantText += `Please try again in a moment.`

      try { 
        await memoryMgr.addMessage(sessionId, { 
          role: 'assistant', 
          content: assistantText, 
          id: `msg_${Date.now()}`, 
          timestamp: Date.now() 
        }) 
      } catch {}
      
      return makeJsonResponse({ assistant: assistantText }, 200)
    }
  } catch (error) {
    logger.error('Chat API error', { error })
    if (process.env.NODE_ENV !== 'production') {
      const body = { error: String((error as any)?.message || error), stack: (error as any)?.stack || null }
      return new Response(JSON.stringify(body, null, 2), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
    return new Response('Internal Server Error', { status: 500 })
  }
}