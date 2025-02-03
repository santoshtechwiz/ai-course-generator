import { useQuery } from "@tanstack/react-query"
import { getQuizzes } from "@/app/actions/getQuizes"

export function useQuizzes(page: number, pageSize: number, search: string, userId?: string) {
  return useQuery({
    queryKey: ["quizzes", page, pageSize, search, userId],
    queryFn: () => getQuizzes(page, pageSize, search, userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

