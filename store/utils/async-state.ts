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

// Check if state should update (prevent stale overwrites)
export function shouldUpdateState(
  currentState: AsyncState<any>,
  incomingTimestamp: number
): boolean {
  // Always allow if no timestamp exists
  if (!currentState.lastUpdated) return true
  
  // Only update if incoming data is newer
  return incomingTimestamp >= currentState.lastUpdated
}

// Create pending state update
export function createPendingUpdate(
  state: AsyncState<any>,
): Partial<AsyncState<any>> {
  const update: any = {
    status: 'loading' as const,
    error: null,
    isStale: false,
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