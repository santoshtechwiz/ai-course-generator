/**
 * RAG Service Error Handler & Validator
 * Wraps your existing RAGService with proper error handling and validation
 * 
 * USAGE: Import this instead of direct RAGService
 * import { SafeRAGService } from './SafeRAGService'
 */

interface RAGResponse {
  content: string
  tokensUsed: number
  context?: {
    relevantDocuments: Array<{
      content: string
      metadata: any
      similarity: number
    }>
  }
}

interface RAGOptions {
  maxTokens?: number
  temperature?: number
  includeHistory?: boolean
  retries?: number
}

export class SafeRAGService {
  private ragService: any
  private maxRetries = 2
  private timeout = 15000 // 15 seconds

  constructor(ragService: any) {
    this.ragService = ragService
  }

  /**
   * Generate response with comprehensive error handling
   */
  async generateResponse(
    userId: string,
    query: string,
    options: RAGOptions = {}
  ): Promise<RAGResponse | null> {
    const startTime = Date.now()
    const retries = options.retries ?? this.maxRetries

    console.log('[SafeRAG] Generating response:', {
      userId,
      queryLength: query.length,
      options,
      attempt: this.maxRetries - retries + 1
    })

    // Validate inputs
    if (!query?.trim()) {
      console.error('[SafeRAG] Empty query provided')
      return null
    }

    if (!userId) {
      console.warn('[SafeRAG] No userId provided, using anonymous')
      userId = 'anonymous'
    }

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('RAG request timeout')), this.timeout)
      })

      // Race between actual request and timeout
      const response = await Promise.race([
        this.ragService.generateResponse(userId, query, options),
        timeoutPromise
      ]) as RAGResponse

      const processingTime = Date.now() - startTime

      // Validate response structure
      if (!response) {
        console.error('[SafeRAG] Null response from RAG service')
        return this.handleRetry(userId, query, options, retries, 'Null response')
      }

      if (!response.content || response.content.trim().length === 0) {
        console.error('[SafeRAG] Empty content in response')
        return this.handleRetry(userId, query, options, retries, 'Empty content')
      }

      // Log success metrics
      console.log('[SafeRAG] ✓ Success:', {
        contentLength: response.content.length,
        documentsRetrieved: response.context?.relevantDocuments?.length || 0,
        tokensUsed: response.tokensUsed,
        processingTime,
        cached: false
      })

      // Validate retrieved documents
      if (response.context?.relevantDocuments) {
        const validDocs = response.context.relevantDocuments.filter(
          doc => doc && doc.content && doc.content.length > 0
        )
        
        console.log('[SafeRAG] Document validation:', {
          total: response.context.relevantDocuments.length,
          valid: validDocs.length,
          avgSimilarity: validDocs.reduce((sum, d) => sum + (d.similarity || 0), 0) / validDocs.length
        })

        if (validDocs.length === 0) {
          console.warn('[SafeRAG] No valid documents retrieved, but response generated')
        }

        // Update with only valid documents
        response.context.relevantDocuments = validDocs
      }

      return response

    } catch (error) {
      const processingTime = Date.now() - startTime
      
      console.error('[SafeRAG] Error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        processingTime,
        retriesLeft: retries
      })

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          console.error('[SafeRAG] Request timed out after', this.timeout, 'ms')
          return this.handleRetry(userId, query, options, retries, 'Timeout')
        }

        if (error.message.includes('rate limit')) {
          console.error('[SafeRAG] Rate limit hit, not retrying')
          return null
        }

        if (error.message.includes('ECONNREFUSED') || error.message.includes('network')) {
          console.error('[SafeRAG] Network error, retrying...')
          return this.handleRetry(userId, query, options, retries, 'Network error')
        }
      }

      // Generic retry for unknown errors
      return this.handleRetry(userId, query, options, retries, 'Unknown error')
    }
  }

  /**
   * Handle retry logic
   */
  private async handleRetry(
    userId: string,
    query: string,
    options: RAGOptions,
    retriesLeft: number,
    reason: string
  ): Promise<RAGResponse | null> {
    if (retriesLeft <= 0) {
      console.error('[SafeRAG] Max retries exceeded, returning null')
      return null
    }

    console.log(`[SafeRAG] Retrying (${retriesLeft} left) due to: ${reason}`)
    
    // Exponential backoff
    const delay = (this.maxRetries - retriesLeft + 1) * 1000
    await new Promise(resolve => setTimeout(resolve, delay))

    return this.generateResponse(userId, query, {
      ...options,
      retries: retriesLeft - 1
    })
  }

  /**
   * Check if RAG service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testResponse = await this.generateResponse(
        'health-check',
        'test query',
        { maxTokens: 50 }
      )
      
      const isHealthy = !!testResponse && !!testResponse.content
      console.log('[SafeRAG] Health check:', isHealthy ? '✓ PASS' : '✗ FAIL')
      
      return isHealthy
    } catch (error) {
      console.error('[SafeRAG] Health check failed:', error)
      return false
    }
  }

  /**
   * Get vector store statistics (if available)
   */
  async getStats(): Promise<{
    isConnected: boolean
    documentCount?: number
    error?: string
  }> {
    try {
      // Attempt to call stats method if it exists
      if (typeof this.ragService.getStats === 'function') {
        const stats = await this.ragService.getStats()
        return {
          isConnected: true,
          ...stats
        }
      }

      // Fallback: Try a simple query
      const testResult = await this.generateResponse(
        'stats-check',
        'test',
        { maxTokens: 10 }
      )

      return {
        isConnected: !!testResult,
        documentCount: testResult?.context?.relevantDocuments?.length
      }
    } catch (error) {
      return {
        isConnected: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

/**
 * Usage in ChatService.ts:
 * 
 * import { RAGService } from '../ragService'
 * import { SafeRAGService } from './SafeRAGService'
 * 
 * constructor() {
 *   const rawRAGService = new RAGService()
 *   this.ragService = new SafeRAGService(rawRAGService)
 * }
 * 
 * // Then use normally:
 * const response = await this.ragService.generateResponse(userId, message, options)
 * if (!response) {
 *   return this.getFallbackResponse(message)
 * }
 */