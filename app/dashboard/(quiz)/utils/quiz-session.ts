import { store } from "@/store"
import { 
  fetchQuiz, 
  submitQuiz, 
  setCurrentQuestionIndex, 
  selectQuizSessionId 
} from "@/store/slices/quizSlice"
import { getQuizSession, hasQuizSession } from "@/store/utils/session"

/**
 * Checks if there's an active session for the given slug
 * and recovers it if possible.
 */
export async function checkForExistingSession(slug: string): Promise<boolean> {
  // Check session storage for any existing sessions
  const sessionId = getSessionIdFromStorage()
  if (!sessionId) return false
  
  // Check if we have a session for this quiz
  const session = getQuizSession(sessionId)
  if (!session) return false
  
  try {
    // Fetch quiz data first
    await store.dispatch(fetchQuiz({ id: slug })).unwrap()
    
    // Set current question index to last saved position
    const answers = session.answers
    const questionIds = Object.keys(answers)
    if (questionIds.length > 0) {
      // Find the highest index
      let highestIndex = 0
      questionIds.forEach(id => {
        const indexMatch = id.match(/\d+$/)
        if (indexMatch) {
          const index = parseInt(indexMatch[0], 10)
          if (index > highestIndex) {
            highestIndex = index
          }
        }
      })
      
      store.dispatch(setCurrentQuestionIndex(highestIndex))
    }
    
    return true
  } catch (error) {
    console.error("Failed to recover session:", error)
    return false
  }
}

/**
 * Gets any session ID stored in browser storage
 */
export function getSessionIdFromStorage(): string | null {
  // Check redux store first
  const state = store.getState()
  const sessionId = selectQuizSessionId(state)
  if (sessionId) return sessionId
  
  // Check session storage
  const keys = Object.keys(sessionStorage)
  for (const key of keys) {
    if (key.startsWith('quiz_session_')) {
      return key.replace('quiz_session_', '')
    }
  }
  
  return null
}

/**
 * Safely submits quiz and handles errors
 */
export async function safeSubmitQuiz(): Promise<boolean> {
  try {
    await store.dispatch(submitQuiz()).unwrap()
    return true
  } catch (error) {
    console.error("Error submitting quiz:", error)
    return false
  }
}
