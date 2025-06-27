/**
 * Progressive hint system for quiz questions
 */

export interface HintLevel {
  level: "low" | "medium" | "high"
  type: "contextual" | "structural" | "semantic" | "direct"
  content: string
  spoilerLevel: "low" | "medium" | "high"
  penalty: number
  description: string
}

export interface HintSystemConfig {
  maxHints: number
  progressiveReveal: boolean
  allowDirectAnswer: boolean
}

export const HINT_LEVELS: Record<number, HintLevel> = {
  0: {
    level: "low",
    type: "contextual",
    content: "",
    spoilerLevel: "low",
    penalty: 5,
    description: "General guidance",
  },
  1: {
    level: "medium",
    type: "structural",
    content: "",
    spoilerLevel: "medium",
    penalty: 10,
    description: "More specific hint",
  },
  2: { level: "high", type: "semantic", content: "", spoilerLevel: "high", penalty: 15, description: "Major spoiler" },
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
        level: index < 3 ? HINT_LEVELS[index].level : "high",
        type: "contextual",
        content: hint,
        spoilerLevel: index === 0 ? "low" : index === 1 ? "medium" : "high",
        penalty: HINT_LEVELS[index].penalty,
        description: HINT_LEVELS[index].description,
      })
    })
  }

  // Add generated hints if we need more
  if (hints.length < 3) {
    // Length hint
    if (correctAnswer && hints.length < 3) {
      hints.push({
        level: hints.length < 3 ? HINT_LEVELS[hints.length].level : "high",
        type: "structural",
        content: `The answer is ${correctAnswer.length} characters long.`,
        spoilerLevel: "low",
        penalty: HINT_LEVELS[hints.length].penalty,
        description: HINT_LEVELS[hints.length].description,
      })
    }

    // First letter hint
    if (correctAnswer && hints.length < 3) {
      hints.push({
        level: hints.length < 3 ? HINT_LEVELS[hints.length].level : "high",
        type: "structural",
        content: `The answer starts with the letter "${correctAnswer.charAt(0).toUpperCase()}".`,
        spoilerLevel: "medium",
        penalty: HINT_LEVELS[hints.length].penalty,
        description: HINT_LEVELS[hints.length].description,
      })
    }

    // Direct hint (last resort)
    if (correctAnswer && hints.length < 3) {
      hints.push({
        level: hints.length < 3 ? HINT_LEVELS[hints.length].level : "high",
        type: "direct",
        content: `The answer is "${correctAnswer}".`,
        spoilerLevel: "high",
        penalty: HINT_LEVELS[hints.length].penalty,
        description: HINT_LEVELS[hints.length].description,
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
        level: index < 3 ? HINT_LEVELS[index].level : "high",
        type: "contextual",
        content: hint,
        spoilerLevel: index === 0 ? "low" : index === 1 ? "medium" : "high",
        penalty: HINT_LEVELS[index].penalty,
        description: HINT_LEVELS[index].description,
      })
    })
  }

  // Add generated hints if we need more
  if (hints.length < 3 && keywords.length > 0) {
    // Keywords hint
    const keywordHint = `Your answer should include concepts related to: ${keywords.slice(0, 3).join(", ")}`
    hints.push({
      level: hints.length < 3 ? HINT_LEVELS[hints.length].level : "high",
      type: "semantic",
      content: keywordHint,
      spoilerLevel: "low",
      penalty: HINT_LEVELS[hints.length].penalty,
      description: HINT_LEVELS[hints.length].description,
    })

    // Structure hint
    if (hints.length < 3) {
      hints.push({
        level: hints.length < 3 ? HINT_LEVELS[hints.length].level : "high",
        type: "structural",
        content: "Try to provide a comprehensive answer that covers the main concepts and their relationships.",
        spoilerLevel: "medium",
        penalty: HINT_LEVELS[hints.length].penalty,
        description: HINT_LEVELS[hints.length].description,
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
export function calculateHintPenalty(hintsUsed: number[]): number {
  return hintsUsed.reduce((total, hintIndex) => {
    const level = HINT_LEVELS[hintIndex] || HINT_LEVELS[2]
    return total + level.penalty
  }, 0)
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

export function generateFallbackHints(question: string, answer: string): string[] {
  const hints: string[] = []

  // First hint - general guidance
  if (question.toLowerCase().includes("what is")) {
    hints.push("Think about the definition and primary purpose of this concept.")
  } else if (question.toLowerCase().includes("how")) {
    hints.push("Consider the step-by-step process or methodology involved.")
  } else if (question.toLowerCase().includes("why")) {
    hints.push("Focus on the reasons, benefits, or underlying principles.")
  } else {
    hints.push("Break down the question into smaller parts and address each component.")
  }

  // Second hint - more specific
  const answerWords = answer
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3)
  if (answerWords.length > 0) {
    const keyWord = answerWords[0]
    hints.push(`The answer is related to "${keyWord}" and its applications.`)
  } else {
    hints.push("Consider the most common or fundamental aspect of this topic.")
  }

  // Third hint - major spoiler
  if (answer.length > 10) {
    const firstPart = answer.substring(0, Math.ceil(answer.length / 3))
    hints.push(`The answer starts with: "${firstPart}..."`)
  } else {
    hints.push(`The answer is a ${answer.length}-character word/phrase.`)
  }

  return hints
}
