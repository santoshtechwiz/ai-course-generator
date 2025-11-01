/**
 * Performance-Optimized Database Service
 * Enhanced database operations with caching and query optimization
 */

import { prisma } from '@/lib/db'
import { advancedCache, queryOptimizer, performanceMonitor } from '@/lib/performance'
import { observabilityIntegration } from '@/lib/observability'

// ============================================================================
// CACHED DATABASE OPERATIONS
// ============================================================================

interface CacheableQuery<T> {
  key: string
  ttl?: number
  tags?: string[] // For cache invalidation
}

class CachedDatabaseService {
  /**
   * Execute query with caching
   */
  async executeCachedQuery<T>(
    query: () => Promise<T>,
    cacheConfig: CacheableQuery<T>,
    options: {
      complexity?: 'simple' | 'medium' | 'complex'
      includeMetrics?: boolean
    } = {}
  ): Promise<T> {
    const { key, ttl, tags } = cacheConfig

    // Try cache first
    const cached = advancedCache.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    // Cache miss - execute query with optimization
    const result = await queryOptimizer.optimizeQuery(
      `cached_query_${key}`,
      query,
      {
        includeMetrics: options.includeMetrics,
        expectedComplexity: options.complexity
      }
    )

    // Cache the result
    advancedCache.set(key, result, ttl)

    // Store cache tags for invalidation
    if (tags) {
      this.storeCacheTags(key, tags)
    }

    return result
  }

  /**
   * Invalidate cache by tags
   */
  invalidateByTags(tags: string[]): number {
    let invalidated = 0

    tags.forEach(tag => {
      const keys = this.getKeysByTag(tag)
      keys.forEach(key => {
        if (advancedCache.del(key) > 0) {
          invalidated++
        }
      })
      // Remove tag entries
      advancedCache.del(`tag:${tag}`)
    })

    if (invalidated > 0) {
      observabilityIntegration.recordBusinessMetric('cache_invalidation', invalidated, {
        tags: tags.join(',')
      })
    }

    return invalidated
  }

  /**
   * Store cache tag relationships
   */
  private storeCacheTags(key: string, tags: string[]): void {
    tags.forEach(tag => {
      const tagKey = `tag:${tag}`
      const existingKeys = advancedCache.get<string[]>(tagKey) || []
      if (!existingKeys.includes(key)) {
        existingKeys.push(key)
        advancedCache.set(tagKey, existingKeys)
      }
    })
  }

  /**
   * Get keys by tag
   */
  private getKeysByTag(tag: string): string[] {
    return advancedCache.get<string[]>(`tag:${tag}`) || []
  }
}

// ============================================================================
// OPTIMIZED PRISMA OPERATIONS
// ============================================================================

class OptimizedPrismaService {
  private cachedDb = new CachedDatabaseService()

  /**
   * Find many with caching and optimization
   */
  async findMany<T extends Record<string, any>>(
    model: string,
    args: any,
    cacheConfig?: CacheableQuery<T[]>
  ): Promise<T[]> {
    if (cacheConfig) {
      return this.cachedDb.executeCachedQuery(
        () => (prisma as any)[model].findMany(args),
        cacheConfig,
        { complexity: 'medium', includeMetrics: true }
      )
    }

    return queryOptimizer.optimizeQuery(
      `prisma_findMany_${model}`,
      () => (prisma as any)[model].findMany(args),
      { complexity: 'simple', includeMetrics: true }
    )
  }

  /**
   * Find unique with caching
   */
  async findUnique<T extends Record<string, any>>(
    model: string,
    args: any,
    cacheConfig?: CacheableQuery<T>
  ): Promise<T | null> {
    if (cacheConfig) {
      return this.cachedDb.executeCachedQuery(
        () => (prisma as any)[model].findUnique(args),
        cacheConfig,
        { complexity: 'simple', includeMetrics: true }
      )
    }

    return queryOptimizer.optimizeQuery(
      `prisma_findUnique_${model}`,
      () => (prisma as any)[model].findUnique(args),
      { complexity: 'simple', includeMetrics: true }
    )
  }

  /**
   * Create with cache invalidation
   */
  async create<T extends Record<string, any>>(
    model: string,
    args: any,
    invalidateTags?: string[]
  ): Promise<T> {
    const result = await queryOptimizer.optimizeQuery(
      `prisma_create_${model}`,
      () => (prisma as any)[model].create(args),
      { complexity: 'simple', includeMetrics: true }
    )

    // Invalidate related caches
    if (invalidateTags) {
      this.cachedDb.invalidateByTags(invalidateTags)
    }

    return result
  }

  /**
   * Update with cache invalidation
   */
  async update<T extends Record<string, any>>(
    model: string,
    args: any,
    invalidateTags?: string[]
  ): Promise<T> {
    const result = await queryOptimizer.optimizeQuery(
      `prisma_update_${model}`,
      () => (prisma as any)[model].update(args),
      { complexity: 'simple', includeMetrics: true }
    )

    // Invalidate related caches
    if (invalidateTags) {
      this.cachedDb.invalidateByTags(invalidateTags)
    }

    return result
  }

  /**
   * Delete with cache invalidation
   */
  async delete<T extends Record<string, any>>(
    model: string,
    args: any,
    invalidateTags?: string[]
  ): Promise<T> {
    const result = await queryOptimizer.optimizeQuery(
      `prisma_delete_${model}`,
      () => (prisma as any)[model].delete(args),
      { complexity: 'simple', includeMetrics: true }
    )

    // Invalidate related caches
    if (invalidateTags) {
      this.cachedDb.invalidateByTags(invalidateTags)
    }

    return result
  }

  /**
   * Execute raw query with optimization
   */
  async executeRaw<T = any>(
    query: string,
    params?: any[]
  ): Promise<T> {
    return queryOptimizer.optimizeQuery(
      'prisma_raw_query',
      () => prisma.$queryRaw(query, ...(params || [])),
      { complexity: 'complex', includeMetrics: true }
    )
  }

  /**
   * Transaction with performance monitoring
   */
  async transaction<T>(
    operations: (tx: any) => Promise<T>,
    description?: string
  ): Promise<T> {
    return queryOptimizer.optimizeQuery(
      `prisma_transaction${description ? `_${description}` : ''}`,
      () => prisma.$transaction(operations),
      { complexity: 'complex', includeMetrics: true }
    )
  }
}

// ============================================================================
// PERFORMANCE MONITORING HOOKS
// ============================================================================

class DatabasePerformanceMonitor {
  /**
   * Monitor database connection pool
   */
  async monitorConnectionPool() {
    try {
      // Check active connections
      const poolInfo = await prisma.$queryRaw`SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active'`

      observabilityIntegration.recordBusinessMetric('db_active_connections',
        parseInt((poolInfo as any)[0]?.active_connections || '0')
      )

      // Check for long-running queries
      const longQueries = await prisma.$queryRaw`
        SELECT count(*) as long_queries
        FROM pg_stat_activity
        WHERE state = 'active'
        AND now() - query_start > interval '30 seconds'
      `

      const longQueryCount = parseInt((longQueries as any)[0]?.long_queries || '0')
      if (longQueryCount > 0) {
        observabilityIntegration.recordBusinessMetric('db_long_queries', longQueryCount)
      }

    } catch (error) {
      observabilityIntegration.recordError(error as Error, {
        component: 'db_monitor',
        operation: 'connection_pool_check'
      })
    }
  }

  /**
   * Get database performance metrics
   */
  async getPerformanceMetrics() {
    try {
      const metrics = await prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          seq_scan as sequential_scans,
          idx_scan as index_scans,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes
        FROM pg_stat_user_tables
        ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
        LIMIT 10
      `

      return metrics
    } catch (error) {
      observabilityIntegration.recordError(error as Error, {
        component: 'db_monitor',
        operation: 'performance_metrics'
      })
      return []
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const cachedDatabaseService = new CachedDatabaseService()
export const optimizedPrismaService = new OptimizedPrismaService()
export const databasePerformanceMonitor = new DatabasePerformanceMonitor()

// Start monitoring if in production
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    databasePerformanceMonitor.monitorConnectionPool()
  }, 30000) // Every 30 seconds
}