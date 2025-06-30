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
    level: "low",
    type: "structural",
    content: "",
    spoilerLevel: "low",
    penalty: 8,
    description: "Structural hint",
  },
  2: {
    level: "medium",
    type: "semantic",
    content: "",
    spoilerLevel: "medium",
    penalty: 12,
    description: "More specific hint",
  },
  3: {
    level: "medium",
    type: "semantic",
    content: "",
    spoilerLevel: "medium",
    penalty: 15,
    description: "Detailed guidance",
  },
  4: {
    level: "high",
    type: "direct",
    content: "",
    spoilerLevel: "high",
    penalty: 20,
    description: "Major spoiler",
  },
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
        level: index < 2 ? "low" : index < 4 ? "medium" : "high",
        type: "contextual",
        content: hint,
        spoilerLevel: index < 2 ? "low" : index < 4 ? "medium" : "high",
        penalty: HINT_LEVELS[index]?.penalty || 20,
        description: HINT_LEVELS[index]?.description || "Custom hint",
      })
    })
  }

  // Generate comprehensive hints for blanks (5 total hints)
  if (correctAnswer) {
    // Hint 1: Context/Category hint
    if (hints.length < 5) {
      const contextHint = generateContextHint(correctAnswer, questionText)
      hints.push({
        level: "low",
        type: "contextual",
        content: contextHint,
        spoilerLevel: "low",
        penalty: 5,
        description: "Context clue",
      })
    }

    // Hint 2: Length and structure hint
    if (hints.length < 5) {
      const structureHint = generateStructureHint(correctAnswer)
      hints.push({
        level: "low",
        type: "structural",
        content: structureHint,
        spoilerLevel: "low",
        penalty: 8,
        description: "Word structure",
      })
    }

    // Hint 3: First letter and word type hint
    if (hints.length < 5) {
      const letterHint = generateLetterHint(correctAnswer)
      hints.push({
        level: "medium",
        type: "structural",
        content: letterHint,
        spoilerLevel: "medium",
        penalty: 12,
        description: "Letter clue",
      })
    }

    // Hint 4: Partial word reveal or synonym
    if (hints.length < 5) {
      const partialHint = generatePartialHint(correctAnswer)
      hints.push({
        level: "medium",
        type: "semantic",
        content: partialHint,
        spoilerLevel: "medium",
        penalty: 15,
        description: "Partial reveal",
      })
    }

    // Hint 5: Direct answer (last resort)
    if (hints.length < 5) {
      hints.push({
        level: "high",
        type: "direct",
        content: `The answer is "${correctAnswer}".`,
        spoilerLevel: "high",
        penalty: 20,
        description: "Complete answer",
      })
    }
  }

  return hints.slice(0, 5) // Ensure exactly 5 hints
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
        penalty: HINT_LEVELS[index]?.penalty || 15,
        description: HINT_LEVELS[index]?.description || "Custom hint",
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
      penalty: HINT_LEVELS[hints.length]?.penalty || 5,
      description: HINT_LEVELS[hints.length]?.description || "Keywords hint",
    })

    // Structure hint
    if (hints.length < 3) {
      hints.push({
        level: hints.length < 3 ? HINT_LEVELS[hints.length].level : "high",
        type: "structural",
        content: "Try to provide a comprehensive answer that covers the main concepts and their relationships.",
        spoilerLevel: "medium",
        penalty: HINT_LEVELS[hints.length]?.penalty || 10,
        description: HINT_LEVELS[hints.length]?.description || "Structure hint",
      })
    }
  }

  // Fallback hints if no keywords provided
  if (hints.length === 0) {
    hints.push(...generateFallbackHints(questionText, ""))
  }

  return hints
}

// Helper functions for generating specific hint types
function generateContextHint(answer: string, question: string): string {
  const answerLower = answer.toLowerCase()

  // Programming/Tech terms
  if (answerLower.includes("function") || answerLower.includes("method") || answerLower.includes("variable")) {
    return "Think about programming concepts and terminology."
  }

  // Common categories
  if (answerLower.length <= 4) {
    return "This is a short, commonly used term."
  } else if (answerLower.length <= 8) {
    return "This is a medium-length word that's fundamental to the topic."
  } else {
    return "This is a longer term that represents an important concept."
  }
}

function generateStructureHint(answer: string): string {
  const wordCount = answer.split(" ").length
  const charCount = answer.length

  if (wordCount === 1) {
    return `This is a single word with ${charCount} characters.`
  } else {
    return `This consists of ${wordCount} words with a total of ${charCount} characters.`
  }
}

function generateLetterHint(answer: string): string {
  const firstLetter = answer.charAt(0).toUpperCase()
  const lastLetter = answer.charAt(answer.length - 1).toLowerCase()

  if (answer.includes(" ")) {
    const words = answer.split(" ")
    return `The first word starts with "${firstLetter}" and the last word ends with "${lastLetter}".`
  } else {
    return `The word starts with "${firstLetter}" and ends with "${lastLetter}".`
  }
}

function generatePartialHint(answer: string): string {
  if (answer.includes(" ")) {
    // For multi-word answers, reveal first word
    const firstWord = answer.split(" ")[0]
    const remaining = answer
      .split(" ")
      .slice(1)
      .map((w) => "_".repeat(w.length))
      .join(" ")
    return `The answer starts with: "${firstWord} ${remaining}"`
  } else {
    // For single words, reveal first half
    const halfLength = Math.ceil(answer.length / 2)
    const revealed = answer.substring(0, halfLength)
    const hidden = "_".repeat(answer.length - halfLength)
    return `The word is: "${revealed}${hidden}"`
  }
}

// Get next hint based on current level and user progress
export function getNextHint(
  hints: HintLevel[],
  currentLevel: number,
  config: HintSystemConfig = {
    maxHints: 5,
    progressiveReveal: true,
    allowDirectAnswer: true,
  },
): HintLevel | null {
  if (currentLevel >= config.maxHints) return null

  const nextLevel = currentLevel + 1
  const hint = hints[nextLevel]

  if (!hint) return null

  // Allow direct answers for blanks since they're more focused
  return hint
}

// Calculate hint penalty for scoring
export function calculateHintPenalty(hintsUsed: number | number[]): number {
  // Handle both single number and array inputs
  if (typeof hintsUsed === "number") {
    // If it's a single number, treat it as the highest hint level used
    const level = HINT_LEVELS[hintsUsed] || HINT_LEVELS[4]
    return level?.penalty || 0
  }

  // If it's an array, calculate total penalty
  if (!Array.isArray(hintsUsed)) {
    console.warn("calculateHintPenalty received invalid hintsUsed:", hintsUsed)
    return 0
  }

  return hintsUsed.reduce((total, hintIndex) => {
    const level = HINT_LEVELS[hintIndex] || HINT_LEVELS[4]
    return total + (level?.penalty || 0)
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

export function generateFallbackHints(question: string, answer: string): HintLevel[] {
  const hints: HintLevel[] = []

  // First hint - general guidance
  if (question.toLowerCase().includes("what is")) {
    hints.push({
      level: "low",
      type: "contextual",
      content: "Think about the definition and primary purpose of this concept.",
      spoilerLevel: "low",
      penalty: 5,
      description: "General guidance",
    })
  } else if (question.toLowerCase().includes("how")) {
    hints.push({
      level: "low",
      type: "contextual",
      content: "Consider the step-by-step process or methodology involved.",
      spoilerLevel: "low",
      penalty: 5,
      description: "General guidance",
    })
  } else if (question.toLowerCase().includes("why")) {
    hints.push({
      level: "low",
      type: "contextual",
      content: "Focus on the reasons, benefits, or underlying principles.",
      spoilerLevel: "low",
      penalty: 5,
      description: "General guidance",
    })
  } else {
    hints.push({
      level: "low",
      type: "contextual",
      content: "Break down the question into smaller parts and address each component.",
      spoilerLevel: "low",
      penalty: 5,
      description: "General guidance",
    })
  }

  // Second hint - more specific
  if (answer && answer.length > 0) {
    const answerWords = answer
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3)
    if (answerWords.length > 0) {
      const keyWord = answerWords[0]
      hints.push({
        level: "medium",
        type: "semantic",
        content: `The answer is related to "${keyWord}" and its applications.`,
        spoilerLevel: "medium",
        penalty: 10,
        description: "More specific hint",
      })
    } else {
      hints.push({
        level: "medium",
        type: "contextual",
        content: "Consider the most common or fundamental aspect of this topic.",
        spoilerLevel: "medium",
        penalty: 10,
        description: "More specific hint",
      })
    }
  }

  // Third hint - major spoiler
  if (answer && answer.length > 10) {
    const firstPart = answer.substring(0, Math.ceil(answer.length / 3))
    hints.push({
      level: "high",
      type: "direct",
      content: `The answer starts with: "${firstPart}..."`,
      spoilerLevel: "high",
      penalty: 15,
      description: "Major spoiler",
    })
  } else if (answer) {
    hints.push({
      level: "high",
      type: "structural",
      content: `The answer is a ${answer.length}-character word/phrase.`,
      spoilerLevel: "high",
      penalty: 15,
      description: "Major spoiler",
    })
  }

  return hints
}
