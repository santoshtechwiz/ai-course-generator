"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useGlobalLoader } from "@/store/global-loader"

interface SummaryResponse {
  success: boolean
  data?: string
  message?: string
}

/**
 * Fetch chapter summary from the API
 * @param chapterId Chapter ID
 * @returns Summary response
 */
async function fetchChapterSummary(chapterId: number): Promise<SummaryResponse> {
  const response = await axios.get<SummaryResponse>(`/api/summary/status/${chapterId}`)
  return response.data
}

/**
 * Generate chapter summary
 * @param chapterId Chapter ID
 * @returns Summary response
 */
async function generateChapterSummary(chapterId: number): Promise<SummaryResponse> {
  const response = await axios.post<SummaryResponse>(`/api/summary`, { chapterId })
  return response.data
}

/**
 * Hook to fetch and manage chapter summary
 * @param chapterId Chapter ID
 * @returns Query result with summary data and generation function
 */
export function useChapterSummary(chapterId: number | undefined) {
  const queryClient = useQueryClient()
  const { withLoading } = useGlobalLoader()

  // Query for fetching the summary
  const summaryQuery = useQuery({
    queryKey: ["chapterSummary", chapterId],
    queryFn: () => (chapterId ? fetchChapterSummary(chapterId) : Promise.reject("No chapter ID provided")),
    enabled: !!chapterId,
    retry: 1,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })

  // Mutation for generating the summary
  const generateMutation = useMutation({
    mutationFn: (id: number) => generateChapterSummary(id),
    onSuccess: () => {
      // Invalidate the summary query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["chapterSummary", chapterId] })
    },
  })

  // Function to generate or refresh the summary
  const generateSummary = () => {
    if (chapterId) {
      generateMutation.mutate(chapterId)
    }
  }

  return {
    ...summaryQuery,
    generateSummary,
    isGenerating: generateMutation.isPending,
    generationError: generateMutation.error,
  }
}

// Backward compatibility
export default useChapterSummary
