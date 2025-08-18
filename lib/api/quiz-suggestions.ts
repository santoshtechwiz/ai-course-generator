import { QuizSuggestion, QuizSuggestionsResponse } from "@/types/quiz-suggestions"

export async function fetchQuizSuggestions(
  courseId: number | string,
  chapterId: number | string,
  chapterTitle?: string
): Promise<QuizSuggestion[]> {
  try {
    const response = await fetch(
      `/api/recommendations/quiz-suggestions?courseId=${courseId}&chapterId=${chapterId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.warn('Failed to fetch quiz suggestions:', response.statusText)
      // Return generic suggestions as fallback
      return generateGenericSuggestions(chapterTitle || 'Chapter')
    }

    const data: QuizSuggestionsResponse = await response.json()
    
    if (!data.success || !data.data) {
      console.warn('Invalid quiz suggestions response:', data)
      return generateGenericSuggestions(chapterTitle || 'Chapter')
    }

    return data.data
  } catch (error) {
    console.error('Error fetching quiz suggestions:', error)
    return generateGenericSuggestions(chapterTitle || 'Chapter')
  }
}

function generateGenericSuggestions(chapterTitle: string): QuizSuggestion[] {
  return [
    {
      id: `generic-${Date.now()}-1`,
      title: `${chapterTitle} - Quick Review`,
      description: "Test your understanding of the key concepts",
      estimatedTime: 5,
      difficulty: "easy",
      type: "generic",
    },
    {
      id: `generic-${Date.now()}-2`,
      title: `${chapterTitle} - Deep Dive`,
      description: "Challenge yourself with advanced questions",
      estimatedTime: 10,
      difficulty: "medium",
      type: "generic",
    },
    {
      id: `generic-${Date.now()}-3`,
      title: `${chapterTitle} - Practice Test`,
      description: "Comprehensive assessment of your knowledge",
      estimatedTime: 15,
      difficulty: "hard",
      type: "generic",
    },
  ]
}