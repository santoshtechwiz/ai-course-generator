import { useQuery } from "@tanstack/react-query"
import axios from "axios"

interface SummaryResponse {
  success: boolean
  data?: string
  message?: string
}

const fetchChapterSummary = async (chapterId: number): Promise<SummaryResponse> => {
  const response = await axios.post<SummaryResponse>(`/api/summary`, { chapterId })
  return response.data
}

export const useChapterSummary = (chapterId: number) => {
  return useQuery({
    queryKey: ["chapterSummary", chapterId],
    queryFn: () => fetchChapterSummary(chapterId),
    retry: 3,
    retryDelay: 60000, // 1 minute
    enabled: false, // Disable automatic fetching
    refetchInterval: false, // Disable automatic refetching
  })
}

