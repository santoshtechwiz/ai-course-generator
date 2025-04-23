import type { QuizType } from "@/app/types/quiz-types"

interface QuizAnswer {
  answer: string | string[]
  isCorrect?: boolean
  timeSpent: number
  similarity?: number
  hintsUsed?: boolean
}

interface QuizSubmission {
  quizId: string
  slug: string
  answers: QuizAnswer[]
  totalTime: number
  score: number
  type: QuizType
  totalQuestions: number
}

// Submit quiz result to the server
export async function submitQuizResult(submission: QuizSubmission): Promise<any> {
  console.log("Submitting quiz result:", submission)

  // Validate required fields
  if (!submission.totalTime || submission.totalTime <= 0) {
    console.error("Missing or invalid totalTime:", submission.totalTime)
    throw new Error("Missing required fields: totalTime")
  }

  if (!submission.quizId) {
    console.error("Missing quizId")
    throw new Error("Missing required fields: quizId")
  }

  if (!submission.answers || !Array.isArray(submission.answers)) {
    console.error("Missing or invalid answers:", submission.answers)
    throw new Error("Missing required fields: answers")
  }

  // Check if we've already saved this quiz
  const alreadySaved = localStorage.getItem(`quiz_${submission.quizId}_saved`) === "true"
  if (alreadySaved) {
    console.log("Quiz results already saved, skipping save")
    return { success: true, message: "Already saved" }
  }

  try {
    // Format the answers based on quiz type
    let formattedAnswers = submission.answers

    // For fill-in-the-blanks quizzes, we need to format the answers differently
    if (submission.type === "blanks") {
      formattedAnswers = submission.answers.map((answer) => ({
        answer: typeof answer.answer === "string" ? answer.answer : "",
        userAnswer: typeof answer.answer === "string" ? answer.answer : "",
        timeSpent: answer.timeSpent || 0,
        hintsUsed: answer.hintsUsed || false,
        similarity: answer.similarity || 0,
        isCorrect: (answer.similarity || 0) > 80,
      }))
    }

    // For open-ended quizzes, we need to format the answers differently
    if (submission.type === "openended") {
      formattedAnswers = submission.answers.map((answer) => ({
        answer: typeof answer.answer === "string" ? answer.answer : "",
        timeSpent: answer.timeSpent || 0,
        hintsUsed: answer.hintsUsed || false,
        similarity: answer.similarity || 0,
        isCorrect: answer.isCorrect || false,
      }))
    }

    // Prepare the request payload
    const payload = {
      quizId: submission.quizId,
      answers: formattedAnswers,
      totalTime: submission.totalTime,
      score: submission.score,
      type: submission.type,
      totalQuestions: submission.totalQuestions,
      completedAt: new Date().toISOString(),
    }

    console.log("Sending API request to save quiz result:", payload)

    // Implement retry logic for deadlock errors
    let retries = 3
    let lastError = null
    let saveAttemptCount = 0
    let lastSaveAttempt = 0

    while (retries > 0) {
      try {
        // Prevent excessive save attempts
        const now = Date.now()
        if (now - lastSaveAttempt < 5000) {
          // Throttle to once every 5 seconds
          console.log("Throttling save attempt, too frequent")
          await new Promise((resolve) => setTimeout(resolve, 5000))
          continue
        }

        // Limit total save attempts to prevent infinite loops
        if (saveAttemptCount > 5) {
          console.log("Too many save attempts, stopping to prevent infinite loop")
          break
        }

        lastSaveAttempt = now
        saveAttemptCount += 1

        // Make the API call to save the quiz result
        const response = await fetch(`/api/quiz/${submission.quizId}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          let errorMessage = `Failed to save quiz result: ${response.status}`

          try {
            const errorData = await response.json()
            if (errorData.error) {
              errorMessage = errorData.error
            }
          } catch (e) {
            // If JSON parsing fails, try to get the text response
            try {
              const errorText = await response.text()
              if (errorText) {
                errorMessage += ` - ${errorText}`
              }
            } catch (textError) {
              // If text extraction fails, just use the status code error
            }
          }

          // Check if this is a deadlock error
          if (errorMessage.includes("deadlock") || errorMessage.includes("write conflict")) {
            lastError = new Error(errorMessage)
            retries--
            // Wait longer between each retry
            await new Promise((resolve) => setTimeout(resolve, (4 - retries) * 2000))
            continue
          }

          throw new Error(errorMessage)
        }

        const data = await response.json()
        console.log("Quiz result saved successfully:", data)

        // Mark this quiz as saved
        localStorage.setItem(`quiz_${submission.quizId}_saved`, "true")

        return data
      } catch (error) {
        lastError = error

        // Only retry on deadlock errors
        if (
          error instanceof Error &&
          (error.message.includes("deadlock") || error.message.includes("write conflict"))
        ) {
          retries--
          if (retries > 0) {
            console.log(`Retrying after deadlock error. Retries left: ${retries}`)
            // Wait longer between each retry
            await new Promise((resolve) => setTimeout(resolve, (4 - retries) * 2000))
            continue
          }
        } else {
          // For other errors, don't retry
          break
        }
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error("Failed to save quiz result after multiple attempts")
  } catch (error) {
    console.error("Error submitting quiz result:", error)
    throw error
  }
}

export async function clearAllQuizData (): Promise<void> {
  try {
    const keysToRemove = Object.keys(localStorage).filter((key) => key.startsWith("quiz_"))
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  } catch (error) {
    console.error("Error clearing quiz data:", error)
  }
}