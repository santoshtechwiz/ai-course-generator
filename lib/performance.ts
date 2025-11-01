/**
 * Performance Optimization Utilities
 * Advanced caching, query optimization, and performance monitoring
 */

import { env } from '@/lib/env'
import { observabilityIntegration } from '@/lib/observability'
import NodeCache from 'node-cache'

// ============================================================================
// ADVANCED CACHING SYSTEM
// ============================================================================

interface CacheConfig {
  ttl: number
  checkPeriod?: number
  maxKeys?: number
}

class AdvancedCache {
  private cache: NodeCache
  private hitMetrics = { hits: 0, misses: 0, sets: 0 }

  constructor(config: CacheConfig) {
    this.cache = new NodeCache({
      stdTTL: config.ttl,
      checkperiod: config.checkPeriod || config.ttl / 10,
      maxKeys: config.maxKeys
    })

    // Listen to cache events for metrics
    this.cache.on('set', () => this.hitMetrics.sets++)
    this.cache.on('expired', (key) => {
      observabilityIntegration.recordBusinessMetric('cache_expired', 1, { key })
    })
  }

  /**
   * Get value from cache with metrics
   */
  get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key)
    if (value !== undefined) {
      this.hitMetrics.hits++
      observabilityIntegration.recordBusinessMetric('cache_hit', 1, { key })
    } else {
      this.hitMetrics.misses++
      observabilityIntegration.recordBusinessMetric('cache_miss', 1, { key })
    }
    return value
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    const defaultTTL = (this.cache as any).options?.stdTTL || 300
    const success = this.cache.set(key, value, ttl || defaultTTL)
    if (success) {
      observabilityIntegration.recordBusinessMetric('cache_set', 1, { key })
    }
    return success
  }

  /**
   * Delete from cache
   */
  del(key: string): number {
    const deleted = this.cache.del(key)
    if (deleted > 0) {
      observabilityIntegration.recordBusinessMetric('cache_delete', deleted, { key })
    }
    return deleted
  }

  /**
   * Get multiple values
   */
  mget<T>(keys: string[]): { [key: string]: T } {
    const result = this.cache.mget<T>(keys)
    const hits = Object.keys(result).length
    const misses = keys.length - hits

    this.hitMetrics.hits += hits
    this.hitMetrics.misses += misses

    observabilityIntegration.recordBusinessMetric('cache_multi_hit', hits, { keys: keys.join(',') })
    if (misses > 0) {
      observabilityIntegration.recordBusinessMetric('cache_multi_miss', misses, { keys: keys.join(',') })
    }

    return result
  }

  /**
   * Set multiple values
   */
  mset<T>(keyValuePairs: Array<{ key: string; val: T; ttl?: number }>): boolean {
    const success = this.cache.mset(keyValuePairs)
    if (success) {
      observabilityIntegration.recordBusinessMetric('cache_multi_set', keyValuePairs.length)
    }
    return success
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const cacheStats = this.cache.getStats()
    return {
      ...cacheStats,
      ...this.hitMetrics,
      hitRate: this.hitMetrics.hits / (this.hitMetrics.hits + this.hitMetrics.misses) || 0
    }
  }

  /**
   * Clear all cache
   */
  flushAll(): void {
    this.cache.flushAll()
    observabilityIntegration.recordBusinessMetric('cache_flush_all', 1)
  }

  /**
   * Get or set pattern (cache-aside with TTL)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    let value = this.get<T>(key)
    if (value !== undefined) {
      return value
    }

    // Cache miss - fetch from source
    value = await fetcher()
    this.set(key, value, ttl)
    return value
  }
}

// ============================================================================
// QUERY OPTIMIZATION
// ============================================================================

interface QueryOptimizationConfig {
  enableQueryLogging?: boolean
  slowQueryThreshold?: number
  enableIndexingHints?: boolean
}

class QueryOptimizer {
  private config: QueryOptimizationConfig

  constructor(config: QueryOptimizationConfig = {}) {
    this.config = {
      enableQueryLogging: env.NODE_ENV === 'development',
      slowQueryThreshold: 1000, // 1 second
      enableIndexingHints: true,
      ...config
    }
  }

  /**
   * Optimize Prisma query with performance monitoring
   */
  async optimizeQuery<T>(
    operation: string,
    query: () => Promise<T>,
    options: {
      includeMetrics?: boolean
      expectedComplexity?: 'simple' | 'medium' | 'complex'
    } = {}
  ): Promise<T> {
    const startTime = Date.now()

    try {
      const result = await query()
      const duration = Date.now() - startTime

      // Log slow queries
      if (duration > this.config.slowQueryThreshold!) {
        console.warn(`[SLOW QUERY] ${operation} took ${duration}ms`)
        observabilityIntegration.recordBusinessMetric('slow_query', duration, {
          operation,
          complexity: options.expectedComplexity || 'unknown'
        })
      }

      // Record query metrics
      if (options.includeMetrics) {
        observabilityIntegration.recordBusinessMetric('query_duration', duration, {
          operation,
          complexity: options.expectedComplexity || 'unknown'
        })
      }

      if (this.config.enableQueryLogging) {
        console.log(`[QUERY] ${operation}: ${duration}ms`)
      }

      return result

    } catch (error) {
      const duration = Date.now() - startTime
      observabilityIntegration.recordError(error as Error, {
        operation,
        queryDuration: duration
      })
      throw error
    }
  }

  /**
   * Generate optimized query hints for complex queries
   */
  getQueryHints(complexity: 'simple' | 'medium' | 'complex'): string[] {
    if (!this.config.enableIndexingHints) return []

    const hints = []

    switch (complexity) {
      case 'complex':
        hints.push('Use composite indexes for multi-column WHERE clauses')
        hints.push('Consider query result pagination for large datasets')
        hints.push('Use EXPLAIN ANALYZE to identify bottlenecks')
        break
      case 'medium':
        hints.push('Ensure foreign key columns are indexed')
        hints.push('Use SELECT only required columns')
        break
      case 'simple':
        hints.push('Query is already optimized')
        break
    }

    return hints
  }

  /**
   * Analyze query performance patterns
   */
  analyzeQueryPatterns(queries: Array<{ operation: string; duration: number; timestamp: number }>) {
    const analysis = {
      totalQueries: queries.length,
      averageDuration: queries.reduce((sum, q) => sum + q.duration, 0) / queries.length,
      slowQueries: queries.filter(q => q.duration > this.config.slowQueryThreshold!).length,
      peakTime: Math.max(...queries.map(q => q.timestamp)),
      queryTypes: {} as Record<string, number>
    }

    // Count query types
    queries.forEach(q => {
      const type = q.operation.split('_')[0] // e.g., 'find', 'create', 'update'
      analysis.queryTypes[type] = (analysis.queryTypes[type] || 0) + 1
    })

    return analysis
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

interface PerformanceThresholds {
  responseTime: number
  memoryUsage: number
  cpuUsage: number
  errorRate: number
}

class PerformanceMonitor {
  private thresholds: PerformanceThresholds
  private metrics: Array<{
    timestamp: number
    responseTime: number
    memoryUsage: number
    cpuUsage: number
    errorCount: number
  }> = []

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = {
      responseTime: 1000, // 1 second
      memoryUsage: 512 * 1024 * 1024, // 512MB
      cpuUsage: 80, // 80%
      errorRate: 5, // 5%
      ...thresholds
    }
  }

  /**
   * Record performance metrics
   */
  recordMetrics(responseTime: number, errorCount = 0) {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    const metric = {
      timestamp: Date.now(),
      responseTime,
      memoryUsage: memUsage.heapUsed,
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
      errorCount
    }

    this.metrics.push(metric)

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift()
    }

    // Check thresholds
    this.checkThresholds(metric)
  }

  /**
   * Check if metrics exceed thresholds
   */
  private checkThresholds(metric: typeof this.metrics[0]) {
    const alerts = []

    if (metric.responseTime > this.thresholds.responseTime) {
      alerts.push(`High response time: ${metric.responseTime}ms`)
    }

    if (metric.memoryUsage > this.thresholds.memoryUsage) {
      alerts.push(`High memory usage: ${(metric.memoryUsage / 1024 / 1024).toFixed(2)}MB`)
    }

    if (metric.cpuUsage > this.thresholds.cpuUsage) {
      alerts.push(`High CPU usage: ${metric.cpuUsage}%`)
    }

    if (metric.errorCount > this.thresholds.errorRate) {
      alerts.push(`High error rate: ${metric.errorCount} errors`)
    }

    // Log alerts
    alerts.forEach(alert => {
      console.warn(`[PERFORMANCE ALERT] ${alert}`)
      observabilityIntegration.recordBusinessMetric('performance_alert', 1, {
        alert,
        responseTime: metric.responseTime.toString(),
        memoryUsage: metric.memoryUsage.toString(),
        cpuUsage: metric.cpuUsage.toString(),
        errorCount: metric.errorCount.toString()
      })
    })
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    if (this.metrics.length === 0) return null

    const recent = this.metrics.slice(-10) // Last 10 metrics

    return {
      averageResponseTime: recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length,
      averageMemoryUsage: recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length,
      averageCpuUsage: recent.reduce((sum, m) => sum + m.cpuUsage, 0) / recent.length,
      totalErrors: recent.reduce((sum, m) => sum + m.errorCount, 0),
      alertsTriggered: this.metrics.filter(m =>
        m.responseTime > this.thresholds.responseTime ||
        m.memoryUsage > this.thresholds.memoryUsage ||
        m.cpuUsage > this.thresholds.cpuUsage ||
        m.errorCount > this.thresholds.errorRate
      ).length
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const advancedCache = new AdvancedCache({
  ttl: env.CACHE_TTL || 300, // 5 minutes default
  maxKeys: env.CACHE_MAX_KEYS || 1000
})

export const queryOptimizer = new QueryOptimizer()

export const performanceMonitor = new PerformanceMonitor()

export { AdvancedCache, QueryOptimizer, PerformanceMonitor }
export type { CacheConfig, QueryOptimizationConfig, PerformanceThresholds }