// route.ts - Production-ready optimized Chat endpoint for CourseAI
import type { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { ChatMemoryManager } from '@/app/aimodel/chat/memory-manager'
import { EmbeddingManager } from '@/app/aimodel/core/embedding-manager'
import crypto from 'crypto'

/**
 * Key design decisions implemented:
 * - EmbeddingManager singleton
 * - Memory map with LRU / TTL cleanup
 * - Minimal teacher-style system prompt (token efficient)
 * - Adaptive vector search (avoid double queries unless necessary)
 * - Caching of semantic summaries by hash of (query + topDocIDs)
 * - Small OpenAI timeout (3s) and smaller max_tokens (250)
 * - Off-topic heuristic to save embeddings/tokens
 * - Defensive coding in case ChatMemoryManager lacks convenience methods
 */

/* ----------------------------- Config ----------------------------- */
const MAX_MEMORY_ENTRIES = Number(process.env.CHAT_MEM_MAX_ENTRIES || '300')
const MEMORY_TTL_MS = Number(process.env.CHAT_MEM_TTL_MS || String(15 * 60 * 1000)) // 15m default
const SUMMARY_CACHE_TTL_MS = Number(process.env.SUMMARY_CACHE_TTL_MS || String(60 * 60 * 1000)) // 1h
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || '3000') // 3s
const OPENAI_MODEL = process.env.CHAT_SUMMARY_MODEL || 'gpt-4o-mini'
const MAX_SUMMARY_TOKENS = Number(process.env.CHAT_MAX_TOKENS || '250')
const SIMILARITY_THRESHOLD = Number(process.env.EMBEDDING_SIMILARITY_THRESHOLD || '0.1')
const SIMILARITY_TOP_K = Number(process.env.EMBEDDING_TOP_K || '12')
const ENABLE_DEBUG = Boolean(process.env.EMBEDDING_DEBUG === '1' || process.env.NODE_ENV !== 'production')

/* ---------------------- Singleton: EmbeddingManager ---------------------- */
let globalEmbeddingMgr: EmbeddingManager | null = null
async function getEmbeddingManagerSingleton(): Promise<EmbeddingManager> {
  if (globalEmbeddingMgr) return globalEmbeddingMgr
  globalEmbeddingMgr = new EmbeddingManager()
  try {
    // initialize may be async and could throw; keep it awaited once
    if (typeof globalEmbeddingMgr.initialize === 'function') {
      // don't block too long during cold start; let it finish normally
      await globalEmbeddingMgr.initialize()
    }
  } catch (err) {
    logger.error('EmbeddingManager initialization failed', { error: err })
    throw err
  }
  return globalEmbeddingMgr
}

/* ------------------ Memory managers with LRU + TTL cleanup ------------------ */
/**
 * value: { mgr: ChatMemoryManager, lastUsed: number, cache: Map<string, { val, expires }>}
 * we keep a small in-memory summary cache per user for token reuse
 */
const memoryMap = new Map<
  string,
  { mgr: ChatMemoryManager; lastUsed: number; summaryCache: Map<string, { val: string; expires: number }> }
>()

function cleanupMemoryMap() {
  const now = Date.now()
  if (memoryMap.size <= MAX_MEMORY_ENTRIES) return
  for (const [key, meta] of memoryMap) {
    if (now - meta.lastUsed > MEMORY_TTL_MS) memoryMap.delete(key)
    if (memoryMap.size <= MAX_MEMORY_ENTRIES) break
  }
}

function getMemoryManager(userId: string) {
  const now = Date.now()
  const found = memoryMap.get(userId)
  if (found) {
    found.lastUsed = now
    return found
  }
  // create
  const mgr = new ChatMemoryManager(userId)
  const entry = { mgr, lastUsed: now, summaryCache: new Map() }
  memoryMap.set(userId, entry)
  cleanupMemoryMap()
  return entry
}

/* ------------------ Helpers ------------------ */
function makeJsonResponse(obj: any, status = 200) {
  const body = JSON.stringify(obj)
  return new Response(body, { status, headers: { 'Content-Type': 'application/json' } })
}

function sanitizeShort(text?: string, max = 180) {
  if (!text) return undefined
  let s = String(text).replace(/\s+/g, ' ').slice(0, max)
  return s || undefined
}

function hashKey(input: string) {
  return crypto.createHash('sha1').update(input).digest('hex')
}

/* ------------------ Off-topic heuristic ------------------ */
/**
 * Lightweight regex to check if user message likely pertains to platform topics.
 * This prevents running expensive lookups for casual small talk.
 */
function isLikelyCourseAiQuestion(text: string) {
  if (!text) return false
  // include plural/singular, basic synonyms
  const re = /\b(course|quiz|quizzes|subscription|lesson|chapter|flashcard|topic|lesson|code quiz|mcq|progress|certificate|enroll|enrol|module|unit|courseai)\b/i
  return re.test(text)
}

/* ------------------ Semantic Summary (OpenAI) ------------------ */
async function trySemanticSummary(userMessage: string, topDocsSummary: { id: string; title?: string; snippet?: string }[]): Promise<string | null> {
  // token-cost conscious: only call when we have something to summarize
  if (!process.env.OPENAI_API_KEY) return null
  if (!topDocsSummary || topDocsSummary.length === 0) return null

  // Build a concise context block: only send title + 100 char snippet per doc
  const contextBlock = topDocsSummary
    .slice(0, 5)
    .map(d => `- ${sanitizeShort(d.title || 'Untitled', 80)}: ${sanitizeShort(d.snippet || '', 120)}`)
    .join('\n')

  const systemPrompt = `
You are CourseAI Mentor — a friendly, concise teacher for the CourseAI learning platform.
- Speak like a tutor: clear, short (2-3 sentences), helpful.
- Answer using ONLY the context provided. If context doesn't contain the answer, say "I don't have specific info about that" and suggest browsing courses or quizzes.
- Keep the reply short; avoid verbosity.
`.trim()

  const userPrompt = `User question: "${sanitizeShort(userMessage, 300)}"

Retrieved resources:
${contextBlock}

Provide a concise answer (max 2-3 sentences). If relevant, list up to 3 resources by title only.`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.25,
        max_tokens: MAX_SUMMARY_TOKENS,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      }),
      signal: controller.signal
    })
    clearTimeout(timeout)
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      logger.warn('OpenAI responded non-OK', { status: res.status, text: sanitizeShort(txt, 400) })
      return null
    }
    const data = await res.json().catch(() => null)
    const content = data?.choices?.[0]?.message?.content?.trim()
    return content || null
  } catch (err) {
    if ((err as any)?.name === 'AbortError') {
      logger.warn('OpenAI request aborted due to timeout')
    } else {
      logger.warn('OpenAI request failed', { error: (err as any)?.message || err })
    }
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/* ------------------ Dynamic similarity filter (same as before, but defensive) ------------------ */
function filterByDynamicSimilarity(docs: any[], baseThreshold: number) {
  if (!docs || docs.length === 0) return []
  const sorted = [...docs].sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
  const topSim = sorted[0].similarity || 0
  const dynamicFloor = Math.max(baseThreshold, topSim * 0.65)
  return sorted.filter(d => (d.similarity || 0) >= dynamicFloor && (topSim - (d.similarity || 0)) <= 0.22)
}

/* ------------------ Route Handler ------------------ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const incomingMessages = body?.messages || body?.msgs || null
    const singleQuestion = String(body?.question || body?.message || '').trim()

    const authSession = await getAuthSession()
    const userId = authSession?.user?.id
    const isDev = process.env.NODE_ENV !== 'production'
    if (!userId && !isDev) return new Response('Unauthorized', { status: 401 })
    const effectiveUserId = userId || 'guest-dev-user'
    const sessionId = `user_${effectiveUserId}`

    // Extract last user message
    let userMessage = ''
    if (incomingMessages && Array.isArray(incomingMessages) && incomingMessages.length) {
      // find last message with role user (defensive)
      const lastUser = [...incomingMessages].reverse().find((m: any) => m && /user/i.test(String(m.role || '')))
      userMessage = (lastUser?.content || singleQuestion || '').trim()
    } else {
      userMessage = singleQuestion
    }
    if (!userMessage) return makeJsonResponse({ assistant: 'Please provide a question.' }, 400)

    // Off-topic quick filter to save tokens
    if (!isLikelyCourseAiQuestion(userMessage)) {
      return makeJsonResponse({
        assistant: `I'm here to help with CourseAI courses, quizzes, and subscriptions. What would you like to learn on CourseAI today?`
      }, 200)
    }

    // Acquire memory manager (with per-user summary cache)
    const memEntry = getMemoryManager(effectiveUserId)
    const memoryMgr = memEntry.mgr

    // Try to reuse a cached summary (by short-circuit): cache key uses userMessage + empty placeholder for doc ids later
    // We'll compute a proper cache key after we have top docs; this early check helps nothing now, so skip

    // Prepare embedding manager
    const embMgr = await getEmbeddingManagerSingleton()

    // Basic similarity search (single call) - be conservative with topK & threshold
    let docs = await embMgr.similaritySearch(userMessage, { limit: SIMILARITY_TOP_K, threshold: SIMILARITY_THRESHOLD }).catch((err: any) => {
      logger.error('similaritySearch failed', { error: err?.message || err })
      return []
    })

    // If we got very little, run an adaptive relaxed search (but only if necessary)
    if (!docs || docs.length < 2) {
      try {
        const relaxedTopK = Math.min(50, SIMILARITY_TOP_K * 2)
        const relaxedThreshold = Math.max(0.35, SIMILARITY_THRESHOLD - 0.2)
        const relaxed = await embMgr.similaritySearch(userMessage, { limit: relaxedTopK, threshold: relaxedThreshold })
        docs = (relaxed && relaxed.length > (docs?.length || 0)) ? relaxed : docs
      } catch (err) {
        logger.warn('Relaxed vector search failed', { error: (err as any)?.message || err })
      }
    }

    // Defensive: make sure docs is an array
    docs = Array.isArray(docs) ? docs : []

    // Dynamic filter to remove noise
    docs = filterByDynamicSimilarity(docs, SIMILARITY_THRESHOLD)

    // Build lightweight doc summaries for caching and LLM prompt
    const topDocsSummary = docs.slice(0, 5).map((d: any) => ({
      id: String(d.id || d.metadata?.id || ''),
      title: d.metadata?.title || d.metadata?.slug || 'Untitled',
      snippet: (d.metadata?.description || d.content || '').replace(/\s+/g, ' ').slice(0, 200)
    }))

    // Compute a cache key for this (question + doc ids)
    const topDocIds = topDocsSummary.map(d => d.id).join(',')
    const cacheKey = hashKey(userMessage + '||' + topDocIds)

    // Look up cached summary (per-user cache)
    const cached = memEntry.summaryCache.get(cacheKey)
    if (cached && cached.expires > Date.now()) {
      const assistantText = cached.val
      // add to memory for continuity (best-effort)
      try { if (typeof memoryMgr.addMessage === 'function') await memoryMgr.addMessage(sessionId, { role: 'assistant', content: assistantText, id: `msg_${Date.now()}`, timestamp: Date.now() }) } catch {}
      return makeJsonResponse({ assistant: assistantText, matches: docs.map(d => ({ id: d.id, title: d.metadata?.title, similarity: d.similarity })) }, 200)
    }

    // Build assistant text with either an LLM summary or a heuristic short summary
    let assistantText = ''
    let semantic = null
    try {
      semantic = await trySemanticSummary(userMessage, topDocsSummary)
    } catch (err) {
      logger.warn('Semantic summary generation failed', { error: (err as any)?.message || err })
      semantic = null
    }

    // If semantic summary present, use it, otherwise fall back to heuristic builder
    if (semantic) {
      assistantText = `**Answer**\n\n${semantic}\n\n`
    } else {
      // Heuristic short summary (token-friendly)
      const distinctTitles = Array.from(new Set(topDocsSummary.map(d => d.title))).slice(0, 3)
      let primarySnippet = topDocsSummary[0]?.snippet || ''
      primarySnippet = primarySnippet.slice(0, 220)
      assistantText = `**Answer**\n\nYou asked: "${userMessage}".\n\n`
      if (distinctTitles.length) assistantText += `I found resources: ${distinctTitles.map(t => `“${t}”`).join(', ')}.\n\n`
      if (primarySnippet) assistantText += `${primarySnippet}${primarySnippet.length >= 220 ? '…' : ''}\n\n`
      assistantText += `**Next steps:**\n• [Browse Courses](/dashboard/courses)\n• [Try a Quiz](/dashboard/quizzes)\n`
    }

    // Append short structured matches (for client to show inline)
    const matches = docs.slice(0, 12).map((d: any) => ({
      id: d.id,
      type: d.metadata?.type,
      title: d.metadata?.title,
      slug: d.metadata?.slug,
      similarity: d.similarity
    }))

    // Persist assistant message to memory (best-effort)
    try {
      if (typeof memoryMgr.addMessage === 'function') {
        await memoryMgr.addMessage(sessionId, { role: 'assistant', content: assistantText, id: `msg_${Date.now()}`, timestamp: Date.now() })
      }
    } catch (err) {
      logger.warn('memoryMgr.addMessage failed', { error: (err as any)?.message || err })
    }

    // Cache semantic/heuristic summary for this user for a TTL
    try {
      memEntry.summaryCache.set(cacheKey, { val: assistantText, expires: Date.now() + SUMMARY_CACHE_TTL_MS })
      // optional: evict old cache entries (keep map small)
      if (memEntry.summaryCache.size > 200) {
        // simple eviction of oldest
        const entries = Array.from(memEntry.summaryCache.entries())
        entries.sort((a, b) => (a[1].expires - b[1].expires))
        for (let i = 0; i < entries.length - 150; i++) memEntry.summaryCache.delete(entries[i][0])
      }
    } catch (err) {
      // non-fatal
      logger.warn('Failed to set summary cache', { error: (err as any)?.message || err })
    }

    // Return debug info only when ENABLE_DEBUG
    if (ENABLE_DEBUG) {
      return makeJsonResponse({
        assistant: assistantText,
        matches,
        debug: {
          thresholdUsed: SIMILARITY_THRESHOLD,
          topK: SIMILARITY_TOP_K,
          totalMatches: docs.length,
          topDocIds
        }
      }, 200)
    }

    return makeJsonResponse({ assistant: assistantText, matches }, 200)
  } catch (error) {
    logger.error('Chat API error', { error: (error as any)?.message || error })
    if (process.env.NODE_ENV !== 'production') {
      const body = { error: String((error as any)?.message || error), stack: (error as any)?.stack || null }
      return new Response(JSON.stringify(body, null, 2), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
    return new Response('Internal Server Error', { status: 500 })
  }
}
