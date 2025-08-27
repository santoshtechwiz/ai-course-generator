/**
 * Unified async state pattern utilities for Redux slices
 * Prevents race conditions and provides consistent loading/error states
 */

import { SerializedError } from '@reduxjs/toolkit'

// Unified async state interface
export interface AsyncState<T = any> {
  data: T | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  lastUpdated: number | null
  isStale: boolean
}

// Enhanced async state with abort controller support
export interface EnhancedAsyncState<T = any> extends AsyncState<T> {
  requestId: string | null
  abortController: AbortController | null
}

// Create initial async state
export function createInitialAsyncState<T = any>(data: T | null = null): AsyncState<T> {
  return {
    data,
    status: 'idle',
    error: null,
    lastUpdated: null,
    isStale: false,
  }
}

// Create enhanced async state with abort controller
export function createEnhancedAsyncState<T = any>(data: T | null = null): EnhancedAsyncState<T> {
  return {
    ...createInitialAsyncState(data),
    requestId: null,
    abortController: null,
  }
}

// Check if state should update (prevent stale overwrites)
export function shouldUpdateState(
  currentState: AsyncState<any>,
  incomingTimestamp: number,
  requestId?: string
): boolean {
  // Always allow if no timestamp exists
  if (!currentState.lastUpdated) return true
  
  // Only update if incoming data is newer
  return incomingTimestamp >= currentState.lastUpdated
}

// Create pending state update
export function createPendingUpdate(
  state: AsyncState<any> | EnhancedAsyncState<any>,
  requestId?: string
): Partial<AsyncState<any> | EnhancedAsyncState<any>> {
  const update: any = {
    status: 'loading' as const,
    error: null,
    isStale: false,
  }
  
  if ('requestId' in state && requestId) {
    update.requestId = requestId
  }
  
  return update
}

// Create fulfilled state update
export function createFulfilledUpdate<T>(
  data: T,
  timestamp?: number
): Partial<AsyncState<T>> {
  return {
    data,
    status: 'succeeded',
    error: null,
    lastUpdated: timestamp || Date.now(),
    isStale: false,
  }
}

// Create rejected state update
export function createRejectedUpdate(
  error: string | SerializedError,
  preserveData = true
): Partial<AsyncState<any>> {
  const errorMessage = typeof error === 'string' 
    ? error 
    : error.message || 'An error occurred'
    
  const update: Partial<AsyncState<any>> = {
    status: 'failed',
    error: errorMessage,
    isStale: true,
  }
  
  // Only clear data if explicitly requested
  if (!preserveData) {
    update.data = null
  }
  
  return update
}

// Abort controller utilities
export class RequestManager {
  private static requests = new Map<string, AbortController>()
  
  static create(key: string): AbortController {
    // Cancel existing request if any
    this.cancel(key)
    
    const controller = new AbortController()
    this.requests.set(key, controller)
    return controller
  }
  
  static cancel(key: string): void {
    const controller = this.requests.get(key)
    if (controller && !controller.signal.aborted) {
      controller.abort()
    }
    this.requests.delete(key)
  }
  
  static cancelAll(): void {
    this.requests.forEach((controller) => {
      if (!controller.signal.aborted) {
        controller.abort()
      }
    })
    this.requests.clear()
  }
  
  static isAborted(key: string): boolean {
    const controller = this.requests.get(key)
    return controller?.signal.aborted ?? true
  }
}

// Error utilities
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'An unknown error occurred'
}

// State staleness utilities
export const STALENESS_THRESHOLDS = {
  IMMEDIATE: 30 * 1000,      // 30 seconds
  SHORT: 5 * 60 * 1000,      // 5 minutes  
  MEDIUM: 15 * 60 * 1000,    // 15 minutes
  LONG: 60 * 60 * 1000,      // 1 hour
}

export function isStateStale(
  lastUpdated: number | null, 
  threshold = STALENESS_THRESHOLDS.MEDIUM
): boolean {
  if (!lastUpdated) return true
  return Date.now() - lastUpdated > threshold
}

export function markAsStale(state: AsyncState<any>): void {
  state.isStale = true
}

// Type guards
export function isLoadingState(state: AsyncState<any>): boolean {
  return state.status === 'loading'
}

export function isSuccessState(state: AsyncState<any>): boolean {
  return state.status === 'succeeded'
}

export function isErrorState(state: AsyncState<any>): boolean {
  return state.status === 'failed'
}

export function hasData<T>(state: AsyncState<T>): state is AsyncState<T> & { data: T } {
  return state.data !== null && state.data !== undefined
}