"use client"


import { BProgress } from '@bprogress/core'
import Router from 'next/router'

interface ProgressOptions {
  minimum?: number
  template?: string
  easing?: string
  speed?: number
  trickle?: boolean
  trickleSpeed?: number
  showSpinner?: boolean
  parent?: string
}

// Simple debounce function
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: NodeJS.Timeout
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), ms)
  }
}

/**
 * Default configuration for BProgress
 */
const defaultOptions: ProgressOptions = {
  minimum: 0.3,
  easing: 'ease',
  speed: 300,
  trickle: true,
  trickleSpeed: 200,
  showSpinner: false,
}

/**
 * A class that provides a centralized API for managing progress indicators
 */
class ProgressAPI {
  private static instance: ProgressAPI
  private initialized: boolean = false
  private options: ProgressOptions

  private constructor(options: ProgressOptions = {}) {
    this.options = { ...defaultOptions, ...options }
    this.init()
  }

  /**
   * Get the singleton instance of ProgressAPI
   */
  public static getInstance(options?: ProgressOptions): ProgressAPI {
    if (!ProgressAPI.instance) {
      ProgressAPI.instance = new ProgressAPI(options)
    }
    return ProgressAPI.instance
  }

  /**
   * Initialize the progress bar with configuration and route change handlers
   */
  private init(): void {
    if (this.initialized) return

    // Configure NProgress
    BProgress.configure(this.options)

    // Setup route change handlers
    Router.events.on('routeChangeStart', 
      debounce(() => this.start(), 300)
    )
    Router.events.on('routeChangeComplete', () => this.done())
    Router.events.on('routeChangeError', () => this.done())

    this.initialized = true
  }

  /**
   * Start the progress bar
   * @param initialValue - Optional initial progress value (0-1)
   */
  public start(initialValue?: number): void {
    if (typeof initialValue === 'number') {
      BProgress.set(Math.min(1, Math.max(0, initialValue)))
    } else {
      BProgress.start()
    }
  }

  /**
   * Set the progress to a specific value
   * @param value - Progress value (0-1)
   */
  public set(value: number): void {
    BProgress.set(Math.min(1, Math.max(0, value)))
  }

  /**
   * Increment the progress by a small random amount
   */
  public increment(): void {
    BProgress.inc()
  }

  /**
   * Complete the progress bar
   */
  public done(): void {
    BProgress.done()
  }

  /**
   * Remove the progress bar
   */
  public remove(): void {
    BProgress.remove()
  }

  /**
   * Check if the progress bar is currently active
   */
  public isStarted(): boolean {
    return typeof BProgress.status === 'number'
  }
}

// Export singleton instance
export const progressApi = ProgressAPI.getInstance()

// Export type
