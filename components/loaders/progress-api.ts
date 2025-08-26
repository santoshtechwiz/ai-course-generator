"use client"

import NProgress from 'nprogress'
import Router from 'next/router'

export interface ProgressOptions {
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
 * Default configuration for NProgress
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
    NProgress.configure(this.options)

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
      NProgress.set(Math.min(1, Math.max(0, initialValue)))
    } else {
      NProgress.start()
    }
  }

  /**
   * Set the progress to a specific value
   * @param value - Progress value (0-1)
   */
  public set(value: number): void {
    NProgress.set(Math.min(1, Math.max(0, value)))
  }

  /**
   * Increment the progress by a small random amount
   */
  public increment(): void {
    NProgress.inc()
  }

  /**
   * Complete the progress bar
   */
  public done(): void {
    NProgress.done()
  }

  /**
   * Remove the progress bar
   */
  public remove(): void {
    NProgress.remove()
  }

  /**
   * Check if the progress bar is currently active
   */
  public isStarted(): boolean {
    return typeof NProgress.status === 'number'
  }
}

// Export singleton instance
export const progressApi = ProgressAPI.getInstance()

// Export type
export type { ProgressAPI }
