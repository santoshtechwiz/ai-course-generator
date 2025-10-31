/**
 * Enterprise Observability System
 * Comprehensive monitoring, metrics, tracing, and structured logging
 */

import { env, isDevelopment, isProduction } from './env'

// ============================================================================
// METRICS COLLECTOR
// ============================================================================

interface MetricData {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp?: number
}

interface PerformanceMetric {
  name: string
  duration: number
  tags?: Record<string, string>
}

class MetricsCollector {
  private metrics: MetricData[] = []
  private performanceMetrics: PerformanceMetric[] = []

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: MetricData = {
      name,
      value,
      tags,
      timestamp: Date.now()
    }

    this.metrics.push(metric)

    // In development, log metrics
    if (isDevelopment()) {
      console.log(`[METRIC] ${name}: ${value}`, tags)
    }

    // Send to monitoring service in production
    if (isProduction()) {
      this.sendToMonitoringService(metric)
    }
  }

  /**
   * Record performance timing
   */
  recordPerformance(name: string, duration: number, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      duration,
      tags
    }

    this.performanceMetrics.push(metric)

    // Log slow operations
    if (duration > 1000) {
      console.warn(`[PERF] Slow operation: ${name} took ${duration}ms`, tags)
    }

    if (isProduction()) {
      this.sendPerformanceToMonitoring(metric)
    }
  }

  /**
   * Create a performance timer
   */
  startTimer(name: string, tags?: Record<string, string>) {
    const startTime = Date.now()
    return {
      end: () => {
        const duration = Date.now() - startTime
        this.recordPerformance(name, duration, tags)
        return duration
      }
    }
  }

  /**
   * Send metrics to external monitoring service
   */
  private async sendToMonitoringService(metric: MetricData) {
    if (!env.MONITORING_ENDPOINT) return

    try {
      await fetch(env.MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      })
    } catch (error) {
      console.error('Failed to send metric to monitoring service:', error)
    }
  }

  /**
   * Send performance metrics to monitoring service
   */
  private async sendPerformanceToMonitoring(metric: PerformanceMetric) {
    try {
      // TODO: Integrate with APM service
    } catch (error) {
      console.error('Failed to send performance metric:', error)
    }
  }

  /**
   * Get metrics summary for debugging
   */
  getMetricsSummary() {
    return {
      totalMetrics: this.metrics.length,
      totalPerformanceMetrics: this.performanceMetrics.length,
      recentMetrics: this.metrics.slice(-10),
      recentPerformance: this.performanceMetrics.slice(-10)
    }
  }
}

// ============================================================================
// STRUCTURED LOGGER
// ============================================================================

interface LogContext {
  userId?: string
  sessionId?: string
  requestId?: string
  component?: string
  operation?: string
  duration?: number
  error?: Error
  metadata?: Record<string, any>
  [key: string]: any // Allow additional properties
}

interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical'
  message: string
  context?: LogContext
  environment: string
  version?: string
}

class StructuredLogger {
  private metrics = new MetricsCollector()

  /**
   * Log with structured context
   */
  private log(level: LogEntry['level'], message: string, context?: LogContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      environment: env.NODE_ENV,
      version: process.env.npm_package_version
    }

    // Console output for development
    if (isDevelopment()) {
      const color = {
        debug: '\x1b[36m',    // Cyan
        info: '\x1b[32m',     // Green
        warn: '\x1b[33m',     // Yellow
        error: '\x1b[31m',    // Red
        critical: '\x1b[35m'  // Magenta
      }[level] || '\x1b[0m'

      console.log(`${color}[${level.toUpperCase()}]\x1b[0m ${message}`, context || '')
    }

    // Send to logging service in production
    if (isProduction()) {
      this.sendToLoggingService(entry)
    }

    // Record metrics for errors
    if (level === 'error' || level === 'critical') {
      this.metrics.recordMetric('error_count', 1, {
        level,
        component: context?.component || 'unknown'
      })
    }
  }

  debug(message: string, context?: LogContext) { this.log('debug', message, context) }
  info(message: string, context?: LogContext) { this.log('info', message, context) }
  warn(message: string, context?: LogContext) { this.log('warn', message, context) }
  error(message: string, context?: LogContext) { this.log('error', message, context) }
  critical(message: string, context?: LogContext) { this.log('critical', message, context) }

  /**
   * Log API request
   */
  logApiRequest(method: string, path: string, statusCode: number, duration: number, context?: LogContext) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

    this.log(level, `API ${method} ${path} ${statusCode}`, {
      ...context,
      operation: 'api_request',
      duration,
      metadata: { method, path, statusCode }
    })

    // Record API metrics
    this.metrics.recordMetric('api_request_count', 1, {
      method,
      path,
      status_code: statusCode.toString()
    })
    this.metrics.recordPerformance('api_request_duration', duration, {
      method,
      path
    })
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(operation: string, table: string, duration: number, context?: LogContext) {
    this.log('debug', `DB ${operation} on ${table}`, {
      ...context,
      operation: 'db_operation',
      duration,
      metadata: { operation, table }
    })

    this.metrics.recordPerformance('db_operation_duration', duration, {
      operation,
      table
    })
  }

  /**
   * Log AI operation
   */
  logAIOperation(provider: string, model: string, tokens: number, duration: number, context?: LogContext) {
    this.log('info', `AI ${provider} ${model} completion`, {
      ...context,
      operation: 'ai_completion',
      duration,
      metadata: { provider, model, tokens }
    })

    this.metrics.recordMetric('ai_tokens_used', tokens, { provider, model })
    this.metrics.recordPerformance('ai_completion_duration', duration, { provider, model })
  }

  /**
   * Send logs to external logging service
   */
  private async sendToLoggingService(entry: LogEntry) {
    if (!env.LOGGING_ENDPOINT) return

    try {
      await fetch(env.LOGGING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      })
    } catch (error) {
      // Fallback to console if logging service fails
      console.error('Failed to send log to logging service:', error)
      console.error('Original log entry:', entry)
    }
  }

  /**
   * Get metrics collector
   */
  getMetrics() {
    return this.metrics
  }
}

// ============================================================================
// TRACING SYSTEM
// ============================================================================

interface TraceSpan {
  id: string
  name: string
  startTime: number
  endTime?: number
  parentId?: string
  tags?: Record<string, string>
  logs: Array<{ timestamp: number, message: string, data?: any }>
}

class Tracer {
  private spans: Map<string, TraceSpan> = new Map()
  private activeSpanId: string | null = null

  /**
   * Start a new trace span
   */
  startSpan(name: string, parentId?: string, tags?: Record<string, string>): string {
    const spanId = this.generateSpanId()
    const span: TraceSpan = {
      id: spanId,
      name,
      startTime: Date.now(),
      parentId: parentId || this.activeSpanId || undefined,
      tags,
      logs: []
    }

    this.spans.set(spanId, span)
    this.activeSpanId = spanId

    return spanId
  }

  /**
   * End a trace span
   */
  endSpan(spanId: string) {
    const span = this.spans.get(spanId)
    if (span) {
      span.endTime = Date.now()
      if (this.activeSpanId === spanId) {
        this.activeSpanId = span.parentId || null
      }
    }
  }

  /**
   * Add log to active span
   */
  logToSpan(spanId: string, message: string, data?: any) {
    const span = this.spans.get(spanId)
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        message,
        data
      })
    }
  }

  /**
   * Get trace data for a span
   */
  getSpanData(spanId: string): TraceSpan | null {
    return this.spans.get(spanId) || null
  }

  /**
   * Get all completed spans
   */
  getCompletedSpans(): TraceSpan[] {
    return Array.from(this.spans.values()).filter(span => span.endTime)
  }

  /**
   * Clear old spans (for memory management)
   */
  clearOldSpans(maxAge: number = 3600000) { // 1 hour default
    const cutoff = Date.now() - maxAge
    for (const [spanId, span] of this.spans) {
      if (span.endTime && span.endTime < cutoff) {
        this.spans.delete(spanId)
      }
    }
  }

  private generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ============================================================================
// HEALTH CHECK SYSTEM
// ============================================================================

interface HealthCheck {
  name: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  message?: string
  lastChecked: number
  responseTime?: number
}

class HealthChecker {
  private checks: Map<string, HealthCheck> = new Map()

  /**
   * Register a health check
   */
  registerCheck(name: string, checkFn: () => Promise<boolean> | boolean) {
    // Run initial check
    this.runCheck(name, checkFn)
  }

  /**
   * Run a health check
   */
  private async runCheck(name: string, checkFn: () => Promise<boolean> | boolean) {
    const startTime = Date.now()

    try {
      const result = await checkFn()
      const responseTime = Date.now() - startTime

      this.checks.set(name, {
        name,
        status: result ? 'healthy' : 'unhealthy',
        lastChecked: Date.now(),
        responseTime
      })
    } catch (error) {
      this.checks.set(name, {
        name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Check failed',
        lastChecked: Date.now()
      })
    }
  }

  /**
   * Get overall health status
   */
  getHealthStatus() {
    const checks = Array.from(this.checks.values())
    const unhealthy = checks.filter(c => c.status === 'unhealthy')
    const degraded = checks.filter(c => c.status === 'degraded')

    return {
      status: unhealthy.length > 0 ? 'unhealthy' : degraded.length > 0 ? 'degraded' : 'healthy',
      checks,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Get individual check status
   */
  getCheckStatus(name: string): HealthCheck | null {
    return this.checks.get(name) || null
  }
}

// ============================================================================
// MAIN OBSERVABILITY SYSTEM
// ============================================================================

class ObservabilitySystem {
  public logger: StructuredLogger
  public tracer: Tracer
  public healthChecker: HealthChecker

  constructor() {
    this.logger = new StructuredLogger()
    this.tracer = new Tracer()
    this.healthChecker = new HealthChecker()

    // Register default health checks
    this.registerDefaultHealthChecks()
  }

  /**
   * Register default health checks
   */
  private registerDefaultHealthChecks() {
    // Database health check
    this.healthChecker.registerCheck('database', async () => {
      try {
        // TODO: Implement actual database health check
        return true
      } catch {
        return false
      }
    })

    // External API health check
    this.healthChecker.registerCheck('external_apis', async () => {
      try {
        // TODO: Check external API connectivity
        return true
      } catch {
        return false
      }
    })
  }

  /**
   * Create a monitored operation wrapper
   */
  monitorOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const timer = this.logger.getMetrics().startTimer(operationName)
    const spanId = this.tracer.startSpan(operationName)

    return operation()
      .then(result => {
        timer.end()
        this.tracer.endSpan(spanId)
        this.logger.info(`${operationName} completed successfully`, {
          ...context,
          operation: operationName,
          spanId
        })
        return result
      })
      .catch(error => {
        timer.end()
        this.tracer.endSpan(spanId)
        this.logger.error(`${operationName} failed`, {
          ...context,
          operation: operationName,
          spanId,
          error
        })
        throw error
      })
  }
}

// ============================================================================
// INTEGRATION HOOKS
// ============================================================================

/**
 * Integration hooks for existing services
 */
export class ObservabilityIntegration {
  private static instance: ObservabilityIntegration

  static getInstance(): ObservabilityIntegration {
    if (!ObservabilityIntegration.instance) {
      ObservabilityIntegration.instance = new ObservabilityIntegration()
    }
    return ObservabilityIntegration.instance
  }

  /**
   * Wrap API route handlers with observability
   */
  wrapAPIHandler<T extends any[], R>(
    handler: (...args: T) => Promise<R>,
    routeName: string
  ) {
    return async (...args: T): Promise<R> => {
      return observability.monitorOperation(
        `api.${routeName}`,
        () => handler(...args),
        { route: routeName }
      )
    }
  }

  /**
   * Wrap database operations with observability
   */
  wrapDatabaseOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    table?: string
  ) {
    return observability.monitorOperation(
      `db.${operationName}`,
      operation,
      { table, operation: operationName }
    )
  }

  /**
   * Wrap AI service calls with observability
   */
  wrapAIService<T>(
    operation: () => Promise<T>,
    serviceName: string,
    model?: string
  ) {
    return observability.monitorOperation(
      `ai.${serviceName}`,
      operation,
      { service: serviceName, model }
    )
  }

  /**
   * Wrap external API calls with observability
   */
  wrapExternalAPI<T>(
    operation: () => Promise<T>,
    serviceName: string,
    endpoint?: string
  ) {
    return observability.monitorOperation(
      `external.${serviceName}`,
      operation,
      { service: serviceName, endpoint }
    )
  }

  /**
   * Record user action for analytics
   */
  recordUserAction(action: string, userId?: string, metadata?: Record<string, any>) {
    observability.logger.info('User action recorded', {
      action,
      userId,
      ...metadata
    })

    observability.logger.getMetrics().recordMetric(
      'user_action',
      1,
      { action, userId: userId || 'anonymous' }
    )
  }

  /**
   * Record business metric
   */
  recordBusinessMetric(name: string, value: number, tags?: Record<string, string>) {
    observability.logger.getMetrics().recordMetric(`business.${name}`, value, tags)
  }

  /**
   * Record error with context
   */
  recordError(error: Error, context?: LogContext) {
    observability.logger.error('Application error', {
      ...context,
      error: error.message,
      stack: error.stack
    })

    observability.logger.getMetrics().recordMetric('error_count', 1, {
      type: error.name,
      ...(context && typeof context === 'object' ? Object.fromEntries(
        Object.entries(context).map(([k, v]) => [k, String(v)])
      ) : {})
    })
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const observability = new ObservabilitySystem()
export const observabilityIntegration = ObservabilityIntegration.getInstance()
export { StructuredLogger, MetricsCollector, Tracer, HealthChecker }
export type { LogContext, MetricData, PerformanceMetric, TraceSpan, HealthCheck }