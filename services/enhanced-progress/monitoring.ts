/**
 * Progress Monitoring and Metrics System
 * Provides comprehensive monitoring for the progress tracking system
 */

import { EventEmitter } from 'events'
import React from 'react'
import type { ProgressQueueMetrics } from './types'

export interface ProgressMetrics {
  queueMetrics: ProgressQueueMetrics
  workerMetrics: {
    activeWorkers: number
    activeTasks: number
    totalProcessed: number
    totalFailed: number
    averageProcessingTime: number
  }
  systemMetrics: {
    memoryUsage: NodeJS.MemoryUsage
    uptime: number
    cpuUsage: NodeJS.CpuUsage
  }
  alerts: ProgressAlert[]
}

export interface ProgressAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: number
  resolved: boolean
  metadata?: Record<string, any>
}

export class ProgressMonitor extends EventEmitter {
  private metrics: ProgressMetrics
  private alerts: Map<string, ProgressAlert> = new Map()
  private monitoringInterval?: NodeJS.Timeout
  private isRunning = false

  constructor() {
    super()
    this.metrics = this.initializeMetrics()
  }

  private initializeMetrics(): ProgressMetrics {
    return {
      queueMetrics: {
        queueSize: 0,
        totalProcessed: 0,
        totalFailed: 0,
        averageProcessingTime: 0,
        lastFlushTime: 0,
        errorRate: 0
      },
      workerMetrics: {
        activeWorkers: 0,
        activeTasks: 0,
        totalProcessed: 0,
        totalFailed: 0,
        averageProcessingTime: 0
      },
      systemMetrics: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage()
      },
      alerts: []
    }
  }

  public start(intervalMs: number = 30000): void {
    if (this.isRunning) return

    this.isRunning = true
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics()
      this.checkThresholds()
      this.cleanupOldAlerts()
    }, intervalMs)

    console.log('Progress monitoring started')
  }

  public stop(): void {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }

    console.log('Progress monitoring stopped')
  }

  public getMetrics(): ProgressMetrics {
    return { ...this.metrics }
  }

  public getActiveAlerts(): ProgressAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved)
  }

  public createAlert(
    type: ProgressAlert['type'],
    message: string,
    metadata?: Record<string, any>
  ): string {
    const alert: ProgressAlert = {
      id: this.generateAlertId(),
      type,
      message,
      timestamp: Date.now(),
      resolved: false,
      metadata
    }

    this.alerts.set(alert.id, alert)
    this.emit('alert', alert)

    // Auto-resolve info alerts after 5 minutes
    if (type === 'info') {
      setTimeout(() => {
        this.resolveAlert(alert.id)
      }, 5 * 60 * 1000)
    }

    return alert.id
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId)
    if (!alert) return false

    alert.resolved = true
    this.emit('alertResolved', alert)
    return true
  }

  private async collectMetrics(): Promise<void> {
    try {
      // Import dynamically to avoid circular dependencies
      const { progressQueue } = await import('./queue')
      const { progressWorkerManager } = await import('./worker-manager')

      // Update queue metrics
      this.metrics.queueMetrics = progressQueue.getMetrics()

      // Update worker metrics
      const workerStatus = progressWorkerManager.getStatus()
      this.metrics.workerMetrics = {
        activeWorkers: workerStatus.activeWorkers,
        activeTasks: workerStatus.activeTasks,
        totalProcessed: 0, // Would need to track this in worker manager
        totalFailed: 0,    // Would need to track this in worker manager
        averageProcessingTime: 0 // Would need to track this in worker manager
      }

      // Update system metrics
      this.metrics.systemMetrics = {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage()
      }

      // Update alerts array
      this.metrics.alerts = Array.from(this.alerts.values())

      this.emit('metricsUpdated', this.metrics)

    } catch (error) {
      console.error('Failed to collect metrics:', error)
      this.createAlert('error', `Metrics collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private checkThresholds(): void {
    const { queueMetrics, workerMetrics, systemMetrics } = this.metrics

    // Queue size threshold
    if (queueMetrics.queueSize > 500) {
      this.createAlert(
        'warning',
        `Queue size is high: ${queueMetrics.queueSize} events`,
        { queueSize: queueMetrics.queueSize }
      )
    }

    // Error rate threshold
    if (queueMetrics.errorRate > 0.1) {
      this.createAlert(
        'error',
        `High error rate: ${(queueMetrics.errorRate * 100).toFixed(1)}%`,
        { errorRate: queueMetrics.errorRate }
      )
    }

    // Memory usage threshold (100MB)
    const memoryUsageMB = systemMetrics.memoryUsage.heapUsed / 1024 / 1024
    if (memoryUsageMB > 100) {
      this.createAlert(
        'warning',
        `High memory usage: ${memoryUsageMB.toFixed(1)}MB`,
        { memoryUsage: systemMetrics.memoryUsage }
      )
    }

    // No active workers warning
    if (workerMetrics.activeWorkers === 0 && queueMetrics.queueSize > 0) {
      this.createAlert(
        'error',
        'No active workers but queue has pending events',
        { queueSize: queueMetrics.queueSize }
      )
    }

    // Stale queue check (no flush in 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000
    if (queueMetrics.lastFlushTime > 0 && queueMetrics.lastFlushTime < tenMinutesAgo && queueMetrics.queueSize > 0) {
      this.createAlert(
        'warning',
        'Queue has not been flushed recently',
        { 
          lastFlushTime: queueMetrics.lastFlushTime,
          queueSize: queueMetrics.queueSize 
        }
      )
    }
  }

  private cleanupOldAlerts(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.timestamp < oneHourAgo) {
        this.alerts.delete(alertId)
      }
    }
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public exportMetrics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: this.metrics,
      activeAlerts: this.getActiveAlerts()
    }, null, 2)
  }
}

// Singleton instance
export const progressMonitor = new ProgressMonitor()

/**
 * React hook for accessing progress metrics
 */
export function useProgressMetrics() {
  const [metrics, setMetrics] = React.useState<ProgressMetrics | null>(null)
  const [alerts, setAlerts] = React.useState<ProgressAlert[]>([])

  React.useEffect(() => {
    const updateMetrics = (newMetrics: ProgressMetrics) => {
      setMetrics(newMetrics)
    }

    const updateAlerts = (alert: ProgressAlert) => {
      setAlerts(current => {
        const existing = current.find(a => a.id === alert.id)
        if (existing) {
          return current.map(a => a.id === alert.id ? alert : a)
        }
        return [...current, alert]
      })
    }

    progressMonitor.on('metricsUpdated', updateMetrics)
    progressMonitor.on('alert', updateAlerts)
    progressMonitor.on('alertResolved', updateAlerts)

    // Initial load
    setMetrics(progressMonitor.getMetrics())
    setAlerts(progressMonitor.getActiveAlerts())

    return () => {
      progressMonitor.off('metricsUpdated', updateMetrics)
      progressMonitor.off('alert', updateAlerts)
      progressMonitor.off('alertResolved', updateAlerts)
    }
  }, [])

  return {
    metrics,
    alerts,
    isMonitoring: progressMonitor['isRunning']
  }
}

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  progressMonitor.start()
}