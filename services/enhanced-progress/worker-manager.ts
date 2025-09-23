/**
 * Node Worker System for Progress Processing
 * Handles async processing of batched progress updates with concurrency control
 */

import { Worker } from 'worker_threads'
import { EventEmitter } from 'events'
import path from 'path'
import type { WorkerTask, WorkerConfig, ProgressBatch, ProgressEvent } from './types'

export class ProgressWorkerManager extends EventEmitter {
  private workers: Map<string, Worker> = new Map()
  private taskQueue: WorkerTask[] = []
  private activeTasks: Map<string, WorkerTask> = new Map()
  private isProcessing = false
  private config: WorkerConfig

  constructor(config?: Partial<WorkerConfig>) {
    super()
    this.config = {
      maxConcurrency: 3,
      taskTimeout: 30000,
      retryLimit: 3,
      healthCheckInterval: 60000,
      ...config
    }
    this.startHealthCheck()
  }

  /**
   * Add a task to the worker queue
   */
  public enqueueTask(task: Omit<WorkerTask, 'id' | 'createdAt'>): string {
    const fullTask: WorkerTask = {
      ...task,
      id: this.generateTaskId(),
      createdAt: Date.now()
    }

    this.taskQueue.push(fullTask)
    this.processQueue()
    
    return fullTask.id
  }

  /**
   * Process a batch of progress events
   */
  public async processBatch(batch: ProgressBatch): Promise<void> {
    const taskId = this.enqueueTask({
      type: 'process_batch',
      payload: batch,
      priority: 1
    })

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Task ${taskId} timed out`))
      }, this.config.taskTimeout)

      this.once(`task:${taskId}:complete`, (result) => {
        clearTimeout(timeout)
        if (result.success) {
          resolve(result.data)
        } else {
          reject(new Error(result.error))
        }
      })
    })
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return
    this.isProcessing = true

    try {
      while (this.taskQueue.length > 0 && this.activeTasks.size < this.config.maxConcurrency) {
        const task = this.taskQueue.shift()
        if (task) {
          await this.executeTask(task)
        }
      }
    } finally {
      this.isProcessing = false
    }
  }

  private async executeTask(task: WorkerTask): Promise<void> {
    this.activeTasks.set(task.id, task)

    try {
      const worker = await this.getWorker()
      
      const result = await this.runTaskInWorker(worker, task)
      this.emit(`task:${task.id}:complete`, { success: true, data: result })
      
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error)
      this.emit(`task:${task.id}:complete`, { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    } finally {
      this.activeTasks.delete(task.id)
      this.processQueue() // Process next task
    }
  }

  private async runTaskInWorker(worker: Worker, task: WorkerTask): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker task timeout'))
      }, this.config.taskTimeout)

      const messageHandler = (result: any) => {
        clearTimeout(timeout)
        worker.off('message', messageHandler)
        worker.off('error', errorHandler)
        
        if (result.success) {
          resolve(result.data)
        } else {
          reject(new Error(result.error))
        }
      }

      const errorHandler = (error: Error) => {
        clearTimeout(timeout)
        worker.off('message', messageHandler)
        worker.off('error', errorHandler)
        reject(error)
      }

      worker.on('message', messageHandler)
      worker.on('error', errorHandler)
      
      worker.postMessage(task)
    })
  }

  private async getWorker(): Promise<Worker> {
    // Simple round-robin worker selection
    const availableWorkers = Array.from(this.workers.values())
    if (availableWorkers.length < this.config.maxConcurrency) {
      return this.createWorker()
    }

    // Return least busy worker (simplistic approach)
    return availableWorkers[0]
  }

  private createWorker(): Worker {
    const workerId = this.generateWorkerId()
    const workerPath = path.join(__dirname, 'worker.js')
    
    const worker = new Worker(workerPath, {
      workerData: { workerId }
    })

    worker.on('error', (error) => {
      console.error(`Worker ${workerId} error:`, error)
      this.workers.delete(workerId)
    })

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker ${workerId} exited with code ${code}`)
      }
      this.workers.delete(workerId)
    })

    this.workers.set(workerId, worker)
    return worker
  }

  private startHealthCheck(): void {
    setInterval(() => {
      this.performHealthCheck()
    }, this.config.healthCheckInterval)
  }

  private performHealthCheck(): void {
    const now = Date.now()
    
    // Check for stuck tasks
    for (const [taskId, task] of this.activeTasks.entries()) {
      if (now - task.createdAt > this.config.taskTimeout * 2) {
        console.warn(`Task ${taskId} appears to be stuck, removing from active tasks`)
        this.activeTasks.delete(taskId)
      }
    }

    // Restart failed workers if needed
    if (this.workers.size < this.config.maxConcurrency && this.taskQueue.length > 0) {
      this.createWorker()
    }

    this.emit('healthCheck', {
      activeWorkers: this.workers.size,
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length
    })
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateWorkerId(): string {
    return `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down worker manager...')
    
    // Wait for active tasks to complete
    const maxWaitTime = 10000
    const startTime = Date.now()
    
    while (this.activeTasks.size > 0 && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Terminate all workers
    for (const worker of this.workers.values()) {
      await worker.terminate()
    }

    this.workers.clear()
    this.activeTasks.clear()
    this.taskQueue.length = 0
    
    console.log('Worker manager shutdown complete')
  }

  public getStatus() {
    return {
      activeWorkers: this.workers.size,
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
      config: this.config
    }
  }
}

// Singleton instance
export const progressWorkerManager = new ProgressWorkerManager()