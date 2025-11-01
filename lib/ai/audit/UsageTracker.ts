/**
 * Usage Tracker
 *
 * Comprehensive audit logging, metering, and analytics for AI operations.
 * Tracks usage patterns, performance metrics, and compliance data.
 */

import { AIRequestContext } from '../types/context'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/db'

// Types for usage tracking
interface AIOperation {
  name: string
  model: string
  tokens: number
  credits: number
  duration: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

interface UsageMetrics {
  totalRequests: number
  totalTokens: number
  totalCredits: number
  averageLatency: number
  successRate: number
  errorRate: number
  topModels: Array<{ model: string; count: number }>
  topFeatures: Array<{ feature: string; count: number }>
}

interface AuditEntry {
  id: string
  timestamp: Date
  userId: string
  organizationId?: string
  requestId: string
  operation: string
  model: string
  tokensUsed: number
  creditsDeducted: number
  latency: number
  success: boolean
  error?: string
  riskScore: number
  ipAddress?: string
  userAgent?: string
  metadata: Record<string, any>
}

export class UsageTracker {
  private metricsBuffer: UsageMetrics[] = []
  private readonly BATCH_SIZE = 10
  private readonly FLUSH_INTERVAL = 30000 // 30 seconds

  constructor() {
    // Start periodic metrics flush
    setInterval(() => this.flushMetrics(), this.FLUSH_INTERVAL)
  }

  /**
   * Track AI operation usage
   */
  async trackUsage(context: AIRequestContext, operation: AIOperation): Promise<void> {
    try {
      const auditEntry: AuditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId: context.userId,
        organizationId: context.organization?.id,
        requestId: context.request.id,
        operation: operation.name,
        model: operation.model,
        tokensUsed: operation.tokens,
        creditsDeducted: operation.credits,
        latency: operation.duration,
        success: operation.success,
        error: operation.error,
        riskScore: context.security.riskScore,
        ipAddress: context.request.ipAddress,
        userAgent: context.request.userAgent,
        metadata: {
          ...operation.metadata,
          subscriptionPlan: context.subscription.plan,
          auditLevel: context.security.auditLevel,
          source: context.request.source,
          correlationId: context.request.correlationId
        }
      }

      // Store audit entry
      await this.storeAuditEntry(auditEntry)

      // Update metrics
      await this.updateMetrics(auditEntry)

      // Trigger alerts if needed
      await this.checkThresholds(auditEntry)

      logger.debug(`[UsageTracker] Tracked usage: ${operation.name} for ${context.userId}`)

    } catch (error) {
      logger.error(`[UsageTracker] Failed to track usage for ${context.userId}:`, error)
      // Don't throw - usage tracking failures shouldn't break the main flow
    }
  }

  /**
   * Store audit entry in database
   */
  private async storeAuditEntry(entry: AuditEntry): Promise<void> {
    try {
      // TODO: Implement audit logging when auditLog table is added to schema
      // For now, just log to console
      console.log('[UsageTracker] Audit entry:', entry)

      // Store in audit log table (assuming it exists)
      // If the table doesn't exist yet, we'll create it during migration
      /*
      await prisma.auditLog.create({
        data: {
          id: entry.id,
          userId: entry.userId,
          organizationId: entry.organizationId,
          requestId: entry.requestId,
          operation: entry.operation,
          model: entry.model,
          tokensUsed: entry.tokensUsed,
          creditsDeducted: entry.creditsDeducted,
          latency: entry.latency,
          success: entry.success,
          error: entry.error,
          riskScore: entry.riskScore,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata,
          createdAt: entry.timestamp
        }
      })
      */
    } catch (error) {
      // If audit table doesn't exist, log to console for now
      logger.warn(`[UsageTracker] Audit table not available, logging to console:`, entry)
    }
  }

  /**
   * Update real-time metrics
   */
  private async updateMetrics(entry: AuditEntry): Promise<void> {
    // Add to buffer for batch processing
    const metrics: UsageMetrics = {
      totalRequests: 1,
      totalTokens: entry.tokensUsed,
      totalCredits: entry.creditsDeducted,
      averageLatency: entry.latency,
      successRate: entry.success ? 1 : 0,
      errorRate: entry.success ? 0 : 1,
      topModels: [{ model: entry.model, count: 1 }],
      topFeatures: [{ feature: entry.operation, count: 1 }]
    }

    this.metricsBuffer.push(metrics)

    // Flush if buffer is full
    if (this.metricsBuffer.length >= this.BATCH_SIZE) {
      await this.flushMetrics()
    }
  }

  /**
   * Flush metrics buffer to storage/analytics
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return

    try {
      // Aggregate metrics
      const aggregated = this.aggregateMetrics(this.metricsBuffer)

      // Store aggregated metrics (could be Redis, database, or analytics service)
      await this.storeAggregatedMetrics(aggregated)

      // Clear buffer
      this.metricsBuffer = []

      logger.debug(`[UsageTracker] Flushed ${this.metricsBuffer.length} metrics`)

    } catch (error) {
      logger.error(`[UsageTracker] Failed to flush metrics:`, error)
    }
  }

  /**
   * Aggregate metrics from buffer
   */
  private aggregateMetrics(buffer: UsageMetrics[]): UsageMetrics {
    const aggregated: UsageMetrics = {
      totalRequests: 0,
      totalTokens: 0,
      totalCredits: 0,
      averageLatency: 0,
      successRate: 0,
      errorRate: 0,
      topModels: [],
      topFeatures: []
    }

    let totalLatency = 0
    let totalSuccess = 0

    const modelCounts: Record<string, number> = {}
    const featureCounts: Record<string, number> = {}

    for (const metrics of buffer) {
      aggregated.totalRequests += metrics.totalRequests
      aggregated.totalTokens += metrics.totalTokens
      aggregated.totalCredits += metrics.totalCredits
      totalLatency += metrics.averageLatency
      totalSuccess += metrics.successRate

      // Count models and features
      for (const model of metrics.topModels) {
        modelCounts[model.model] = (modelCounts[model.model] || 0) + model.count
      }

      for (const feature of metrics.topFeatures) {
        featureCounts[feature.feature] = (featureCounts[feature.feature] || 0) + feature.count
      }
    }

    // Calculate averages
    aggregated.averageLatency = totalLatency / buffer.length
    aggregated.successRate = totalSuccess / buffer.length
    aggregated.errorRate = 1 - aggregated.successRate

    // Get top models and features
    aggregated.topModels = Object.entries(modelCounts)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    aggregated.topFeatures = Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return aggregated
  }

  /**
   * Store aggregated metrics
   */
  private async storeAggregatedMetrics(metrics: UsageMetrics): Promise<void> {
    // TODO: Store in Redis, database, or analytics service
    // For now, just log
    logger.info(`[UsageTracker] Metrics update:`, {
      requests: metrics.totalRequests,
      tokens: metrics.totalTokens,
      credits: metrics.totalCredits,
      avgLatency: Math.round(metrics.averageLatency),
      successRate: Math.round(metrics.successRate * 100) + '%'
    })
  }

  /**
   * Check for threshold violations and trigger alerts
   */
  private async checkThresholds(entry: AuditEntry): Promise<void> {
    const alerts: string[] = []

    // High latency alert
    if (entry.latency > 10000) { // 10 seconds
      alerts.push(`High latency: ${entry.latency}ms for ${entry.operation}`)
    }

    // High risk score alert
    if (entry.riskScore > 80) {
      alerts.push(`High risk score: ${entry.riskScore} for user ${entry.userId}`)
    }

    // Failed operations alert
    if (!entry.success && entry.error) {
      alerts.push(`Operation failed: ${entry.operation} - ${entry.error}`)
    }

    // Trigger alerts
    for (const alert of alerts) {
      await this.triggerAlert(alert, entry)
    }
  }

  /**
   * Trigger alert for monitoring system
   */
  private async triggerAlert(message: string, entry: AuditEntry): Promise<void> {
    // TODO: Send to monitoring system (DataDog, New Relic, etc.)
    logger.warn(`[UsageTracker] ALERT: ${message}`, {
      userId: entry.userId,
      requestId: entry.requestId,
      operation: entry.operation
    })
  }

  /**
   * Get usage statistics for a user
   */
  async getUserUsageStats(userId: string, timeframe: 'day' | 'week' | 'month' = 'month'): Promise<{
    totalRequests: number
    totalTokens: number
    totalCredits: number
    averageLatency: number
    successRate: number
    topOperations: Array<{ operation: string; count: number }>
  }> {
    // TODO: Query audit logs for user statistics
    // For now, return mock data
    return {
      totalRequests: 0,
      totalTokens: 0,
      totalCredits: 0,
      averageLatency: 0,
      successRate: 1.0,
      topOperations: []
    }
  }

  /**
   * Get system-wide usage statistics
   */
  async getSystemUsageStats(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<UsageMetrics> {
    // TODO: Query aggregated metrics
    // For now, return mock data
    return {
      totalRequests: 0,
      totalTokens: 0,
      totalCredits: 0,
      averageLatency: 0,
      successRate: 1.0,
      errorRate: 0.0,
      topModels: [],
      topFeatures: []
    }
  }

  /**
   * Export audit data for compliance
   */
  async exportAuditData(
    startDate: Date,
    endDate: Date,
    filters?: {
      userId?: string
      operation?: string
      success?: boolean
    }
  ): Promise<AuditEntry[]> {
    // TODO: Query audit logs with filters
    // For now, return empty array
    return []
  }
}