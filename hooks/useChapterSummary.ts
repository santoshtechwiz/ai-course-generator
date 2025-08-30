import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-helper"

interface SummaryResponse {
  success: boolean
  data?: string
  message?: string
}

const fetchChapterSummary = async (chapterId: number): Promise<SummaryResponse> => {
  return await apiRequest(`/api/summary`, { method: 'POST', body: JSON.stringify({ chapterId }) })
}

/**
 * Hook to fetch and manage chapter summary data
 * @param chapterId - The ID of the chapter to get summary for
 * @returns Query object with summary data and status
 */
export const useChapterSummary = (chapterId: number) => {

  return useQuery({
    queryKey: ["chapterSummary", chapterId],
    queryFn: () => fetchChapterSummary(chapterId),
    retry: 3,
    retryDelay: 60000, // 1 minute
    enabled: false, // Disable automatic fetching
    refetchInterval: false, // Disable automatic refetching
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  })
}
