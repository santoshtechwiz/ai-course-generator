// app/api/chat/route.ts
import type { NextRequest } from 'next/server'
import path from 'path'
import { fileURLToPath } from 'url'

import { prisma } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { ChatMemoryManager } from '@/app/aimodel/chat/memory-manager'
import { ContextBuilder } from '@/app/aimodel/chat/context-builder'
import { EmbeddingManager } from '@/app/aimodel/core/embedding-manager'

/**
 * Production-ready chat POST handler.
 *
 * - Ensures DB-only answers or constructive suggestions.
 * - Rate-limits free users (env controlled).
 * - Spam prevention: identical user message within 5 minutes returns cached assistant reply.
 * - Persistence of messages into Prisma, and memory manager caching.
 */

/* ---------- Setup / singletons ---------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url))

let contextBuilder: ContextBuilder | null = null
const memoryManagers: Map<string, ChatMemoryManager> = new Map()

function getContextBuilder(): ContextBuilder {
  if (!contextBuilder) contextBuilder = new ContextBuilder()
  return contextBuilder
}

function getMemoryManager(userId: string): ChatMemoryManager {
  if (!memoryManagers.has(userId)) {
    memoryManagers.set(userId, new ChatMemoryManager(userId))
  }
  return memoryManagers.get(userId)!
}

/* ---------- Helpers ---------- */
function sanitizeHeaderValue(text?: string, maxLen = 200): string | undefined {
  if (!text) return undefined
  try {
    let s = String(text).replace(/\r?\n|\r/g, ' ')
    s = s.replace(/\s+/g, ' ').trim()
    s = s.replace(/[^\x20-\x7E]/g, '') // keep printable ASCII
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

/* ---------- Intent detectors ---------- */
const detectGenericSiteIntent = (text: string) => {
  const t = (text || '').toLowerCase()
  if (/enroll|enrol|sign up|how do i enroll|how to enroll|register/i.test(t)) return 'enroll'
  if (/payment|pay|pricing|price|cost|subscribe|subscription/i.test(t)) return 'payment'
  if (/refund|cancel order|cancel subscription/i.test(t)) return 'refund'
  if (/account|profile|login|sign in|sign-in|logout/i.test(t)) return 'account'
  if (/contact|support|help/i.test(t)) return 'contact'
  return null
}

const detectQuizIntent = (text: string) => {
  if (!text) return null
  let m = text.match(/(?:do you have|have you|is there|any)\s+(?:a\s+)?quiz\s+(?:on|about)\s+(.+)\??/i)
  if (m) return m[1].trim()
  m = text.match(/quiz\s*(?:on|:)\s*(.+)/i)
  if (m) return m[1].trim()
  return null
}

const detectCourseIntent = (text: string) =>
  /(?:course|courses|any course|courses on|find a course|do you have a course|course on)\b/i.test(text || '')

/* ---------- Environment config ---------- */
const FREE_USER_LIMIT = Number(process.env.FREE_USER_CHAT_LIMIT || '5') // per HOUR
const FREE_USER_WINDOW_MS = Number(process.env.FREE_USER_WINDOW_MS || String(60 * 60 * 1000)) // 1 hour default
const SPAM_DEDUP_WINDOW_MS = Number(process.env.SPAM_DEDUP_WINDOW_MS || String(5 * 60 * 1000)) // 5 minutes

/* ---------- POST handler ---------- */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const incomingMessages = body?.messages || body?.msgs || null
    const singleQuestion = body?.question || body?.message || ''

    // Auth
    const authSession = await getAuthSession()
    const userId = authSession?.user?.id
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (!userId && !isDevelopment) {
      return new Response('Unauthorized', { status: 401 })
    }
    const effectiveUserId = userId || 'test-user-dev'
    const sessionId = `user_${effectiveUserId}`

    // Extract user message
    let userMessage = ''
    if (incomingMessages && Array.isArray(incomingMessages) && incomingMessages.length > 0) {
      // find last user role message
      const lastUser = [...incomingMessages].slice().reverse().find((m: any) => m && (m.role === 'user' || m.role === 'User'))
      userMessage = lastUser?.content || ''
    } else {
      userMessage = String(singleQuestion || '').trim()
    }
    if (!userMessage || !userMessage.trim()) {
      return makeJsonResponse({ assistant: 'Please provide a question.' }, 400)
    }

    // memory manager instance
    const memoryMgr = getMemoryManager(effectiveUserId)

    // Generic site intents (quick replies)
    const genericIntent = detectGenericSiteIntent(userMessage)
    if (genericIntent) {
      let assistant = ''
      switch (genericIntent) {
        case 'enroll':
          assistant = `To enroll in a course on this site:\n1) Sign in to your account (/profile).\n2) Visit the course page (e.g. /course/<slug>) and click Enroll / Purchase.\n3) Follow the payment flow (Stripe) if required.\nIf you share the course title or slug I can provide a direct link.`
          break
        case 'payment':
          assistant = `For payments and billing: visit /account/billing-history or your Subscription page. You can find invoices and receipts there or contact support via /contact.`
          break
        case 'refund':
          assistant = `Refunds and cancellations are handled from your billing history or subscription page. Please provide order details on /contact if you need assistance.`
          break
        case 'account':
          assistant = `Account help: sign in at /auth. From /profile you can manage subscriptions and enrolled courses. If you cannot sign in, try password reset or contact support.`
          break
        case 'contact':
          assistant = `You can contact support via the Contact page (/contact). Provide details about your issue and we will respond.`
          break
        default:
          assistant = ''
      }

      if (assistant) {
        // persist assistant message & memory
        try {
          await memoryMgr.addMessage(sessionId, { role: 'assistant', content: assistant, id: `msg_${Date.now()}`, timestamp: Date.now() })
          await prisma.chatMessage.create({
            data: { userId: effectiveUserId, sessionId, role: 'assistant', content: assistant, metadata: { genericIntent }, count: 0 },
          })
        } catch (err) {
          logger.warn('Failed to persist generic intent assistant message', { error: err })
        }
        return makeJsonResponse({ assistant }, 200)
      }
    }

    /* ---------- Rate limiting (free users) ---------- */
    if (!isDevelopment) {
      try {
        const windowStart = new Date(Date.now() - FREE_USER_WINDOW_MS)
        const count = await prisma.chatMessage.count({
          where: { userId: effectiveUserId, role: 'user', createdAt: { gte: windowStart } },
        })
        const user = await prisma.user.findUnique({ where: { id: effectiveUserId }, include: { subscription: true } })
        const isSubscriber = !!user?.subscription
        if (!isSubscriber && count >= FREE_USER_LIMIT) {
          const msg = `You have reached the free limit of ${FREE_USER_LIMIT} questions per hour. Please upgrade for more.`
          await memoryMgr.addMessage(sessionId, { role: 'assistant', content: msg, id: `msg_${Date.now()}`, timestamp: Date.now() })
          await prisma.chatMessage.create({ data: { userId: effectiveUserId, sessionId, role: 'assistant', content: msg, metadata: { rateLimit: true }, count: 0 } })
          return makeJsonResponse({ assistant: msg }, 200)
        }
      } catch (err) {
        // don't block user if rate-limit check fails
        logger.error('Rate-limit check error', { error: err })
      }
    }

    /* ---------- Spam deduplication (IDENTICAL question within short window) ---------- */
    try {
      const recentUser = await prisma.chatMessage.findFirst({
        where: { userId: effectiveUserId, role: 'user', content: userMessage, createdAt: { gte: new Date(Date.now() - SPAM_DEDUP_WINDOW_MS) } },
        orderBy: { createdAt: 'desc' },
      })

      // If we find a previous identical user question within the dedup window,
      // return the most recent assistant reply for that session (if any).
      if (recentUser) {
        const cachedAssistant = await prisma.chatMessage.findFirst({
          where: { userId: effectiveUserId, sessionId, role: 'assistant' },
          orderBy: { createdAt: 'desc' },
        })
        if (cachedAssistant) {
          const reply = cachedAssistant.content
          // If the previous assistant reply included structured metadata (e.g. matches), return it too
          let extra: any = {}
          try {
            const md = (cachedAssistant as any).metadata || {}
            if (md && md.matches) extra.matches = md.matches
          } catch (e) {
            // ignore metadata parsing errors
          }
          await memoryMgr.addMessage(sessionId, { role: 'assistant', content: reply, id: `msg_${Date.now()}`, timestamp: Date.now() })
          return makeJsonResponse(Object.assign({ assistant: reply, cached: true }, extra), 200)
        }
      }
    } catch (err) {
      logger.warn('Spam deduplication lookup failed', { error: err })
    }

    /* ---------- Persist user message (after dedup check) ---------- */
    try {
      // Best-effort add to in-memory chat history and DB (do not fail request if DB persist fails)
      void memoryMgr.addMessage(sessionId, { role: 'user', content: userMessage, id: `msg_${Date.now()}`, timestamp: Date.now() })
      await prisma.chatMessage.create({ data: { userId: effectiveUserId, sessionId, role: 'user', content: userMessage, metadata: {}, count: 0 } })
    } catch (err) {
      logger.warn('Failed to persist user message', { error: err })
    }

    /* ---------- Quiz intent handling ---------- */
    const quizTopicRaw = detectQuizIntent(userMessage)
    if (quizTopicRaw) {
      const topic = quizTopicRaw.toLowerCase()
      try {
        // Parallelize independent queries and include related records to avoid N+1
        const [courseQuizzes, userQuizzes] = await Promise.all([
          prisma.courseQuiz.findMany({
            where: { question: { contains: topic, mode: 'insensitive' } },
            take: 20,
            // include chapter -> unit -> course to avoid per-item queries
            include: { chapter: { include: { unit: { include: { course: true } } } } },
          }),
          prisma.userQuiz.findMany({
            where: {
              OR: [
                { title: { contains: topic, mode: 'insensitive' } },
                { description: { contains: topic, mode: 'insensitive' } },
              ],
            },
            take: 20,
            // the relation name on UserQuiz for questions is `questions`
            include: { _count: { select: { questions: true } } },
          }),
        ])

        if ((courseQuizzes?.length || 0) + (userQuizzes?.length || 0) > 0) {
          const matches: any[] = []
          // For course-bound quizzes, include a link to the course/chapter where they belong
          for (const cq of courseQuizzes) {
            // Chapter and course unit were included above to avoid per-item queries
            let courseLink = null
            const chapter = (cq as any).chapter
            if (chapter?.course) {
              courseLink = `/dashboard/course/${chapter.course.slug}#chapter-${chapter.id}`
            } else if (chapter) {
              courseLink = `/dashboard/course/${chapter.id}`
            }
            matches.push({ source: 'course', id: cq.id, title: `Quiz from chapter ${cq.chapterId}`, link: courseLink, snippet: cq.question })
          }

          // For user-created quizzes use slug-based dashboard links
          for (const uq of userQuizzes) {
            // We included a question count above to avoid per-item question queries
            const link = uq.slug ? `/dashboard/quiz/${uq.slug}` : null
            const questionCount = (uq as any)?._count?.questions ?? null
            matches.push({ source: 'user', id: uq.id, title: uq.title, quizType: uq.quizType, link, questionCount })
          }

          const assistant = `Found ${matches.length} matching quiz(es) for "${quizTopicRaw}". I can open any of these for you:`
          await memoryMgr.addMessage(sessionId, { role: 'assistant', content: assistant, id: `msg_${Date.now()}`, timestamp: Date.now() })
          await prisma.chatMessage.create({ data: { userId: effectiveUserId, sessionId, role: 'assistant', content: assistant, metadata: { quizSearch: true, matches }, count: 0 } })
          return makeJsonResponse({ assistant, matches }, 200)
        }

        // No quizzes found — suggest formats and offer to generate templates
        const suggestions = `I couldn't find an existing quiz on "${quizTopicRaw}" in our database. Suggested quiz formats:\n- Multiple-choice (MCQ)\n- Coding exercise (with unit tests)\n- Fill-in-the-blank\n- True/False\n- Short answer / open-ended\n\nIf you'd like, I can generate a template quiz in one of these formats and store it for you.`
        await memoryMgr.addMessage(sessionId, { role: 'assistant', content: suggestions, id: `msg_${Date.now()}`, timestamp: Date.now() })
        await prisma.chatMessage.create({ data: { userId: effectiveUserId, sessionId, role: 'assistant', content: suggestions, metadata: { suggestion: true }, count: 0 } })
        return makeJsonResponse({ assistant: suggestions }, 200)
      } catch (err) {
        logger.error('Quiz lookup failed', { error: err })
        // fall through to general DB search fallback below
      }
    }

    /* ---------- Course-specific quick search ---------- */
    if (detectCourseIntent(userMessage)) {
      try {
        const q = userMessage
        const courses = await prisma.course.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 10,
        })
        if (courses && courses.length > 0) {
          const results = { courses: courses.map((c: any) => ({ id: c.id, title: c.title, slug: c.slug, description: c.description })) }
          const assistant = `I found the following courses related to "${userMessage}":\n\n${JSON.stringify(results, null, 2)}`
          await memoryMgr.addMessage(sessionId, { role: 'assistant', content: assistant, id: `msg_${Date.now()}`, timestamp: Date.now() })
          await prisma.chatMessage.create({ data: { userId: effectiveUserId, sessionId, role: 'assistant', content: assistant, metadata: { courseSearch: true }, count: 0 } })
          return makeJsonResponse({ assistant, results }, 200)
        }
        // else continue to embedding/text fallback
      } catch (err) {
        logger.warn('Course search failed', { error: err })
      }
    }

    /* ---------- Embedding vector search (optional) ---------- */
    const useEmbeddings = process.env.ENABLE_EMBEDDINGS === '1' || process.env.ENABLE_EMBEDDINGS === 'true'
    const similarityThreshold = Number(process.env.EMBEDDING_SIMILARITY_THRESHOLD || '0.6')
    const similarityTopK = Number(process.env.EMBEDDING_TOP_K || '8')

    if (useEmbeddings) {
      try {
        const embMgr = new EmbeddingManager()
        await embMgr.initialize()
        const docs = await embMgr.similaritySearch(userMessage, { limit: similarityTopK, threshold: similarityThreshold })
        if (docs && docs.length > 0) {
          const matches = docs.map(d => ({ id: d.id, type: d.metadata?.type || d.metadata?.contentType || 'unknown', content: d.content, similarity: d.similarity, title: d.metadata?.title, slug: d.metadata?.slug }))
          const assistant = `Relevant content from database:\n\n${matches.map(m => `- [${m.type}] score=${(m.similarity || 0).toFixed(3)} ${m.title ? `title=${m.title}` : ''} ${m.slug ? `slug=${m.slug}` : ''} ${String(m.content).slice(0, 300)}`).join('\n')}`
          await memoryMgr.addMessage(sessionId, { role: 'assistant', content: assistant, id: `msg_${Date.now()}`, timestamp: Date.now() })
          await prisma.chatMessage.create({ data: { userId: effectiveUserId, sessionId, role: 'assistant', content: assistant, metadata: { vectorMatch: true }, count: 0 } })
          return makeJsonResponse({ assistant, matches }, 200)
        }
      } catch (err) {
        logger.warn('Embedding manager search failed, falling back to text search', { error: err })
      }
    }

    /* ---------- Generic DB text search fallback ---------- */
    try {
      const q = userMessage
      const [courses, chapters, flashcards] = await Promise.all([
        prisma.course.findMany({ where: { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] }, take: 5 }),
        prisma.chapter.findMany({ where: { title: { contains: q, mode: 'insensitive' } }, take: 5 }),
        prisma.flashCard.findMany({ where: { question: { contains: q, mode: 'insensitive' } }, take: 5 }),
      ])

      const results = {
        courses: (courses || []).map((c: any) => ({ id: c.id, title: c.title, slug: c.slug })),
        chapters: (chapters || []).map((ch: any) => ({ id: ch.id, title: ch.title, unitId: ch.unitId })),
        flashcards: (flashcards || []).map((f: any) => ({ id: f.id, question: f.question, answer: f.answer })),
      }

      let assistant = ''
      if (results.courses.length || results.chapters.length || results.flashcards.length) {
        assistant = `I found the following items in the site database related to "${userMessage}":\n\n`
        if (results.courses.length) assistant += `Courses:\n${results.courses.map(c => `- ${c.title}: /course/${c.slug}`).join('\n')}\n\n`
        if (results.chapters.length) assistant += `Chapters:\n${results.chapters.map(ch => `- ${ch.title} (Unit ${ch.unitId})`).join('\n')}\n\n`
        if (results.flashcards.length) assistant += `Flashcards:\n${results.flashcards.map(f => `- ${f.question}`).join('\n')}\n\n`
      } else {
        assistant = `I can only answer using content from this site's database. I couldn't find anything matching "${userMessage}".\n\nWould you like to create a course or quiz on this topic? Visit /create-course or /create-quiz to get started.`
      }

      await memoryMgr.addMessage(sessionId, { role: 'assistant', content: assistant, id: `msg_${Date.now()}`, timestamp: Date.now() })
      await prisma.chatMessage.create({ data: { userId: effectiveUserId, sessionId, role: 'assistant', content: assistant, metadata: {}, count: 0 } })
      return makeJsonResponse({ assistant, results }, 200)
    } catch (err) {
      logger.error('DB search failed', { error: err })
      if (process.env.NODE_ENV !== 'production') {
        return new Response(JSON.stringify({ error: String((err as any)?.message || err), stack: (err as any)?.stack || null }, null, 2), { status: 500, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response('Internal DB search error', { status: 500 })
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
export default POST
