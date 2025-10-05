// app/aimodel/core/embedding-manager.ts
import { PrismaClient, Prisma } from '@prisma/client'
import { OpenAIEmbeddings } from '@langchain/openai'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

const prisma = new PrismaClient()

/**
 * EmbeddingManager — JSON-only, production-ready
 * - DOES NOT auto-embed or backfill on init
 * - Provides backfillMissingEmbeddings(...) for explicit admin usage
 * - Filters out null embeddings in application code (safer than DB queries)
 * - Minimal logging (info + warn + error)
 */
export class EmbeddingManager {
  private embeddings: OpenAIEmbeddings
  private initialized = false

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
    })
  }

  async initialize() {
    if (this.initialized) return
    this.initialized = true
    logger.info('[EmbeddingManager] Initialized (JSON-only mode)')
    // IMPORTANT: do NOT call any backfill/embedding-all logic here.
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0
    const dot = a.reduce((s, v, i) => s + v * b[i], 0)
    const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0))
    const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0))
    return magA && magB ? dot / (magA * magB) : 0
  }

  /** Upsert small batch of docs (explicit, not automatic). */
  async processBatch(docs: { id?: string; content: string; metadata?: any; type?: string }[]) {
    await this.initialize()
    for (const doc of docs) {
      try {
        const embedding = await this.embeddings.embedQuery(doc.content)
        const id = doc.id || crypto.randomUUID()
        await prisma.embedding.upsert({
          where: { id },
          create: {
            id,
            content: doc.content,
            embeddingJson: embedding,
            embedding,
            metadata: doc.metadata || {},
            type: doc.type || 'unknown'
          },
          update: {
            content: doc.content,
            embeddingJson: embedding,
            embedding,
            metadata: doc.metadata || {},
            type: doc.type || 'unknown'
          }
        })
      } catch (err) {
        logger.warn('[EmbeddingManager] processBatch embed failed', { error: (err as any)?.message })
      }
    }
  }

  /** Update one row */
  async updateDocument(id: string, content: string, metadata: any = {}) {
    await this.initialize()
    const embedding = await this.embeddings.embedQuery(content)
    await prisma.embedding.update({
      where: { id },
      data: { content, embeddingJson: embedding, embedding, metadata }
    })
  }

  async deleteDocument(id: string) {
    await this.initialize()
    await prisma.embedding.delete({ where: { id } }).catch(() => null)
  }

  async clearAll() {
    await this.initialize()
    await prisma.embedding.deleteMany({})
  }

  /**
   * Controlled backfill for missing embeddings.
   * - Only runs when explicitly called (admin endpoint / cron).
   * - Processes DB rows where embeddingJson is null (DbNull or JsonNull) in batches.
   * - Safe concurrency and limited batch size.
   */
  async backfillMissingEmbeddings(options?: { batchSize?: number; concurrency?: number }) {
    await this.initialize()
    const batchSize = options?.batchSize ?? 100
    const concurrency = Math.max(1, Math.min(16, options?.concurrency ?? 4))

    // helper to call embedDocuments if available, otherwise fallback to individual calls
    const embedMany = async (texts: string[]) => {
      // LangChain OpenAIEmbeddings may implement embedDocuments; use if available
      const anyEmb = this.embeddings as any
      if (typeof anyEmb.embedDocuments === 'function') {
        return (await anyEmb.embedDocuments(texts)) as number[][]
      }
      // fallback: sequential mapping (slower)
      const out: number[][] = []
      for (const t of texts) {
        out.push(await this.embeddings.embedQuery(t))
      }
      return out
    }

    let round = 0
    while (true) {
      round++
      const rows = await prisma.embedding.findMany({
        where: {},
        take: batchSize,
        select: { id: true, content: true, embeddingJson: true }
      })

      // Filter out rows that already have embeddings
      const rowsToProcess = rows.filter(row => row.embeddingJson === null)

      if (!rowsToProcess || rowsToProcess.length === 0) {
        logger.info('[EmbeddingManager] backfill complete (no more missing rows)')
        break
      }

      const texts = rowsToProcess.map(r => r.content || '')
      let vectors: number[][]
      try {
        vectors = await embedMany(texts)
      } catch (err) {
        logger.error('[EmbeddingManager] backfill failed to compute embeddings', { error: (err as any)?.message })
        // break to avoid tight loop on repeated failures
        break
      }

      // write updates in small concurrent chunks
      for (let i = 0; i < rowsToProcess.length; i += concurrency) {
        const slice = rowsToProcess.slice(i, i + concurrency)
        const promises = slice.map((row, j) => {
          const vec = vectors[i + j]
          if (!Array.isArray(vec)) return Promise.resolve(null)
          return prisma.embedding.update({
            where: { id: row.id },
            data: { embeddingJson: vec, embedding: vec }
          }).catch(err => {
            logger.warn('[EmbeddingManager] backfill update failed for id', { id: row.id, error: (err as any)?.message })
            return null
          })
        })
        await Promise.all(promises)
      }

      logger.info(`[EmbeddingManager] backfill processed ${rowsToProcess.length} rows (round ${round})`)
      // loop again to fetch next batch
    }
  }

  /** Search by text */
  async similaritySearch(
    query: string,
    opts: { limit?: number; threshold?: number; filter?: any } = {}
  ) {
    await this.initialize()
    const { limit = 12, threshold = Number(process.env.EMBEDDING_SIMILARITY_THRESHOLD || 0.1), filter = {} } = opts
    const queryVec = await this.embeddings.embedQuery(query)

    const where: Prisma.EmbeddingWhereInput = filter.type ? { type: filter.type } : {}

    const candidates = await prisma.embedding.findMany({
      where,
      take: Math.max(limit * 5, 200),
      select: { id: true, content: true, embeddingJson: true, metadata: true, type: true }
    })

    const scored = candidates
      .map(c => {
        const vec = c.embeddingJson as number[] | null
        if (!Array.isArray(vec) || vec === null) return null
        return { ...c, similarity: this.cosineSimilarity(queryVec, vec) }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.similarity - a.similarity)

    return scored.filter(s => s.similarity >= threshold).slice(0, limit)
  }

  /** Search by vector (precomputed) */
  async similaritySearchVector(vec: number[], opts: { limit?: number; threshold?: number; filter?: any } = {}) {
    await this.initialize()
    const { limit = 12, threshold = Number(process.env.EMBEDDING_SIMILARITY_THRESHOLD || 0.1), filter = {} } = opts

    const where: Prisma.EmbeddingWhereInput = filter.type ? { type: filter.type } : {}

    const candidates = await prisma.embedding.findMany({
      where,
      take: Math.max(limit * 5, 200),
      select: { id: true, content: true, embeddingJson: true, metadata: true, type: true }
    })

    const scored = candidates
      .map(c => {
        const vec2 = c.embeddingJson as number[] | null
        if (!Array.isArray(vec2) || vec2 === null) return null
        return { ...c, similarity: this.cosineSimilarity(vec, vec2) }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.similarity - a.similarity)

    return scored.filter(s => s.similarity >= threshold).slice(0, limit)
  }
}
