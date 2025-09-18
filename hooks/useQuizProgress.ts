import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface QuizProgress {
  quizId: string
  progress: number
  isCompleted: boolean
  bestScore: number
  attemptsCount: number
  lastAttemptAt: string | null
  averageScore: number
  averageTime: number
  recentAttempts: Array<{
    id: string
    score: number
    timeSpent: number
    createdAt: string
    correctAnswers: number
    totalQuestions: number
  }>
}

const fetchQuizProgress = async (quizId: string): Promise<QuizProgress> => {
  const response = await fetch(`/api/user/quiz-progress/${quizId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch quiz progress')
  }
  return response.json()
}

const updateQuizProgress = async (data: {
  quizId: string
  progress?: number
  score?: number
  timeSpent?: number
  isCompleted?: boolean
  title?: string
}): Promise<any> => {
  const response = await fetch(`/api/user/quiz-progress/${data.quizId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error('Failed to update quiz progress')
  }
  return response.json()
}

export function useQuizProgress(quizId: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options

  return useQuery({
    queryKey: ['quiz-progress', quizId],
    queryFn: () => fetchQuizProgress(quizId),
    enabled: enabled && !!quizId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useUpdateQuizProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateQuizProgress,
    onSuccess: (data, variables) => {
      // Invalidate and refetch quiz progress
      queryClient.invalidateQueries({
        queryKey: ['quiz-progress', variables.quizId]
      })

      // Also invalidate user stats and quiz attempts
      queryClient.invalidateQueries({
        queryKey: ['user-stats']
      })
      queryClient.invalidateQueries({
        queryKey: ['quiz-attempts']
      })
    }
  })
}

// Hook for multiple quiz progress (useful for dashboard overview)
export function useQuizzesProgress(quizIds: string[]) {
  return useQuery({
    queryKey: ['quizzes-progress', quizIds.sort().join(',')],
    queryFn: async () => {
      const promises = quizIds.map(id => fetchQuizProgress(id))
      const results = await Promise.allSettled(promises)

      return results.map((result, index) => ({
        quizId: quizIds[index],
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }))
    },
    enabled: quizIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}