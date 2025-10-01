import type { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { ChatMemoryManager } from '@/app/aimodel/chat/memory-manager'
import { EmbeddingManager } from '@/app/aimodel/core/embedding-manager'

// Lightweight heuristic utilities to better align answers with user intent
function buildAnswerSummary(userMessage: string, docs: any[]): string {
  if (!docs || docs.length === 0) return ''
  const top = docs.slice(0, 3)
  const titles = top.map(d => d?.metadata?.title).filter(Boolean) as string[]
  const distinctTitles = Array.from(new Set(titles)).slice(0, 3)
  // Extract short description/content snippets
  const primary = top[0]
  const primarySnippet = (primary?.metadata?.description || primary?.content || '').replace(/\s+/g, ' ').slice(0, 220)
  let summary = `You asked about: "${userMessage}".\n\n`
  if (distinctTitles.length) {
    summary += `Relevant learning resources matched: ${distinctTitles.map(t => `“${t}”`).join(', ')}. `
  }
  if (primarySnippet) {
    summary += `${primarySnippet}${primarySnippet.length >= 220 ? '…' : ''} `
  }
  summary += `\n\nBelow are structured references you can open for deeper study.`
  return summary.trim()
}

// Apply a dynamic post-filter so we don't surface very weak matches that confuse users
function filterByDynamicSimilarity(docs: any[], baseThreshold: number): any[] {
  if (!docs.length) return docs
  // Sort defensively (should already be sorted but enforce)
  const sorted = [...docs].sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
  const topSim = sorted[0].similarity || 0
  // Require docs to be within 0.22 of the top similarity AND above max(baseThreshold, topSim * 0.65)
  const dynamicFloor = Math.max(baseThreshold, topSim * 0.65)
  return sorted.filter(d => (d.similarity || 0) >= dynamicFloor && (topSim - (d.similarity || 0)) <= 0.22)
}

// Attempt an LLM-based semantic summary if enabled and credentials are present
async function trySemanticSummary(userMessage: string, docs: any[]): Promise<string | null> {
  if (!process.env.CHAT_SEMANTIC_SUMMARY || process.env.CHAT_SEMANTIC_SUMMARY === '0') return null
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  try {
    const topDocs = docs.slice(0, 5).map(d => ({
      title: d?.metadata?.title || d?.metadata?.slug || 'Untitled',
      type: d?.metadata?.type || 'unknown',
      snippet: (d?.metadata?.description || d?.content || '').replace(/\s+/g, ' ').slice(0, 400)
    }))
    const contextBlock = JSON.stringify(topDocs, null, 2)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4500) // 4.5s guard
    const model = process.env.CHAT_SUMMARY_MODEL || 'gpt-4o-mini'
    const prompt = `You are a learning assistant. The user asked: "${userMessage}".\nYou are given retrieved context items (JSON array) with possible relevant resources.\nCraft a concise, high-signal answer first (2-4 sentences) directly addressing the question *even if partial*, then provide at most 3 bullet key takeaways. Do not fabricate facts outside context. If context is too weak, acknowledge uncertainty briefly then extract any helpful foundational insight.\n\nContext:\n${contextBlock}`
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 320,
        messages: [
          { role: 'system', content: 'You produce precise, context-grounded educational summaries.' },
          { role: 'user', content: prompt }
        ]
      }),
      signal: controller.signal
    })
    clearTimeout(timeout)
    if (!res.ok) {
      return null
    }
    const data: any = await res.json()
    const content = data?.choices?.[0]?.message?.content?.trim()
    if (!content) return null
    return content
  } catch (err) {
    return null
  }
}

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

      let docs = await embMgr.similaritySearch(userMessage, { limit: similarityTopK, threshold: similarityThreshold })

      // Dynamic similarity pruning to remove barely-related noise (improves alignment with user query)
      docs = filterByDynamicSimilarity(docs, similarityThreshold)

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

        // Semantic summary attempt (LLM) with heuristic fallback
        let summary = await trySemanticSummary(userMessage, docs)
        if (!summary) {
          const heuristic = buildAnswerSummary(userMessage, docs)
            || `You asked about "${userMessage}". Relevant resources are listed below.`
          summary = heuristic
        }
        assistantText += `**Answer Summary**\n\n${summary}\n\n`

        // Build contextual response based on found content
        if (grouped.courses.length) {
          hasRelevantInfo = true
          assistantText += `### Related Courses\n\n`
          grouped.courses.slice(0, 3).forEach((c: any, i: number) => {
            const title = c.metadata?.title || 'Untitled Course'
            const description = c.metadata?.description || c.content || 'No description available'
            const slug = c.metadata?.slug
            const link = slug ? `${siteUrl}/courses/${slug}` : `${siteUrl}/dashboard/explore`
            assistantText += `- **${title}**: ${description.slice(0, 150)}\n  [View Course](${link})\n`
          })
          assistantText += '\n'
        }

        if (grouped.chapters.length) {
          hasRelevantInfo = true
          assistantText += `### Related Chapters\n\n`
          grouped.chapters.slice(0, 3).forEach((c: any, i: number) => {
            const title = c.metadata?.title || 'Untitled Chapter'
            const content = c.content || 'No content available'
            const unitId = c.metadata?.unitId
            const link = unitId ? `${siteUrl}/courses/unit/${unitId}` : `${siteUrl}/dashboard/explore`
            assistantText += `- **${title}**: ${content.slice(0, 120)}\n  [Study Chapter](${link})\n`
          })
          assistantText += '\n'
        }

        if (grouped.quizzes.length) {
          hasRelevantInfo = true
          assistantText += `### Practice Quizzes\n\n`
          grouped.quizzes.slice(0, 3).forEach((c: any, i: number) => {
            const title = c.metadata?.title || 'Untitled Quiz'
            const description = c.metadata?.description || 'Test your knowledge'
            const slug = c.metadata?.slug
            // Default to mcq if no specific quiz type is found
            const quizType = 'mcq'
            const link = slug ? `${siteUrl}/dashboard/${quizType}/${slug}` : `${siteUrl}/dashboard/quizzes`
            assistantText += `- **${title}**: ${description}\n  [Take Quiz](${link})\n`
          })
          assistantText += '\n'
        }

        if (grouped.flashcards.length) {
          hasRelevantInfo = true
          assistantText += `### Key Concepts\n\n`
          grouped.flashcards.slice(0, 4).forEach((c: any, i: number) => {
            const content = String(c.content).slice(0, 200)
            assistantText += `- ${content}\n`
          })
          assistantText += '\n'
        }

        if (hasRelevantInfo) {
          // Add contextual suggestion based on content type distribution
          if (grouped.quizzes.length > grouped.courses.length) {
            assistantText += `Practice might help reinforce these concepts.\n\n`
          } else if (grouped.courses.length > 0) {
            assistantText += `The courses above provide comprehensive coverage of this topic.\n\n`
          }
          assistantText += `---\n\n**Want More?**\n\n`
          assistantText += `- [Create Your Own Course](${siteUrl}/dashboard/create)\n`
          assistantText += `- [Create MCQ Quiz](${siteUrl}/dashboard/mcq)\n`
          assistantText += `- [Create Code Quiz](${siteUrl}/dashboard/code)\n`
          assistantText += `- [Explore Topics](${siteUrl}/dashboard/quizzes)`
        }

        const matches = docs.map((d: any) => ({
          id: d.id,
          type: d.metadata?.type,
          title: d.metadata?.title,
          description: d.metadata?.description,
          slug: d.metadata?.slug,
          link: d.metadata?.type === 'course' && d.metadata?.slug ? `${siteUrl}/courses/${d.metadata.slug}` :
                d.metadata?.type === 'quiz' && d.metadata?.slug ? `${siteUrl}/dashboard/mcq/${d.metadata.slug}` :
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
        let relaxedDocs = await embMgr.similaritySearch(userMessage, { 
          limit: relaxedTopK, 
          threshold: relaxedThreshold 
        })
        relaxedDocs = filterByDynamicSimilarity(relaxedDocs, relaxedThreshold)

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"
        
        if (relaxedDocs && relaxedDocs.length > 0) {
          // Found some content with relaxed parameters
          const relaxedGrouped = {
            courses: relaxedDocs.filter((d: any) => d.metadata?.type === 'course'),
            quizzes: relaxedDocs.filter((d: any) => d.metadata?.type === 'quiz'),
            chapters: relaxedDocs.filter((d: any) => d.metadata?.type === 'chapter')
          }

          let assistantText = `**Answer Attempt**\n\nI couldn't find direct high-confidence matches, but the following may relate to "${userMessage}":\n\n`

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
              // Default to mcq for all quizzes
              const quizType = 'mcq'
              const link = slug ? `${siteUrl}/dashboard/${quizType}/${slug}` : `${siteUrl}/dashboard/quizzes`
              assistantText += `• [${title}](${link})\n`
            })
            assistantText += '\n'
          }

          assistantText += `If this doesn't fully answer your question, you can:\n`
          assistantText += `• [Create a Custom Course](${siteUrl}/dashboard/create) on this topic\n`
          assistantText += `• [Create MCQ Quiz](${siteUrl}/dashboard/mcq)\n`
          assistantText += `• [Create Code Quiz](${siteUrl}/dashboard/code)\n`
          assistantText += `• [Explore Content](${siteUrl}/dashboard/quizzes)`

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
      assistantText += `**Create Your Own Content:**\n`
      assistantText += `• [Create MCQ Quiz](${siteUrl}/dashboard/mcq) - Multiple choice questions\n`
      assistantText += `• [Create Code Quiz](${siteUrl}/dashboard/code) - Programming challenges\n`
      assistantText += `• [Create Course](${siteUrl}/dashboard/create) - Build a comprehensive course on "${userMessage}"\n`
      assistantText += `• [Browse Quizzes](${siteUrl}/dashboard/quizzes) - Explore existing content\n\n`
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
      assistantText += `• [Browse Quizzes](${siteUrl}/dashboard/quizzes)\n`
      assistantText += `• [Create Course](${siteUrl}/dashboard/create)\n`
      assistantText += `• [Create MCQ Quiz](${siteUrl}/dashboard/mcq)\n`
      assistantText += `• [Create Code Quiz](${siteUrl}/dashboard/code)\n\n`
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