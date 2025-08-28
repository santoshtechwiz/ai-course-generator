"use client"

/**
 * Hook to integrate TanStack Query with the existing Loader component
 * Provides consistent loading states and progress indication
 */

import React, { useCallback } from "react"
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query"
import { useProgress } from "@/components/loaders/use-progress"

interface QueryOptions<TData = unknown, TError = unknown> extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  showProgress?: boolean
  progressMessage?: string
}

interface MutationOptions<TData = unknown, TError = unknown, TVariables = unknown> extends Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> {
  showProgress?: boolean
  progressMessage?: string
}

/**
 * Enhanced useQuery hook that integrates with the progress system
 */
export function useQueryWithProgress<TData = unknown, TError = unknown>(
  queryKey: any[],
  queryFn: () => Promise<TData>,
  options: QueryOptions<TData, TError> = {}
) {
  const { showProgress = true, progressMessage = "Loading...", ...queryOptions } = options
  const { start, complete } = useProgress()

  const query = useQuery({
    queryKey,
    queryFn,
    ...queryOptions,
    onSettled: (data, error) => {
      if (showProgress) {
        complete()
      }
      queryOptions.onSettled?.(data, error)
    }
  })

  // Start progress when query begins
  React.useEffect(() => {
    if (showProgress && query.isFetching && !query.isLoading) {
      start()
    }
  }, [query.isFetching, query.isLoading, showProgress, start])

  return {
    ...query,
    // Add progress-aware loading state
    isLoadingWithProgress: query.isLoading || (query.isFetching && showProgress)
  }
}

/**
 * Enhanced useMutation hook that integrates with the progress system
 */
export function useMutationWithProgress<TData = unknown, TError = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: MutationOptions<TData, TError, TVariables> = {}
) {
  const { showProgress = true, progressMessage = "Processing...", ...mutationOptions } = options
  const { start, complete } = useProgress()

  const mutation = useMutation({
    mutationFn,
    ...mutationOptions,
    onMutate: async (variables) => {
      if (showProgress) {
        start()
      }
      return mutationOptions.onMutate?.(variables)
    },
    onSettled: (data, error, variables, context) => {
      if (showProgress) {
        complete()
      }
      mutationOptions.onSettled?.(data, error, variables, context)
    }
  })

  return mutation
}

/**
 * Hook to prefetch data with progress indication
 */
export function usePrefetchWithProgress() {
  const queryClient = useQueryClient()
  const { start, complete } = useProgress()

  const prefetchQuery = useCallback(async (
    queryKey: any[],
    queryFn: () => Promise<any>,
    options: { showProgress?: boolean } = {}
  ) => {
    const { showProgress = false } = options

    if (showProgress) {
      start()
    }

    try {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
    } finally {
      if (showProgress) {
        complete()
      }
    }
  }, [queryClient, start, complete])

  return { prefetchQuery }
}

/**
 * Hook to invalidate queries with progress indication
 */
export function useInvalidateWithProgress() {
  const queryClient = useQueryClient()
  const { start, complete } = useProgress()

  const invalidateQueries = useCallback(async (
    queryKey: any[],
    options: { showProgress?: boolean } = {}
  ) => {
    const { showProgress = false } = options

    if (showProgress) {
      start()
    }

    try {
      await queryClient.invalidateQueries({ queryKey })
    } finally {
      if (showProgress) {
        complete()
      }
    }
  }, [queryClient, start, complete])

  return { invalidateQueries }
}