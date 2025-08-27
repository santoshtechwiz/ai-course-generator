/**
 * Factory for creating async thunks with built-in race condition prevention
 * and request deduplication
 */

import { createAsyncThunk, AsyncThunkPayloadCreator } from '@reduxjs/toolkit'
import { RequestManager, getErrorMessage } from './async-state'

// Cache for request deduplication
const requestCache = new Map<string, Promise<any>>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CreateAsyncThunkOptions<T, K> {
  typePrefix: string
  payloadCreator: AsyncThunkPayloadCreator<T, K>
  requestKey?: (arg: K) => string
  cacheTTL?: number
  skipCache?: boolean
  enableAbortController?: boolean
}

// Create an async thunk with race condition prevention and caching
export function createEnhancedAsyncThunk<T, K = void>(
  options: CreateAsyncThunkOptions<T, K>
) {
  const {
    typePrefix,
    payloadCreator,
    requestKey,
    cacheTTL = CACHE_TTL,
    skipCache = false,
    enableAbortController = true,
  } = options

  return createAsyncThunk<T, K>(
    typePrefix,
    async (arg, thunkAPI) => {
      const key = requestKey ? requestKey(arg) : typePrefix
      
      // Check cache first (if enabled)
      if (!skipCache && requestCache.has(key)) {
        const cachedPromise = requestCache.get(key)
        if (cachedPromise) {
          try {
            return await cachedPromise
          } catch (error) {
            // If cached request failed, remove from cache and continue
            requestCache.delete(key)
          }
        }
      }

      // Set up abort controller if enabled
      let abortController: AbortController | undefined
      if (enableAbortController) {
        abortController = RequestManager.create(key)
        
        // Check if request was aborted before starting
        if (abortController.signal.aborted) {
          return thunkAPI.rejectWithValue('Request was cancelled')
        }
      }

      try {
        // Create the actual request promise
        const requestPromise = payloadCreator(arg, {
          ...thunkAPI,
          signal: abortController?.signal || thunkAPI.signal,
        })

        // Cache the request promise if caching is enabled
        if (!skipCache) {
          requestCache.set(key, requestPromise)
          
          // Clean up cache after TTL
          setTimeout(() => {
            requestCache.delete(key)
          }, cacheTTL)
        }

        const result = await requestPromise
        
        // Clean up abort controller
        if (enableAbortController) {
          RequestManager.cancel(key)
        }
        
        return result
      } catch (error) {
        // Clean up on error
        requestCache.delete(key)
        if (enableAbortController) {
          RequestManager.cancel(key)
        }

        // Handle abort errors gracefully
        if (error instanceof Error && error.name === 'AbortError') {
          return thunkAPI.rejectWithValue('Request was cancelled')
        }

        return thunkAPI.rejectWithValue(getErrorMessage(error))
      }
    }
  )
}

// Utility to create fetch-based async thunks with timeout and abort support
export function createFetchThunk<T, K = void>(
  typePrefix: string,
  urlBuilder: (arg: K) => string,
  options: {
    method?: string
    body?: (arg: K) => any
    headers?: HeadersInit
    timeout?: number
    skipCache?: boolean
    requestKey?: (arg: K) => string
    processResponse?: (response: Response) => Promise<T>
  } = {}
) {
  const {
    method = 'GET',
    body,
    headers,
    timeout = 10000,
    skipCache = false,
    requestKey,
    processResponse = (response) => response.json(),
  } = options

  return createEnhancedAsyncThunk<T, K>({
    typePrefix,
    requestKey,
    skipCache,
    payloadCreator: async (arg, { signal }) => {
      const url = urlBuilder(arg)
      const controller = new AbortController()
      
      // Set up timeout
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      // Combine signals if provided
      if (signal?.aborted) {
        clearTimeout(timeoutId)
        throw new Error('Request was cancelled')
      }
      
      signal?.addEventListener('abort', () => {
        controller.abort()
      })

      try {
        const fetchOptions: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          signal: controller.signal,
        }

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          fetchOptions.body = JSON.stringify(body(arg))
        }

        const response = await fetch(url, fetchOptions)
        clearTimeout(timeoutId)

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`
          try {
            const errorData = await response.json()
            if (errorData.message) {
              errorMessage = errorData.message
            }
          } catch {
            // Use default error message if JSON parsing fails
          }
          throw new Error(errorMessage)
        }

        return await processResponse(response)
      } catch (error) {
        clearTimeout(timeoutId)
        
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timed out')
        }
        
        throw error
      }
    },
  })
}

// Utility for creating quiz/content fetch thunks with common patterns
export function createContentFetchThunk<T>(
  typePrefix: string,
  contentType: 'quiz' | 'flashcard' | 'course',
  options: {
    skipCache?: boolean
    timeout?: number
  } = {}
) {
  return createFetchThunk<T, { slug: string; type?: string }>(
    typePrefix,
    ({ slug, type }) => {
      if (contentType === 'quiz' || contentType === 'flashcard') {
        return `/api/quizzes/${type || contentType}/${slug}`
      }
      return `/api/courses/${slug}`
    },
    {
      ...options,
      requestKey: ({ slug, type }) => `${contentType}-${type || ''}-${slug}`,
      processResponse: async (response) => {
        const data = await response.json()
        
        // Validate required fields based on content type
        if (contentType === 'quiz' || contentType === 'flashcard') {
          if (!data.questions || !Array.isArray(data.questions)) {
            throw new Error('Invalid quiz data: missing questions')
          }
        }
        
        return data
      },
    }
  )
}

// Cleanup utility
export function clearRequestCache(): void {
  requestCache.clear()
  RequestManager.cancelAll()
}

// Hook cleanup for components
export function useRequestCleanup(keys: string[]) {
  return () => {
    keys.forEach(key => {
      requestCache.delete(key)
      RequestManager.cancel(key)
    })
  }
}