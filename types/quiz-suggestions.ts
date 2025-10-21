export interface QuizSuggestion {
  id: string
  title: string
  description: string
  estimatedTime: number
  difficulty: "easy" | "medium" | "hard"
  type: "chapter-quiz" | "user-quiz" | "generic"
  attemptCount?: number
}

export interface QuizSuggestionsResponse {
  success: boolean
  data: QuizSuggestion[]
  error?: string
}

interface QuizSuggestionsRequest {
  courseId: string
  chapterId: string
}