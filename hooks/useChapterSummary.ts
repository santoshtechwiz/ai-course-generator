import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useGlobalLoader } from "@/store/global-loader"

interface SummaryResponse {
  success: boolean
  data?: string
  message?: string
}

const fetchChapterSummary = async (chapterId: number): Promise<SummaryResponse> => {
  const response = await axios.post<SummaryResponse>(`/api/summary`, { chapterId })
  return response.data
}

/**
 * Hook to fetch and manage chapter summary data
 * @param chapterId - The ID of the chapter to get summary for
 * @returns Query object with summary data and status
 */
export const useChapterSummary = (chapterId: number) => {
  const { withLoading } = useGlobalLoader()

  return useQuery({
    queryKey: ["chapterSummary", chapterId],
    queryFn: () => withLoading(fetchChapterSummary(chapterId)),
    retry: 3,
    retryDelay: 60000, // 1 minute
    enabled: false, // Disable automatic fetching
    refetchInterval: false, // Disable automatic refetching
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    cacheTime: 30 * 60 * 1000, // Cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  })
}
