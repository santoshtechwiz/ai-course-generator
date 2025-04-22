// Define all quiz session storage functions in one place for better organization

// Clear all quiz data from storage
export function clearAllQuizData() {
  if (typeof window === "undefined") return

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
      key.includes("currentQuizState")
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
    // Create a redirectPath that includes the completed parameter if needed
    let redirectPath = `/dashboard/${quizType}/${slug}`
    if (isCompleted) {
      redirectPath += `${redirectPath.includes("?") ? "&" : "?"}completed=true`
    }

    // Save to sessionStorage for the auth flow
    sessionStorage.setItem(
      "quizState",
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
      `quiz_state_${quizType}_${quizId}`,
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
  } catch (error) {
    console.error("Error saving quiz answers:", error)
  }
}

// Load quiz answers from local storage
export function loadQuizAnswers(quizId: string) {
  if (typeof window === "undefined") return null

  try {
    const storageKey = `quiz_answers_${quizId}`
    const savedAnswers = localStorage.getItem(storageKey)
    return savedAnswers ? JSON.parse(savedAnswers) : null
  } catch (error) {
    console.error("Error loading quiz answers:", error)
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
    localStorage.setItem(
      `quiz_result_${quizId}`,
      JSON.stringify({
        ...result,
        timestamp: Date.now(),
      }),
    )
  } catch (error) {
    console.error("Error saving quiz result:", error)
  }
}

// Load quiz result from local storage
export function loadQuizResult(quizId: string) {
  if (typeof window === "undefined") return null

  try {
    const savedResult = localStorage.getItem(`quiz_result_${quizId}`)
    return savedResult ? JSON.parse(savedResult) : null
  } catch (error) {
    console.error("Error loading quiz result:", error)
    return null
  }
}

// Add this function to calculate similarity between strings
export function calculateSimilarity(str1: string, str2: string): number {
  const normalize = (str: string) => str.replace(/\s+/g, " ").trim()?.toLowerCase()
  const normalizedStr1 = normalize(str1)
  const normalizedStr2 = normalize(str2)

  if (normalizedStr1 === normalizedStr2) return 100

  const longer = normalizedStr1.length > normalizedStr2.length ? normalizedStr1 : normalizedStr2
  const shorter = normalizedStr1.length > normalizedStr2.length ? normalizedStr2 : normalizedStr1
  const longerLength = longer.length

  if (longerLength === 0) return 100

  // Function to calculate Levenshtein distance
  function levenshteinDistance(s1: string, s2: string): number {
    const matrix: number[][] = []

    // Initialize matrix
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j
    }

    // Calculate Levenshtein distance
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2[i - 1] === s1[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          )
        }
      }
    }

    return matrix[s2.length][s1.length]
  }

  const editDistance = levenshteinDistance(longer, shorter)
  return Math.round(Math.max(0, Math.min(100, (1 - editDistance / longerLength) * 100)))
}

// Add a function to clear guest quiz results specifically
// This will help with the guest results persistence issue

// Add this function to the file
export function clearGuestQuizResults(quizId: string) {
  if (typeof window === "undefined") return

  try {
    // Clear from both localStorage and sessionStorage to be thorough
    localStorage.removeItem(`guestQuizResults_${quizId}`)
    sessionStorage.removeItem(`guestQuizResults_${quizId}`)

    // Also clear any related state
    localStorage.removeItem(`quiz_state_${quizId}`)
    sessionStorage.removeItem(`quiz_state_${quizId}`)
    localStorage.removeItem(`quiz_answers_${quizId}`)
    sessionStorage.removeItem(`quiz_answers_${quizId}`)

    console.log(`Cleared guest quiz results for quiz ${quizId}`)
  } catch (error) {
    console.error("Error clearing guest quiz results:", error)
  }
}
