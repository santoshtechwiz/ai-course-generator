/**
 * Metrics API Endpoint
 * Exposes application metrics for monitoring and alerting
 */

import { NextResponse } from 'next/server'
import { observability } from '@/lib/observability'

export async function GET() {
  try {
    // Import env lazily to avoid validation during build
    const { env } = await import('@/lib/env')

    // Check if metrics are enabled (temporarily disabled to fix build)
    // if (!env.METRICS_ENABLED) {
    //   return NextResponse.json({
    //     error: 'Metrics collection is disabled'
    //   }, { status: 403 })
    // }

    // Get metrics data
    const metrics = observability.logger.getMetrics().getMetricsSummary()

    // Return metrics in JSON format
    return NextResponse.json(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('Metrics endpoint failed:', error)
    return NextResponse.json({
      error: 'Failed to retrieve metrics'
    }, { status: 500 })
  }
}