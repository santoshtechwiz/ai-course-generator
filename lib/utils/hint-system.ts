/**
 * Progressive hint system for quiz questions
 */

export interface HintLevel {
  level: number
  type: "contextual" | "structural" | "semantic" | "direct"
  content: string
  spoilerLevel: "low" | "medium" | "high"
}

export interface HintSystemConfig {
  maxHints: number
  progressiveReveal: boolean
  allowDirectAnswer: boolean
}

// Generate progressive hints for fill-in-the-blank questions
export function generateBlanksHints(
  correctAnswer: string,
  questionText: string,
  providedHints: string[] = [],
): HintLevel[] {
  const hints: HintLevel[] = []

  // Use provided hints first
  if (providedHints && providedHints.length > 0) {
    providedHints.forEach((hint, index) => {
      hints.push({
        level: index + 1,
        type: "contextual",
        content: hint,
        spoilerLevel: index === 0 ? "low" : index === 1 ? "medium" : "high",
      })
    })
  }

  // Add generated hints if we need more
  if (hints.length < 3) {
    // Length hint
    if (correctAnswer && hints.length < 3) {
      hints.push({
        level: hints.length + 1,
        type: "structural",
        content: `The answer is ${correctAnswer.length} characters long.`,
        spoilerLevel: "low",
      })
    }

    // First letter hint
    if (correctAnswer && hints.length < 3) {
      hints.push({
        level: hints.length + 1,
        type: "structural",
        content: `The answer starts with the letter "${correctAnswer.charAt(0).toUpperCase()}".`,
        spoilerLevel: "medium",
      })
    }

    // Direct hint (last resort)
    if (correctAnswer && hints.length < 3) {
      hints.push({
        level: hints.length + 1,
        type: "direct",
        content: `The answer is "${correctAnswer}".`,
        spoilerLevel: "high",
      })
    }
  }

  return hints
}

// Generate progressive hints for open-ended questions
export function generateOpenEndedHints(
  keywords: string[] = [],
  questionText: string,
  providedHints: string[] = [],
): HintLevel[] {
  const hints: HintLevel[] = []

  // Use provided hints first
  if (providedHints && providedHints.length > 0) {
    providedHints.forEach((hint, index) => {
      hints.push({
        level: index + 1,
        type: "contextual",
        content: hint,
        spoilerLevel: index === 0 ? "low" : index === 1 ? "medium" : "high",
      })
    })
  }

  // Add generated hints if we need more
  if (hints.length < 3 && keywords.length > 0) {
    // Keywords hint
    const keywordHint = `Your answer should include concepts related to: ${keywords.slice(0, 3).join(", ")}`
    hints.push({
      level: hints.length + 1,
      type: "semantic",
      content: keywordHint,
      spoilerLevel: "low",
    })

    // Structure hint
    if (hints.length < 3) {
      hints.push({
        level: hints.length + 1,
        type: "structural",
        content: "Try to provide a comprehensive answer that covers the main concepts and their relationships.",
        spoilerLevel: "medium",
      })
    }
  }

  return hints
}

// Get next hint based on current level and user progress
export function getNextHint(
  hints: HintLevel[],
  currentLevel: number,
  config: HintSystemConfig = {
    maxHints: 3,
    progressiveReveal: true,
    allowDirectAnswer: false,
  },
): HintLevel | null {
  if (currentLevel >= config.maxHints) return null

  const nextLevel = currentLevel + 1
  const hint = hints.find((h) => h.level === nextLevel)

  if (!hint) return null

  // Don't show direct answers unless explicitly allowed
  if (hint.type === "direct" && !config.allowDirectAnswer) return null

  return hint
}

// Calculate hint penalty for scoring
export function calculateHintPenalty(hintsUsed: number, baseScore = 100): number {
  const penaltyPerHint = 5
  const penalty = hintsUsed * penaltyPerHint
  return Math.max(0, baseScore - penalty)
}

// Analyze user input to provide contextual hints
export function analyzeUserInput(userInput: string, correctAnswer: string, question: string): string | null {
  if (!userInput.trim()) return null

  const normalizedInput = userInput.toLowerCase().trim()
  const normalizedAnswer = correctAnswer.toLowerCase().trim()

  // If user is completely off track
  if (normalizedInput.length > 0 && !normalizedAnswer.includes(normalizedInput.charAt(0))) {
    return `Your answer doesn't seem to be on the right track. Consider the context of the question more carefully.`
  }

  // If user has partial match
  if (normalizedAnswer.includes(normalizedInput) || normalizedInput.includes(normalizedAnswer.substring(0, 3))) {
    return `You're on the right track! Try to be more specific or complete your answer.`
  }

  // If user input is too short for open-ended
  if (normalizedInput.length < normalizedAnswer.length / 2 && normalizedInput.length < 20) {
    return `Your answer seems too brief. Try to provide more detail and explanation.`
  }

  // If user input is much longer but doesn't match well
  if (normalizedInput.length > normalizedAnswer.length * 1.5) {
    return `You've provided a lot of detail. Make sure you're focusing on the key points that directly answer the question.`
  }

  return null
}
