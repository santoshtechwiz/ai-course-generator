/**
 * Health Check API Endpoint
 * Provides system health status for monitoring and load balancers
 */

import { NextResponse } from 'next/server'
import { observability } from '@/lib/observability'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { secureRoute } from '@/lib/secure-route'

async function healthCheckHandler(): Promise<NextResponse> {
  try {
    // Get overall health status
    const healthStatus = observability.healthChecker.getHealthStatus()

    // Additional health checks
    const dbHealth = await checkDatabaseHealth()
    const apiHealth = await checkAPIHealth()

    // Combine all health checks
    const allChecks = [
      ...healthStatus.checks,
      dbHealth,
      apiHealth
    ]

    // Determine overall status
    const hasUnhealthy = allChecks.some(check => check.status === 'unhealthy')
    const hasDegraded = allChecks.some(check => check.status === 'degraded')

    const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy'
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

    // Get metrics summary
    const metrics = observability.logger.getMetrics().getMetricsSummary()

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      checks: allChecks,
      metrics: env.METRICS_ENABLED ? metrics : null
    }, { status: statusCode })

  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure'
    }, { status: 503 })
  }
}

/**
 * Check database connectivity
 */
async function checkDatabaseHealth() {
  const startTime = Date.now()

  try {
    // Simple database query to test connectivity
    await prisma.$queryRaw`SELECT 1`

    return {
      name: 'database',
      status: 'healthy' as const,
      lastChecked: Date.now(),
      responseTime: Date.now() - startTime
    }
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy' as const,
      message: error instanceof Error ? error.message : 'Database connection failed',
      lastChecked: Date.now(),
      responseTime: Date.now() - startTime
    }
  }
}

/**
 * Check external API connectivity
 */
async function checkAPIHealth() {
  const startTime = Date.now()

  try {
    // Check OpenAI API connectivity (if configured)
    if (env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      if (!response.ok) {
        throw new Error(`OpenAI API returned ${response.status}`)
      }
    }

    return {
      name: 'external_apis',
      status: 'healthy' as const,
      lastChecked: Date.now(),
      responseTime: Date.now() - startTime
    }
  } catch (error) {
    return {
      name: 'external_apis',
      status: 'degraded' as const,
      message: error instanceof Error ? error.message : 'External API check failed',
      lastChecked: Date.now(),
      responseTime: Date.now() - startTime
    }
  }
}

// Export the secured route
export const GET = secureRoute.public(healthCheckHandler)
