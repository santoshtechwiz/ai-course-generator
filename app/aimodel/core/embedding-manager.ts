/**
 * Embedding Manager
 * 
 * Handles vector embeddings using PostgreSQL with pgvector extension or in-memory storage.
 * Provides local vector storage and similarity search capabilities.
 * 
 * Feature Flag: Use EMBEDDING_STORAGE_MODE environment variable to control storage:
 * - 'postgres': Force PostgreSQL with pgvector (throws error if unavailable)
 * - 'memory': Force in-memory storage
 * - 'auto' or unset: Auto-detect pgvector, fallback to in-memory
 */

import { OpenAIEmbeddings } from "@langchain/openai"
import { Document } from "langchain/document"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import prisma from "@/lib/db"
import { logger } from "@/lib/logger"

export interface EmbeddingDocument {
  id?: string
  content: string
  metadata: Record<string, any>
  embedding?: number[]
  similarity?: number
}

export interface SearchOptions {
  limit?: number
  threshold?: number
  filter?: Record<string, any>
}

export interface EmbeddingConfig {
  openaiApiKey: string
  model: string
  dimensions: number
  batchSize: number
}

export class EmbeddingManager {
  private embeddings: OpenAIEmbeddings
  private config: EmbeddingConfig
  private isInitialized: boolean = false
  private isPgVectorAvailable: boolean = false
  private memoryStore: MemoryVectorStore | null = null
  private inMemoryDocuments: Map<string, EmbeddingDocument> = new Map()
  private storageMode: 'postgres' | 'memory' | 'auto' = 'auto'

  constructor(config?: Partial<EmbeddingConfig>) {
    this.config = {
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      model: 'text-embedding-3-small',
      dimensions: 1536,
      batchSize: 100,
      ...config
    }

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.config.openaiApiKey,
      modelName: this.config.model,
    })

    // Read storage mode from environment variable
    const mode = process.env.EMBEDDING_STORAGE_MODE?.toLowerCase()
    if (mode === 'postgres' || mode === 'memory' || mode === 'auto') {
      this.storageMode = mode
    } else if (mode) {
      logger.warn(`Invalid EMBEDDING_STORAGE_MODE: ${mode}. Using 'auto' mode.`)
    }
  }

  /**
   * Initialize the embedding manager and ensure database schema
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      if (this.storageMode === 'memory') {
        // Force memory mode
        this.isPgVectorAvailable = false
        await this.initializeMemoryStore()
      } else if (this.storageMode === 'postgres') {
        // Force postgres mode
        await this.tryInitializePgVector()
        if (!this.isPgVectorAvailable) {
          throw new Error('PostgreSQL with pgvector is required but not available. Please ensure pgvector extension is installed.')
        }
      } else {
        // Auto mode: try pgvector first, fallback to memory
        await this.tryInitializePgVector()
        
        if (!this.isPgVectorAvailable) {
          await this.initializeMemoryStore()
        }
      }
      
      this.isInitialized = true
      logger.info(`Embedding Manager initialized successfully (${this.isPgVectorAvailable ? 'pgvector' : 'memory'} mode, storage mode: ${this.storageMode})`)
    } catch (error) {
      logger.error('Failed to initialize Embedding Manager', { error })
      throw error
    }
  }

  /**
   * Try to initialize with optional pgvector support
   */
  private async tryInitializePgVector(): Promise<void> {
    try {
      // First check if the basic Embedding model works
      await this.checkExistingEmbeddingModel()
      
      // Then try to enable pgvector as an optional enhancement
      const pgVectorEnabled = await this.enablePgVectorIfAvailable()
      
      // Check if the embedding column is correctly typed as vector
      let isVectorColumn = false
      if (pgVectorEnabled) {
        try {
          const columnCheck = await prisma.$queryRaw`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Embedding' 
            AND column_name = 'embedding'
          `;
          
          const columnType = Array.isArray(columnCheck) && columnCheck.length > 0 
            ? (columnCheck[0] as any).data_type 
            : null;
          
          logger.info(`Embedding column type detected: ${columnType}`);
          isVectorColumn = columnType === 'vector';
          
          if (!isVectorColumn) {
            logger.warn('PgVector extension is available but embedding column is not vector type');
          }
        } catch (error) {
          logger.warn('Failed to check column type, assuming not vector type', { error });
          isVectorColumn = false;
        }
      }
      
      this.isPgVectorAvailable = pgVectorEnabled && isVectorColumn;
      logger.info(`Embedding manager initialized successfully (${this.isPgVectorAvailable ? 'with pgvector' : 'standard mode'})`)
    } catch (error) {
      logger.warn('Database embedding not available, falling back to memory store', { error })
      this.isPgVectorAvailable = false
    }
  }

  /**
   * Try to enable pgvector extension if available
   */
  private async enablePgVectorIfAvailable(): Promise<boolean> {
    try {
      // Try to create the extension if it doesn't exist
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`
      
      // Test if vector operations work
      await prisma.$executeRaw`SELECT '[1,2,3]'::vector <-> '[1,2,3]'::vector`
      
      // If we get here, pgvector is available
      logger.info('pgvector extension is available - enhanced similarity search enabled')
      
      // Test vector operations work
      const testResult = await prisma.$queryRaw`SELECT '[1,2,3]'::vector <-> '[1,2,3]'::vector as distance`
      logger.info('pgvector test successful', { testResult })
      
      return true
    } catch (error) {
      // pgvector not available - that's fine, we'll use string storage
      logger.info('pgvector extension not available - using standard similarity search', { 
        errorMessage: error instanceof Error ? error.message : String(error) 
      })
      return false
    }
  }

  /**
   * Check if existing Embedding model is accessible
   */
  private async checkExistingEmbeddingModel(): Promise<void> {
    try {
      // Try to count existing embeddings to test model access
      const count = await prisma.embedding.count()
      logger.info(`Found ${count} existing embeddings in database`)
    } catch (error) {
      logger.error('Cannot access Embedding model', { error })
      throw error
    }
  }

  /**
   * Initialize in-memory vector store
   */
  private async initializeMemoryStore(): Promise<void> {
    try {
      this.memoryStore = new MemoryVectorStore(this.embeddings)
      logger.info('Memory vector store initialized')
    } catch (error) {
      logger.error('Failed to initialize memory store', { error })
      throw error
    }
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(documents: EmbeddingDocument[]): Promise<string[]> {
    await this.initialize()

    // Use memory store if pgvector is not available
    if (!this.isPgVectorAvailable && this.memoryStore) {
      return await this.addDocumentsToMemory(documents)
    }

    const ids: string[] = []
    
    // Process documents in batches for Prisma
    for (let i = 0; i < documents.length; i += this.config.batchSize) {
      const batch = documents.slice(i, i + this.config.batchSize)
      const batchIds = await this.processBatch(batch)
      ids.push(...batchIds)
    }

    return ids
  }

  /**
   * Add documents to memory store
   */
  private async addDocumentsToMemory(documents: EmbeddingDocument[]): Promise<string[]> {
    if (!this.memoryStore) {
      throw new Error('Memory store not initialized')
    }

    const langchainDocs = documents.map((doc, index) => {
      const id = doc.id || `doc_${Date.now()}_${index}`
      this.inMemoryDocuments.set(id, { ...doc, id })
      
      return new Document({
        pageContent: doc.content,
        metadata: { ...doc.metadata, id }
      })
    })

    await this.memoryStore.addDocuments(langchainDocs)
    
    return Array.from(this.inMemoryDocuments.keys()).slice(-documents.length)
  }

  /**
   * Search in memory store
   */
  private async searchMemoryStore(
    queryText: string, 
    options: SearchOptions
  ): Promise<EmbeddingDocument[]> {
    if (!this.memoryStore) {
      throw new Error('Memory store not initialized')
    }

    const { limit = 5 } = options

    try {
      const results = await this.memoryStore.similaritySearch(queryText, limit)
      
      return results.map((doc, index) => ({
        id: doc.metadata.id || `mem_${index}`,
        content: doc.pageContent,
        metadata: doc.metadata,
        similarity: 1 - (index / results.length) // Approximate similarity based on ranking
      }))
    } catch (error) {
      logger.error('Failed to search memory store', { error })
      return []
    }
  }


  /**
   * Process a batch of documents
   */
  private async processBatch(documents: EmbeddingDocument[]): Promise<string[]> {
    try {
      // Generate embeddings for the batch
      const texts = documents.map(doc => doc.content)
      const embeddings = await this.embeddings.embedDocuments(texts)

      // Insert into database 
      const insertPromises = documents.map(async (doc, index) => {
        const embedding = embeddings[index]
        const id = doc.id || `emb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        if (this.isPgVectorAvailable) {
          try {
            // Use raw SQL for pgvector if available
            await prisma.$executeRaw`
              INSERT INTO "Embedding" (id, content, embedding, "embeddingJson", type, metadata, "createdAt", "updatedAt")
              VALUES (${id}, ${doc.content}, ${embedding}::vector, ${JSON.stringify(embedding)}::jsonb, ${doc.metadata.type || 'unknown'}, ${JSON.stringify(doc.metadata)}::jsonb, NOW(), NOW())
            `
          } catch (error) {
            // If vector insertion fails, try with jsonb format
            logger.warn('Failed to insert as vector type, trying with JSON format', { error: String(error) });
            await prisma.embedding.create({
              data: {
                id,
                content: doc.content,
                embeddingJson: embedding,
                type: doc.metadata.type || 'unknown',
                metadata: doc.metadata
              }
            });
          }
        } else {
          // Use Prisma with JSON storage
          await prisma.embedding.create({
            data: {
              id,
              content: doc.content,
              embeddingJson: embedding,
              type: doc.metadata.type || 'unknown',
              metadata: doc.metadata
            }
          })
        }

        return id
      })

      const results = await Promise.all(insertPromises)
      logger.info(`Successfully processed batch of ${documents.length} documents`)
      
      return results
    } catch (error) {
      logger.error('Failed to process document batch', { error, batchSize: documents.length })
      throw error
    }
  }

  /**
   * Search for similar documents
   */
  async similaritySearch(
    queryText: string, 
    options: SearchOptions = {}
  ): Promise<EmbeddingDocument[]> {
    await this.initialize()

    const { limit = 5, threshold = 0.7, filter = {} } = options

    // Use memory store if pgvector is not available
    if (!this.isPgVectorAvailable && this.memoryStore) {
      return await this.searchMemoryStore(queryText, options)
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddings.embedQuery(queryText)

      // Try to use pgvector if available
      if (this.isPgVectorAvailable) {
        return await this.vectorSimilaritySearch(queryEmbedding, options)
      }

      // Fall back to in-memory calculation
      return await this.inMemorySimilaritySearch(queryEmbedding, options)

    } catch (error) {
      logger.error('Failed to perform similarity search', { error, queryText, options })
      
      // Fallback to simple text search if vector search fails
      return await this.fallbackTextSearch(queryText, limit)
    }
  }

  /**
   * Perform vector similarity search using pgvector
   */
  private async vectorSimilaritySearch(
    queryEmbedding: number[], 
    options: SearchOptions
  ): Promise<EmbeddingDocument[]> {
    const { limit = 5, threshold = 0.7, filter = {} } = options

    try {
      // Check if the embedding column is using the vector type or jsonb
      const columnCheck = await prisma.$queryRaw`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Embedding' 
        AND column_name = 'embedding'
      `;
      
      // Get the data type of the embedding column
      const columnType = Array.isArray(columnCheck) && columnCheck.length > 0 
        ? (columnCheck[0] as any).data_type 
        : null;
        
      logger.info(`Embedding column type: ${columnType}`);
      
      // If not vector type, fall back to in-memory search
      if (columnType !== 'vector') {
        logger.info('Database not using vector type, falling back to in-memory search');
        return await this.inMemorySimilaritySearch(queryEmbedding, options);
      }

      let whereClause = ''
      const params: any[] = [queryEmbedding]
      let paramIndex = 2

      if (filter.type) {
        whereClause = `WHERE type = $${paramIndex}`
        params.push(filter.type)
        paramIndex++
      }

      // Build the WHERE condition for threshold
      const thresholdCondition = `1 - (embedding <=> $1::vector) > $${paramIndex}`
      const whereKeyword = whereClause ? 'AND' : 'WHERE'
      
      const query = `
        SELECT 
          id,
          content,
          metadata,
          type,
          1 - (embedding <=> $1::vector) as similarity
        FROM "Embedding"
        ${whereClause}
        ${whereKeyword} ${thresholdCondition}
        ORDER BY embedding <=> $1::vector
        LIMIT $${paramIndex + 1}
      `
      
      params.push(threshold, limit)

      const results = await prisma.$queryRawUnsafe<Array<{
        id: string
        content: string
        metadata: any
        type: string
        similarity: number
      }>>(query, ...params)

      return results.map(result => ({
        id: result.id,
        content: result.content,
        metadata: result.metadata || {},
        similarity: result.similarity
      }))
    } catch (error) {
      logger.error('pgvector search failed, falling back to in-memory', { error })
      return await this.inMemorySimilaritySearch(queryEmbedding, options)
    }
  }

  /**
   * Perform similarity search using in-memory calculation
   */
  private async inMemorySimilaritySearch(
    queryEmbedding: number[], 
    options: SearchOptions
  ): Promise<EmbeddingDocument[]> {
    const { limit = 5, threshold = 0.7, filter = {} } = options

    // Get all embeddings and calculate similarity in memory
    const where: any = {}
    
    if (filter.type) {
      where.type = filter.type
    }

    const allEmbeddings = await prisma.embedding.findMany({
      where,
      select: {
        id: true,
        content: true,
        embedding: true,
        type: true,
        metadata: true
      }
    })

    // Calculate cosine similarity for each embedding
    const similarities = allEmbeddings.map(doc => {
      try {
        // Try to parse as JSON first (fallback for string storage)
        let docEmbedding: number[]
        if (typeof doc.embedding === 'string') {
          docEmbedding = JSON.parse(doc.embedding)
        } else {
          // Assume it's already an array from pgvector
          docEmbedding = doc.embedding as any
        }
        
        const similarity = this.calculateCosineSimilarity(queryEmbedding, docEmbedding)
        
        return {
          id: doc.id,
          content: doc.content,
          metadata: doc.metadata as Record<string, any>,
          similarity
        }
      } catch (error) {
        logger.warn('Failed to parse embedding for similarity calculation', { docId: doc.id })
        return null
      }
    }).filter((doc): doc is NonNullable<typeof doc> => doc !== null)

    // Filter by threshold and sort by similarity
    const filteredResults = similarities
      .filter(doc => doc.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)

    logger.info(`Found ${filteredResults.length} similar documents for query`)
    return filteredResults
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      return 0
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i]
      normA += vectorA[i] * vectorA[i]
      normB += vectorB[i] * vectorB[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }

  /**
   * Fallback text search when vector search is unavailable
   */
  private async fallbackTextSearch(queryText: string, limit: number): Promise<EmbeddingDocument[]> {
    try {
      const results = await prisma.embedding.findMany({
        where: {
          content: {
            contains: queryText,
            mode: 'insensitive'
          }
        },
        take: limit,
        select: {
          id: true,
          content: true,
          metadata: true,
          type: true
        }
      })

      return results.map(result => ({
        id: result.id,
        content: result.content,
        metadata: result.metadata as Record<string, any>,
        similarity: 0.5 // Default similarity for text search
      }))
    } catch (error) {
      logger.error('Fallback text search also failed', { error })
      return []
    }
  }

  /**
   * Delete documents by IDs
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    await this.initialize()

    try {
      await prisma.embedding.deleteMany({
        where: {
          id: {
            in: ids
          }
        }
      })
      
      logger.info(`Deleted ${ids.length} documents`)
    } catch (error) {
      logger.error('Failed to delete documents', { error, ids })
      throw error
    }
  }

  /**
   * Update document content and regenerate embedding
   */
  async updateDocument(id: string, content: string, metadata?: Record<string, any>): Promise<void> {
    await this.initialize()

    try {
      const embedding = await this.embeddings.embedQuery(content)
      
      if (this.isPgVectorAvailable) {
        // Use raw SQL for pgvector
        await prisma.$executeRaw`
          UPDATE "Embedding" 
          SET 
            content = ${content},
            embedding = ${embedding}::vector,
            metadata = ${JSON.stringify(metadata || {})}::jsonb,
            "updatedAt" = NOW()
          WHERE id = ${id}
        `
      } else {
        // Use Prisma with JSON string
        await prisma.embedding.update({
          where: { id },
          data: {
            content,
            embedding: JSON.stringify(embedding),
            metadata: metadata || {},
            updatedAt: new Date()
          }
        })
      }
      
      logger.info(`Updated document ${id} (${this.isPgVectorAvailable ? 'pgvector' : 'standard'} mode)`)
    } catch (error) {
      logger.error('Failed to update document', { error, id })
      throw error
    }
  }

  /**
   * Get document count
   */
  async getDocumentCount(): Promise<number> {
    await this.initialize()

    try {
      return await prisma.embedding.count()
    } catch (error) {
      logger.error('Failed to get document count', { error })
      return 0
    }
  }

  /**
   * Clear all documents
   */
  async clearAll(): Promise<void> {
    await this.initialize()

    try {
      await prisma.$executeRaw`TRUNCATE TABLE Embedding`
      logger.info('Cleared all documents from vector store')
    } catch (error) {
      logger.error('Failed to clear documents', { error })
      throw error
    }
  }
}
