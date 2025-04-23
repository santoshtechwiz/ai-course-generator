// Define all quiz session storage functions in one place for better organization

// Generate a unique session ID for the current browser session
function getSessionId(): string {
  if (typeof window === "undefined") return ""
  let sessionId = sessionStorage.getItem("sessionId")
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem("sessionId", sessionId)
  }
  return sessionId
}

// Clear all quiz data from storage
export function clearAllQuizData() {
  if (typeof window === "undefined") return

  const sessionId = getSessionId()

  // Clear all quiz-related data from localStorage and sessionStorage
  Object.keys(localStorage).forEach((key) => {
    if (
      key.startsWith("quiz_") ||
      key.includes("QuizState") ||
      key.includes("guestQuizResults") ||
      key.includes("currentQuizState")
    ) {
      localStorage.removeItem(key)
    }
  })

  Object.keys(sessionStorage).forEach((key) => {
    if (
      key.startsWith("quiz_") ||
      key.includes("QuizState") ||
      key.includes("guestQuizResults") ||
      key.includes("currentQuizState") ||
      key.includes(sessionId)
    ) {
      sessionStorage.removeItem(key)
    }
  })

  console.log("Cleared all quiz data from storage")
}

// Improve the getSavedQuizState function to better handle the quiz state
// Update the function to ensure we're properly retrieving the answers:

export function getSavedQuizState() {
  if (typeof window === "undefined") return null

  try {
    const stateStr = sessionStorage.getItem("quizState")
    if (!stateStr) {
      console.log("No quiz state found in session storage")
      return null
    }

    const state = JSON.parse(stateStr)
    console.log("Retrieved quiz state from session storage:", state)

    // Ensure the redirectPath is properly formatted
    if (state.quizState && state.quizState.redirectPath) {
      // Make sure it uses /dashboard/ not /quiz/
      if (state.quizState.redirectPath.includes("/quiz/")) {
        state.quizState.redirectPath = state.quizState.redirectPath.replace("/quiz/", "/dashboard/")
      }

      // Add completed=true parameter if the quiz is completed
      if (state.quizState.isCompleted && !state.quizState.redirectPath.includes("completed=true")) {
        state.quizState.redirectPath += `${state.quizState.redirectPath.includes("?") ? "&" : "?"}completed=true`
      }
    }

    return state
  } catch (error) {
    console.error("Error getting saved quiz state:", error)
    return null
  }
}

// Add a new function to ensure we're saving the quiz state properly
export function saveQuizStateWithAnswers(
  quizId: string,
  quizType: string,
  slug: string,
  answers: any[],
  isCompleted: boolean,
) {
  if (typeof window === "undefined") return

  try {
    const sessionId = getSessionId()

    // Create a redirectPath that includes the completed parameter if needed
    let redirectPath = `/dashboard/${quizType}/${slug}`
    if (isCompleted) {
      redirectPath += `${redirectPath.includes("?") ? "&" : "?"}completed=true`
    }

    // Save to sessionStorage for the auth flow
    sessionStorage.setItem(
      `quizState_${sessionId}`,
      JSON.stringify({
        quizState: {
          quizId,
          quizType,
          slug,
          isCompleted,
          redirectPath,
        },
        answers,
      }),
    )

    // Also save to localStorage for persistence
    localStorage.setItem(
      `quiz_state_${quizType}_${quizId}_${sessionId}`,
      JSON.stringify({
        quizId,
        quizType,
        slug,
        isCompleted,
        answers,
        timestamp: Date.now(),
      }),
    )

    console.log("Saved quiz state with answers:", {
      quizId,
      quizType,
      slug,
      isCompleted,
      redirectPath,
      answersCount: answers.length,
    })
  } catch (error) {
    console.error("Error saving quiz state with answers:", error)
  }
}

// Clear saved quiz state from session storage
export function clearSavedQuizState() {
  if (typeof window === "undefined") return

  try {
    sessionStorage.removeItem("quizState")
    console.log("Cleared saved quiz state from session storage")
  } catch (error) {
    console.error("Error clearing saved quiz state:", error)
  }
}

// Save quiz answers to local storage
export function saveQuizAnswers(quizId: string, answers: any[]) {
  if (typeof window === "undefined") return

  try {
    const storageKey = `quiz_answers_${quizId}`
    localStorage.setItem(storageKey, JSON.stringify(answers))
    console.log(`Saved ${answers.length} quiz answers to localStorage for quiz ${quizId}`)

    // Also save to a backup location
    localStorage.setItem(`quiz_answers_backup_${quizId}`, JSON.stringify(answers))

    // Save to session storage as well for redundancy
    sessionStorage.setItem(storageKey, JSON.stringify(answers))
  } catch (error) {
    console.error("Error saving quiz answers:", error)
  }
}

// Load quiz answers from local storage
export function loadQuizAnswers(quizId: string): any[] | null {
  try {
    if (typeof window === "undefined") return null

    // Try multiple storage keys
    const storageKeys = [
      `quiz_answers_${quizId}`,
      `quiz_answers_backup_${quizId}`,
      `quiz_state_blanks_${quizId}`,
      `quiz_state_mcq_${quizId}`,
      `quiz_state_openended_${quizId}`,
      `quiz_state_code_${quizId}`,
      `quiz_result_${quizId}`,
      `guestQuizResults_${quizId}`,
    ]

    for (const key of storageKeys) {
      const data = localStorage.getItem(key) || sessionStorage.getItem(key)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          if (parsed.answers && Array.isArray(parsed.answers) && parsed.answers.length > 0) {
            console.log(`Found answers in ${key}:`, parsed.answers)
            return parsed.answers
          } else if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`Found answers array in ${key}:`, parsed)
            return parsed
          }
        } catch (e) {
          console.error(`Error parsing data from ${key}:`, e)
        }
      }
    }

    // Check all localStorage keys for anything that might contain answers for this quiz
    if (typeof window !== "undefined") {
      const allKeys = Object.keys(localStorage)
      for (const key of allKeys) {
        if (key.includes(quizId) && !storageKeys.includes(key)) {
          try {
            const data = localStorage.getItem(key)
            if (data) {
              const parsed = JSON.parse(data)
              if (parsed.answers && Array.isArray(parsed.answers) && parsed.answers.length > 0) {
                console.log(`Found answers in unexpected key ${key}:`, parsed.answers)
                return parsed.answers
              } else if (Array.isArray(parsed) && parsed.length > 0) {
                console.log(`Found answers array in unexpected key ${key}:`, parsed)
                return parsed
              }
            }
          } catch (e) {
            console.error(`Error parsing data from unexpected key ${key}:`, e)
          }
        }
      }
    }

    return null
  } catch (e) {
    console.error("Error loading quiz answers:", e)
    return null
  }
}

// Load quiz result from local storage
export function loadQuizResult(quizId: string): any | null {
  try {
    if (typeof window === "undefined") return null

    // Try multiple storage keys
    const storageKeys = [
      `quiz_result_${quizId}`,
      `guestQuizResults_${quizId}`,
      `quiz_answers_${quizId}`,
      `quiz_answers_backup_${quizId}`,
    ]

    for (const key of storageKeys) {
      const data = localStorage.getItem(key) || sessionStorage.getItem(key)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          // If it's a result object with answers
          if (parsed.answers && Array.isArray(parsed.answers)) {
            console.log(`Found result in ${key}:`, parsed)
            return parsed
          }
          // If it's just an array of answers, convert it to a result object
          else if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`Found answers array in ${key}, converting to result:`, parsed)
            const correctCount = parsed.filter((a) => a && a.isCorrect).length
            const score = Math.round((correctCount / parsed.length) * 100)
            return {
              answers: parsed,
              score,
              timestamp: Date.now(),
            }
          }
        } catch (e) {
          console.error(`Error parsing data from ${key}:`, e)
        }
      }
    }

    // Check in the guestQuizResults array
    const guestResultsStr = localStorage.getItem("guestQuizResults")
    if (guestResultsStr) {
      try {
        const guestResults = JSON.parse(guestResultsStr)
        if (Array.isArray(guestResults)) {
          const result = guestResults.find((r) => r.quizId === quizId)
          if (result) {
            console.log(`Found result in guestQuizResults array:`, result)
            return result
          }
        }
      } catch (e) {
        console.error("Error parsing guestQuizResults:", e)
      }
    }

    // Check all localStorage keys for anything that might contain a result for this quiz
    if (typeof window !== "undefined") {
      const allKeys = Object.keys(localStorage)
      for (const key of allKeys) {
        if (key.includes(quizId) && !storageKeys.includes(key)) {
          try {
            const data = localStorage.getItem(key)
            if (data) {
              const parsed = JSON.parse(data)
              if (parsed.answers && Array.isArray(parsed.answers)) {
                console.log(`Found result in unexpected key ${key}:`, parsed)
                return parsed
              }
            }
          } catch (e) {
            console.error(`Error parsing data from unexpected key ${key}:`, e)
          }
        }
      }
    }

    return null
  } catch (e) {
    console.error("Error loading quiz result:", e)
    return null
  }
}

// Verify if a quiz has been completed
export function verifyQuizCompletion(quizId: string): boolean {
  if (typeof window === "undefined") return false

  // Check if there's a saved result in localStorage
  const savedResult = localStorage.getItem(`quiz_result_${quizId}`)
  if (!savedResult) return false

  try {
    const result = JSON.parse(savedResult)
    return !!result && !!result.timestamp && !!result.answers && result.answers.length > 0
  } catch (e) {
    console.error("Error verifying quiz completion:", e)
    return false
  }
}

// Save quiz result to local storage
export function saveQuizResult(quizId: string, result: any) {
  if (typeof window === "undefined") return

  try {
    const resultWithTimestamp = {
      ...result,
      timestamp: Date.now(),
    }

    // Save to multiple locations for redundancy
    localStorage.setItem(`quiz_result_${quizId}`, JSON.stringify(resultWithTimestamp))
    localStorage.setItem(`quiz_result_backup_${quizId}`, JSON.stringify(resultWithTimestamp))
    sessionStorage.setItem(`quiz_result_${quizId}`, JSON.stringify(resultWithTimestamp))

    // Also save the answers separately
    if (result.answers && Array.isArray(result.answers)) {
      saveQuizAnswers(quizId, result.answers)
    }

    console.log(`Saved quiz result to storage for quiz ${quizId}:`, resultWithTimestamp)
  } catch (error) {
    console.error("Error saving quiz result:", error)
  }
}

// Add this function to calculate similarity between strings
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 100
  if (!str1 || !str2) return 0

  // Normalize strings
  const a = str1.toLowerCase().trim()
  const b = str2.toLowerCase().trim()

  if (a === b) return 100

  // Simple Levenshtein distance implementation
  const matrix = []

  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  // Increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          ),
        )
      }
    }
  }

  // Calculate similarity as a percentage
  const maxLength = Math.max(a.length, b.length)
  const distance = matrix[b.length][a.length]
  const similarity = ((maxLength - distance) / maxLength) * 100

  return Math.round(similarity)
}

// Add a new function to handle the auth flow transition
// Add this function to the file:

// Handle the transition from guest to authenticated user
export function handleAuthFlowTransition() {
  if (typeof window === "undefined") return

  try {
    // Check if we're in an auth flow
    const inAuthFlow = sessionStorage.getItem("inAuthFlow") === "true"

    if (inAuthFlow) {
      console.log("Detected auth flow transition, handling pending quiz data")

      // Get the pending quiz data
      const pendingQuizDataStr = sessionStorage.getItem("pendingQuizData")
      if (pendingQuizDataStr) {
        const pendingQuizData = JSON.parse(pendingQuizDataStr)

        // Check if we have valid quiz data
        if (pendingQuizData && pendingQuizData.quizId && pendingQuizData.quizType) {
          console.log("Found pending quiz data:", pendingQuizData)

          // Get any saved guest results for this quiz
          const guestResultKey = `guestQuizResults_${pendingQuizData.quizId}`
          const guestResultStr = localStorage.getItem(guestResultKey)

          if (guestResultStr) {
            console.log("Found guest results to transfer")

            // Mark these results for transfer to the user account
            sessionStorage.setItem("transferGuestResults", guestResultStr)
          }
        }
      }
    }

    // Clear the auth flow markers
    sessionStorage.removeItem("inAuthFlow")
    sessionStorage.removeItem("pendingQuizData")
    localStorage.removeItem("preserveGuestResults")
  } catch (error) {
    console.error("Error handling auth flow transition:", error)
  }
}

// Add a function to check if there are guest results to transfer
export function hasGuestResultsToTransfer(): boolean {
  if (typeof window === "undefined") return false

  try {
    return !!sessionStorage.getItem("transferGuestResults")
  } catch (error) {
    console.error("Error checking for guest results to transfer:", error)
    return false
  }
}

// Add a function to get guest results to transfer
export function getGuestResultsToTransfer() {
  if (typeof window === "undefined") return null

  try {
    const resultsStr = sessionStorage.getItem("transferGuestResults")
    if (!resultsStr) return null

    // Clear the transfer marker
    sessionStorage.removeItem("transferGuestResults")

    return JSON.parse(resultsStr)
  } catch (error) {
    console.error("Error getting guest results to transfer:", error)
    return null
  }
}

// Improve the clearGuestQuizResults function to be more thorough
// Replace this:

// With this improved version:
export function clearGuestQuizResults(quizId: string, quizType?: string) {
  if (typeof window === "undefined") return

  // Check if we should preserve guest results during auth flow
  if (localStorage.getItem("preserveGuestResults") === "true") {
    console.log(`Preserving guest results for quiz ${quizId} during auth flow`)
    return
  }

  try {
    // Clear from both localStorage and sessionStorage to be thorough
    localStorage.removeItem(`guestQuizResults_${quizId}`)
    sessionStorage.removeItem(`guestQuizResults_${quizId}`)

    // Clear all related quiz state
    if (quizType) {
      localStorage.removeItem(`quiz_state_${quizType}_${quizId}`)
      sessionStorage.removeItem(`quiz_state_${quizType}_${quizId}`)
    } else {
      // If quizType is not provided, try to clear all possible types
      const quizTypes = ["mcq", "openended", "blanks", "code", "flashcard"]
      quizTypes.forEach((type) => {
        localStorage.removeItem(`quiz_state_${type}_${quizId}`)
        sessionStorage.removeItem(`quiz_state_${type}_${quizId}`)
      })
    }

    // Clear answers
    localStorage.removeItem(`quiz_answers_${quizId}`)
    sessionStorage.removeItem(`quiz_answers_${quizId}`)

    // Clear quiz result
    localStorage.removeItem(`quiz_result_${quizId}`)
    sessionStorage.removeItem(`quiz_result_${quizId}`)

    console.log(`Cleared guest quiz results for quiz ${quizId}`)
  } catch (error) {
    console.error("Error clearing guest quiz results:", error)
  }
}

// Add a function to check if a user has guest results that need to be saved
export function hasGuestResults(quizId: string): boolean {
  if (typeof window === "undefined") return false

  try {
    // Check for guest results in localStorage
    const guestResults = localStorage.getItem(`guestQuizResults_${quizId}`)
    if (guestResults) {
      return true
    }

    // Check for quiz results that might need to be saved
    const quizResult = localStorage.getItem(`quiz_result_${quizId}`)
    if (quizResult) {
      const result = JSON.parse(quizResult)
      // If the result has answers and is marked as completed, it might need to be saved
      return !!result && !!result.isCompleted && !!result.answers && result.answers.length > 0
    }

    return false
  } catch (error) {
    console.error("Error checking for guest results:", error)
    return false
  }
}

// Clear guest results when user authenticates
export function clearGuestResultsOnAuth() {
  if (typeof window === "undefined") return

  try {
    const sessionId = getSessionId()

    Object.keys(localStorage).forEach((key) => {
      if (key.includes("guestQuizResults") || key.includes(sessionId)) {
        localStorage.removeItem(key)
      }
    })

    Object.keys(sessionStorage).forEach((key) => {
      if (key.includes("guestQuizResults") || key.includes(sessionId)) {
        sessionStorage.removeItem(key)
      }
    })

    console.log("Cleared guest quiz results after user authentication")
  } catch (error) {
    console.error("Error clearing guest quiz results on auth:", error)
  }
}

// Add a new function to preserve quiz answers during authentication
export function preserveQuizAnswers(quizId: string, answers: any[]) {
  if (typeof window === "undefined") return

  try {
    // Save to both localStorage and sessionStorage for redundancy
    const storageKey = `auth_transition_answers_${quizId}`
    const data = {
      answers,
      timestamp: Date.now(),
    }

    localStorage.setItem(storageKey, JSON.stringify(data))
    sessionStorage.setItem(storageKey, JSON.stringify(data))

    // Set a flag to indicate we're preserving answers during auth
    localStorage.setItem("preserveQuizAnswers", "true")

    console.log(`Preserved ${answers.length} answers for quiz ${quizId} during authentication`)
  } catch (error) {
    console.error("Error preserving quiz answers:", error)
  }
}

// Add a function to retrieve preserved answers after authentication
export function getPreservedAnswers(quizId: string) {
  if (typeof window === "undefined") return null

  try {
    // Try sessionStorage first (more likely to survive a page refresh)
    const sessionData = sessionStorage.getItem(`auth_transition_answers_${quizId}`)
    if (sessionData) {
      const data = JSON.parse(sessionData)
      console.log(`Retrieved preserved answers from sessionStorage for quiz ${quizId}:`, data)

      // Clean up after retrieving
      sessionStorage.removeItem(`auth_transition_answers_${quizId}`)

      return data.answers
    }

    // Fall back to localStorage
    const localData = localStorage.getItem(`auth_transition_answers_${quizId}`)
    if (localData) {
      const data = JSON.parse(localData)
      console.log(`Retrieved preserved answers from localStorage for quiz ${quizId}:`, data)

      // Clean up after retrieving
      localStorage.removeItem(`auth_transition_answers_${quizId}`)

      return data.answers
    }

    // Clear the preservation flag
    localStorage.removeItem("preserveQuizAnswers")

    return null
  } catch (error) {
    console.error("Error retrieving preserved answers:", error)
    return null
  }
}

// Add a function to search all storage for quiz answers
export function searchAllStorageForAnswers(quizId: string) {
  if (typeof window === "undefined") return null

  try {
    console.log(`Searching all storage for answers to quiz ${quizId}`)

    // Define all possible storage keys that might contain answers
    const possibleKeys = [
      `quiz_answers_${quizId}`,
      `quiz_answers_backup_${quizId}`,
      `quiz_result_${quizId}`,
      `quiz_result_backup_${quizId}`,
      `guestQuizResults_${quizId}`,
      `auth_transition_answers_${quizId}`,
      `quiz_state_blanks_${quizId}`,
      `quiz_state_mcq_${quizId}`,
      `quiz_state_openended_${quizId}`,
      `quiz_state_code_${quizId}`,
      `currentQuizState`,
    ]

    // Check localStorage for each key
    for (const key of possibleKeys) {
      const data = localStorage.getItem(key)
      if (data) {
        try {
          const parsed = JSON.parse(data)

          // Check if this contains answers
          if (parsed.answers && Array.isArray(parsed.answers) && parsed.answers.length > 0) {
            console.log(`Found answers in localStorage key ${key}:`, parsed.answers)
            return parsed.answers
          } else if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`Found answers array in localStorage key ${key}:`, parsed)
            return parsed
          }
        } catch (e) {
          console.error(`Error parsing localStorage data for key ${key}:`, e)
        }
      }
    }

    // Check sessionStorage for each key
    for (const key of possibleKeys) {
      const data = sessionStorage.getItem(key)
      if (data) {
        try {
          const parsed = JSON.parse(data)

          // Check if this contains answers
          if (parsed.answers && Array.isArray(parsed.answers) && parsed.answers.length > 0) {
            console.log(`Found answers in sessionStorage key ${key}:`, parsed.answers)
            return parsed.answers
          } else if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`Found answers array in sessionStorage key ${key}:`, parsed)
            return parsed
          }
        } catch (e) {
          console.error(`Error parsing sessionStorage data for key ${key}:`, e)
        }
      }
    }

    // Check all localStorage keys for anything that might contain answers for this quiz
    if (typeof window !== "undefined") {
      const allKeys = Object.keys(localStorage)
      for (const key of allKeys) {
        if (key.includes(quizId) && !possibleKeys.includes(key)) {
          try {
            const data = localStorage.getItem(key)
            if (data) {
              const parsed = JSON.parse(data)
              if (parsed.answers && Array.isArray(parsed.answers) && parsed.answers.length > 0) {
                console.log(`Found answers in unexpected key ${key}:`, parsed.answers)
                return parsed.answers
              } else if (Array.isArray(parsed) && parsed.length > 0) {
                console.log(`Found answers array in unexpected key ${key}:`, parsed)
                return parsed
              }
            }
          } catch (e) {
            console.error(`Error parsing data from unexpected key ${key}:`, e)
          }
        }
      }
    }

    // If we get here, we couldn't find any answers
    console.log(`No answers found in any storage for quiz ${quizId}`)
    return null
  } catch (error) {
    console.error("Error searching all storage for answers:", error)
    return null
  }
}

// Add a new function to create a fallback answer if none is found
export function createFallbackAnswer(quizId: string, quizType: string) {
  console.log(`Creating fallback answer for quiz ${quizId} of type ${quizType}`)

  // Create different fallback answers based on quiz type
  switch (quizType) {
    case "mcq":
      return {
        answer: "Fallback answer",
        timeSpent: 0,
        isCorrect: false,
      }
    case "openended":
      return {
        answer: "Fallback answer",
        timeSpent: 0,
        similarity: 0,
        isCorrect: false,
      }
    case "blanks":
      return {
        answer: "Fallback answer",
        timeSpent: 0,
        isCorrect: false,
      }
    case "code":
      return {
        code: "// Fallback code",
        timeSpent: 0,
        isCorrect: false,
      }
    default:
      return {
        answer: "Fallback answer",
        timeSpent: 0,
        isCorrect: false,
      }
  }
}

// Add a function to debug all storage for a quiz
export function debugQuizStorage(quizId: string) {
  if (typeof window === "undefined") return

  console.log(`Debugging all storage for quiz ${quizId}`)

  // Check localStorage
  console.log("--- localStorage ---")
  Object.keys(localStorage).forEach((key) => {
    if (key.includes(quizId)) {
      try {
        const value = localStorage.getItem(key)
        console.log(`${key}: ${value ? value.substring(0, 100) + "..." : "null"}`)
      } catch (e) {
        console.error(`Error reading localStorage key ${key}:`, e)
      }
    }
  })

  // Check sessionStorage
  console.log("--- sessionStorage ---")
  Object.keys(sessionStorage).forEach((key) => {
    if (key.includes(quizId)) {
      try {
        const value = sessionStorage.getItem(key)
        console.log(`${key}: ${value ? value.substring(0, 100) + "..." : "null"}`)
      } catch (e) {
        console.error(`Error reading sessionStorage key ${key}:`, e)
      }
    }
  })
}

// Add a function to ensure we have answers for a quiz
export function ensureQuizAnswers(quizId: string, quizType: string, questions: any[]) {
  if (typeof window === "undefined") return null

  console.log(`Ensuring answers for quiz ${quizId} of type ${quizType}`)

  // First try to load existing answers
  const existingAnswers = loadQuizAnswers(quizId)
  if (existingAnswers && existingAnswers.length > 0) {
    console.log(`Found ${existingAnswers.length} existing answers`)
    return existingAnswers
  }

  // If no existing answers, search all storage
  const recoveredAnswers = searchAllStorageForAnswers(quizId)
  if (recoveredAnswers && recoveredAnswers.length > 0) {
    console.log(`Recovered ${recoveredAnswers.length} answers`)
    return recoveredAnswers
  }

  // If still no answers, create fallback answers
  console.log(`Creating fallback answers for ${questions.length} questions`)
  const fallbackAnswers = questions.map(() => createFallbackAnswer(quizId, quizType))

  // Save these fallback answers
  saveQuizAnswers(quizId, fallbackAnswers)

  return fallbackAnswers
}
