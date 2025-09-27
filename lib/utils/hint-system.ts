/**
 * Progressive hint system for quiz questions
 */

export interface HintLevel {
  level: "low" | "medium" | "high"
  type: "contextual" | "structural" | "semantic" | "direct" | "length" | "depth"
  content: string
  spoilerLevel: "low" | "medium" | "high"
  penalty: number
  description: string
  targetLength?: "short" | "medium" | "long" // New: target answer length
  minWords?: number // New: minimum word count expectation
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

// Generate content-aware hints based on question analysis
export function generateContentAwareHints(
  questionText: string,
  keywords: string[] = [],
  expectedLength: "short" | "medium" | "long" = "medium"
): HintLevel[] {
  const hints: HintLevel[] = []
  const question = questionText.toLowerCase()

  // Analyze question type and topic
  const questionType = analyzeQuestionType(question)
  const topic = extractTopic(question)

  // Generate topic-specific hints
  switch (topic) {
    case 'openai':
    case 'open ai':
      hints.push(...generateOpenAIHints(questionType, expectedLength))
      break
    case 'machine learning':
    case 'ml':
      hints.push(...generateMLHints(questionType, expectedLength))
      break
    case 'neural network':
      hints.push(...generateNeuralNetworkHints(questionType, expectedLength))
      break
    default:
      // Fallback to generic but still better hints
      hints.push(...generateGenericSmartHints(questionType, keywords, expectedLength))
  }

  // Ensure we have at least 3 hints
  while (hints.length < 3) {
    hints.push(generateFallbackHint(hints.length, expectedLength))
  }

  return hints.slice(0, 3) // Return exactly 3 hints
}

// Analyze question type
function analyzeQuestionType(question: string): 'what' | 'how' | 'why' | 'goals' | 'objectives' | 'contribute' | 'general' {
  // Check for compound questions (multiple question types)
  const hasGoals = question.includes('goals') || question.includes('objectives')
  const hasContribute = question.includes('contribute') || question.includes('contribution')

  if (hasGoals && hasContribute) return 'goals' // Prioritize goals for compound questions
  if (hasGoals) return 'goals'
  if (hasContribute) return 'contribute'
  if (question.includes('what is') || question.includes('what are')) return 'what'
  if (question.includes('how')) return 'how'
  if (question.includes('why')) return 'why'
  return 'general'
}

// Extract main topic from question
function extractTopic(question: string): string {
  const topics = ['openai', 'open ai', 'machine learning', 'ml', 'neural network', 'artificial intelligence', 'ai']
  for (const topic of topics) {
    if (question.includes(topic)) return topic
  }
  return 'general'
}

// Generate OpenAI-specific hints
function generateOpenAIHints(questionType: string, expectedLength: "short" | "medium" | "long"): HintLevel[] {
  const hints: HintLevel[] = []

  // For goals-focused questions (including compound questions)
  if (questionType === 'goals') {
    hints.push({
      level: "low",
      type: "semantic",
      content: "OpenAI's primary goals include: advancing AGI (Artificial General Intelligence), ensuring AI safety and alignment, making AI accessible and beneficial to humanity, and conducting cutting-edge AI research.",
      spoilerLevel: "low",
      penalty: 5,
      description: "Key goals",
      targetLength: expectedLength,
      minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
    })

    hints.push({
      level: "medium",
      type: "structural",
      content: "OpenAI contributes to AI through: groundbreaking research publications, open-source tools and models, developing advanced language models like GPT, pushing boundaries in reinforcement learning, and advocating for responsible AI development.",
      spoilerLevel: "medium",
      penalty: 8,
      description: "Contributions",
      targetLength: expectedLength,
      minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
    })

    hints.push({
      level: "medium",
      type: "depth",
      content: "Consider mentioning specific achievements like ChatGPT, DALL-E, Codex, or their research on AI alignment and safety. Explain how these advance the broader AI field through innovation, accessibility, and ethical considerations.",
      spoilerLevel: "medium",
      penalty: 10,
      description: "Specific examples",
      targetLength: expectedLength,
      minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
    })
  }

  // For contribution-focused questions
  else if (questionType === 'contribute') {
    hints.push({
      level: "low",
      type: "semantic",
      content: "OpenAI contributes to AI through groundbreaking research, open-source models, advanced language models, reinforcement learning advancements, and responsible AI advocacy.",
      spoilerLevel: "low",
      penalty: 5,
      description: "Key contributions",
      targetLength: expectedLength,
      minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
    })

    hints.push({
      level: "medium",
      type: "structural",
      content: "Their work advances AI through: technical innovation (GPT, DALL-E), research publications, open-source accessibility, safety research, and industry leadership.",
      spoilerLevel: "medium",
      penalty: 8,
      description: "Impact areas",
      targetLength: expectedLength,
      minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
    })

    hints.push({
      level: "medium",
      type: "depth",
      content: "Explain how OpenAI's models and research have influenced AI development, made AI more accessible, advanced safety research, and shaped industry standards and ethical considerations.",
      spoilerLevel: "medium",
      penalty: 10,
      description: "Broader impact",
      targetLength: expectedLength,
      minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
    })
  }

  // Fallback for general OpenAI questions
  else {
    hints.push({
      level: "low",
      type: "semantic",
      content: "OpenAI is an AI research organization focused on AGI development, safety, and beneficial AI. Their goals include advancing AI capabilities while ensuring safety and accessibility.",
      spoilerLevel: "low",
      penalty: 5,
      description: "Overview",
      targetLength: expectedLength,
      minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
    })

    hints.push({
      level: "medium",
      type: "structural",
      content: "Key achievements include GPT models, DALL-E, research publications, and advocacy for responsible AI development that benefits humanity.",
      spoilerLevel: "medium",
      penalty: 8,
      description: "Achievements",
      targetLength: expectedLength,
      minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
    })

    hints.push({
      level: "medium",
      type: "depth",
      content: "Their contributions span technical innovation, safety research, open-source accessibility, and leadership in shaping AI's societal impact and ethical development.",
      spoilerLevel: "medium",
      penalty: 10,
      description: "Contributions",
      targetLength: expectedLength,
      minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
    })
  }

  return hints
}

// Generate machine learning hints
function generateMLHints(questionType: string, expectedLength: "short" | "medium" | "long"): HintLevel[] {
  const hints: HintLevel[] = []

  hints.push({
    level: "low",
    type: "semantic",
    content: "Machine learning involves algorithms that learn patterns from data. Key concepts include supervised/unsupervised learning, neural networks, training data, and model evaluation.",
    spoilerLevel: "low",
    penalty: 5,
    description: "Core concepts",
    targetLength: expectedLength,
    minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
  })

  hints.push({
    level: "medium",
    type: "structural",
    content: "ML applications span computer vision, natural language processing, recommendation systems, autonomous vehicles, medical diagnosis, and financial modeling.",
    spoilerLevel: "medium",
    penalty: 8,
    description: "Applications",
    targetLength: expectedLength,
    minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
  })

  hints.push({
    level: "medium",
    type: "depth",
    content: "Discuss how ML algorithms improve with more data, the importance of feature engineering, challenges like overfitting, and the role of computational power in modern ML.",
    spoilerLevel: "medium",
    penalty: 10,
    description: "Technical depth",
    targetLength: expectedLength,
    minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
  })

  return hints
}

// Generate neural network hints
function generateNeuralNetworkHints(questionType: string, expectedLength: "short" | "medium" | "long"): HintLevel[] {
  const hints: HintLevel[] = []

  hints.push({
    level: "low",
    type: "semantic",
    content: "Neural networks are computing systems inspired by biological brains, consisting of layers of interconnected nodes (neurons) that process and transmit information.",
    spoilerLevel: "low",
    penalty: 5,
    description: "Basic definition",
    targetLength: expectedLength,
    minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
  })

  hints.push({
    level: "medium",
    type: "structural",
    content: "Key components include input layers, hidden layers, output layers, weights, biases, and activation functions. Types include feedforward, convolutional, and recurrent networks.",
    spoilerLevel: "medium",
    penalty: 8,
    description: "Architecture",
    targetLength: expectedLength,
    minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
  })

  hints.push({
    level: "medium",
    type: "depth",
    content: "Explain how backpropagation trains networks, the role of gradient descent, challenges with vanishing gradients, and applications in image recognition and language processing.",
    spoilerLevel: "medium",
    penalty: 10,
    description: "Training process",
    targetLength: expectedLength,
    minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
  })

  return hints
}

// Generate smarter generic hints
function generateGenericSmartHints(questionType: string, keywords: string[], expectedLength: "short" | "medium" | "long"): HintLevel[] {
  const hints: HintLevel[] = []

  // First hint: Keywords focus
  if (keywords.length > 0) {
    const keywordHint = expectedLength === "short"
      ? `Focus on these key concepts: ${keywords.slice(0, 2).join(", ")}`
      : expectedLength === "long"
      ? `Your answer should thoroughly cover: ${keywords.slice(0, 4).join(", ")} with examples and explanations`
      : `Include these main concepts: ${keywords.slice(0, 3).join(", ")}`

    hints.push({
      level: "low",
      type: "semantic",
      content: keywordHint,
      spoilerLevel: "low",
      penalty: 5,
      description: "Key concepts",
      targetLength: expectedLength,
      minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
    })
  }

  // Second hint: Structure based on question type
  let structureHint = ""
  switch (questionType) {
    case 'what':
      structureHint = "Start with a clear definition, then explain key characteristics and provide examples."
      break
    case 'how':
      structureHint = "Explain the process step-by-step, then discuss mechanisms and provide practical examples."
      break
    case 'why':
      structureHint = "Discuss underlying reasons, benefits, and implications with supporting evidence."
      break
    default:
      structureHint = "Organize your answer with a clear main point, supporting details, and relevant examples."
  }

  hints.push({
    level: "medium",
    type: "structural",
    content: structureHint,
    spoilerLevel: "medium",
    penalty: 8,
    description: "Structure guidance",
    targetLength: expectedLength,
    minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
  })

  // Third hint: Depth and analysis
  const depthHint = expectedLength === "short"
    ? "Ensure your answer directly addresses the question with specific, relevant details."
    : expectedLength === "long"
    ? "For each key point, explain why it matters, provide evidence or examples, and discuss broader implications."
    : "Go beyond surface-level explanation - include why concepts work and their practical applications."

  hints.push({
    level: "medium",
    type: "depth",
    content: depthHint,
    spoilerLevel: "medium",
    penalty: 10,
    description: "Depth guidance",
    targetLength: expectedLength,
    minWords: expectedLength === "short" ? 10 : expectedLength === "long" ? 80 : 30
  })

  return hints
}

// Fallback hint generator
function generateFallbackHint(index: number, expectedLength: "short" | "medium" | "long"): HintLevel {
  const lengthConfig = {
    short: { minWords: 10, maxWords: 30, description: "brief but complete" },
    medium: { minWords: 30, maxWords: 80, description: "comprehensive" },
    long: { minWords: 80, maxWords: 200, description: "detailed and thorough" }
  }

  const config = lengthConfig[expectedLength]

  return {
    level: "low",
    type: "length",
    content: `Aim for a ${config.description} answer of ${config.minWords}-${config.maxWords} words that covers the key concepts.`,
    spoilerLevel: "low",
    penalty: 5,
    description: "Length guidance",
    targetLength: expectedLength,
    minWords: config.minWords
  }
}

// Generate progressive hints for open-ended questions
export function generateOpenEndedHints(
  keywords: string[] = [],
  questionText: string,
  providedHints: string[] = [],
  expectedLength: "short" | "medium" | "long" = "medium"
): HintLevel[] {
  const hints: HintLevel[] = []

  // Determine expected word count based on length
  const lengthConfig = {
    short: { minWords: 10, maxWords: 30, description: "brief but complete" },
    medium: { minWords: 30, maxWords: 80, description: "comprehensive" },
    long: { minWords: 80, maxWords: 200, description: "detailed and thorough" }
  }

  const config = lengthConfig[expectedLength]

  // Use provided hints first
  if (providedHints && providedHints.length > 0) {
    providedHints.forEach((hint, index) => {
      hints.push({
        level: index < 2 ? "low" : index < 4 ? "medium" : "high",
        type: "contextual",
        content: hint,
        spoilerLevel: index === 0 ? "low" : index === 1 ? "medium" : "high",
        penalty: HINT_LEVELS[index]?.penalty || 15,
        description: HINT_LEVELS[index]?.description || "Custom hint",
        targetLength: expectedLength,
        minWords: config.minWords
      })
    })
  }

  // Add generated hints if we need more
  if (hints.length < 3) {
    // Length expectation hint (always first for clarity)
    if (hints.length === 0) {
      hints.push({
        level: "low",
        type: "length",
        content: `Aim for a ${config.description} answer of ${config.minWords}-${config.maxWords} words that covers the key concepts.`,
        spoilerLevel: "low",
        penalty: 3, // Lower penalty for length guidance
        description: "Length guidance",
        targetLength: expectedLength,
        minWords: config.minWords
      })
    }

    // Keywords hint
    if (hints.length < 3 && keywords.length > 0) {
      const keywordHint = expectedLength === "short"
        ? `Focus on these key concepts: ${keywords.slice(0, 2).join(", ")}`
        : expectedLength === "long"
        ? `Your answer should thoroughly cover: ${keywords.slice(0, 4).join(", ")} with examples and explanations`
        : `Include these main concepts: ${keywords.slice(0, 3).join(", ")}`

      hints.push({
        level: "low",
        type: "semantic",
        content: keywordHint,
        spoilerLevel: "low",
        penalty: 5,
        description: "Key concepts",
        targetLength: expectedLength,
        minWords: config.minWords
      })
    }

    // Structure hint based on expected length
    if (hints.length < 3) {
      const structureHint = expectedLength === "short"
        ? "Provide a clear definition or explanation with 1-2 key examples."
        : expectedLength === "long"
        ? "Structure your answer with: introduction, main explanation, examples/evidence, and conclusion."
        : "Organize your answer with a clear main point, supporting details, and examples."

      hints.push({
        level: "medium",
        type: "structural",
        content: structureHint,
        spoilerLevel: "medium",
        penalty: 8,
        description: "Structure guidance",
        targetLength: expectedLength,
        minWords: config.minWords
      })
    }

    // Depth hint for longer answers
    if (hints.length < 3 && expectedLength !== "short") {
      const depthHint = expectedLength === "long"
        ? "For each key point, explain why it matters, provide evidence/examples, and discuss implications or limitations."
        : "Go beyond surface-level explanation - include why concepts work and their practical applications."

      hints.push({
        level: "medium",
        type: "depth",
        content: depthHint,
        spoilerLevel: "medium",
        penalty: 10,
        description: "Depth guidance",
        targetLength: expectedLength,
        minWords: config.minWords
      })
    }
  }

  // Fallback hints if no keywords provided
  if (hints.length === 0) {
    hints.push(...generateFallbackHints(questionText, "", expectedLength))
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
export function analyzeUserInput(
  userInput: string,
  correctAnswer: string,
  question: string,
  expectedLength: "short" | "medium" | "long" = "medium"
): string | null {
  if (!userInput.trim()) return null

  const normalizedInput = userInput.toLowerCase().trim()
  const normalizedAnswer = correctAnswer.toLowerCase().trim()

  // Word count analysis
  const inputWords = normalizedInput.split(/\s+/).filter(word => word.length > 0)
  const answerWords = normalizedAnswer.split(/\s+/).filter(word => word.length > 0)
  const wordCount = inputWords.length

  // Length expectations
  const lengthConfig = {
    short: { minWords: 10, maxWords: 30, idealWords: 20 },
    medium: { minWords: 30, maxWords: 80, idealWords: 50 },
    long: { minWords: 80, maxWords: 200, idealWords: 120 }
  }

  const config = lengthConfig[expectedLength]

  // Length-based feedback
  if (wordCount < config.minWords) {
    const remaining = config.minWords - wordCount
    return `Your answer is too brief (${wordCount} words). Add at least ${remaining} more words to provide a ${expectedLength} response. Consider including examples or explanations.`
  }

  if (wordCount > config.maxWords) {
    return `Your answer is quite long (${wordCount} words). Try to focus on the most important ${config.maxWords} words while maintaining clarity.`
  }

  // Semantic analysis for short answers
  if (expectedLength === "short" && wordCount <= config.idealWords) {
    // Check for key concepts
    const keyWords = answerWords.filter(word => word.length > 4).slice(0, 3)
    const missingKeywords = keyWords.filter(kw => !normalizedInput.includes(kw))

    if (missingKeywords.length > 0) {
      return `Good length! Consider including key concepts like: ${missingKeywords.join(", ")}`
    }

    // Check for completeness
    if (normalizedInput.length < normalizedAnswer.length * 0.6) {
      return `Your answer covers the basics. Try adding 1-2 specific examples or applications.`
    }
  }

  // Semantic analysis for medium answers
  if (expectedLength === "medium") {
    // Check for structure indicators
    const hasStructure = /\b(because|therefore|however|first|second|finally|in conclusion)\b/i.test(normalizedInput)

    if (!hasStructure && wordCount > 40) {
      return `Good word count! Consider organizing your answer with transition words like "because," "therefore," or "however" for better flow.`
    }

    // Check for examples
    const hasExamples = /\b(for example|such as|like|instance)\b/i.test(normalizedInput)
    if (!hasExamples && wordCount > 35) {
      return `Your answer is developing well. Try including a specific example to illustrate your point.`
    }
  }

  // Semantic analysis for long answers
  if (expectedLength === "long") {
    // Check for depth
    const hasDepth = /\b(therefore|consequently|moreover|furthermore|additionally)\b/i.test(normalizedInput)
    const hasAnalysis = /\b(however|although|despite|while|whereas)\b/i.test(normalizedInput)

    if (!hasDepth && wordCount > 100) {
      return `Excellent length! Consider adding deeper analysis with words like "therefore," "moreover," or "consequently" to show relationships between ideas.`
    }

    if (!hasAnalysis && wordCount > 120) {
      return `Great detail! Try including counterpoints or limitations using words like "however" or "although" for more balanced analysis.`
    }
  }

  // General semantic feedback
  if (normalizedInput.length > 0 && !normalizedAnswer.includes(normalizedInput.charAt(0)) && !normalizedInput.includes(normalizedAnswer.charAt(0))) {
    return `Your answer doesn't seem to be on the right track. Re-read the question and consider the main topic more carefully.`
  }

  // Partial match feedback
  if (normalizedAnswer.includes(normalizedInput.substring(0, 10)) || normalizedInput.includes(normalizedAnswer.substring(0, 10))) {
    return `You're on the right track! Try to be more specific or complete your answer with additional details.`
  }

  // Keyword matching for better feedback
  const inputKeywords = inputWords.filter(word => word.length > 3)
  const answerKeywords = answerWords.filter(word => word.length > 3)
  const matchedKeywords = inputKeywords.filter(kw => answerKeywords.some(akw => akw.includes(kw) || kw.includes(akw)))

  if (matchedKeywords.length < Math.min(3, answerKeywords.length)) {
    const missingCount = Math.min(3, answerKeywords.length) - matchedKeywords.length
    return `Good start! Try incorporating ${missingCount} more key concepts from the topic.`
  }

  return null
}

export function generateFallbackHints(question: string, answer: string, expectedLength: "short" | "medium" | "long" = "medium"): HintLevel[] {
  const hints: HintLevel[] = []

  const lengthConfig = {
    short: { minWords: 10, maxWords: 30, description: "brief but complete" },
    medium: { minWords: 30, maxWords: 80, description: "comprehensive" },
    long: { minWords: 80, maxWords: 200, description: "detailed and thorough" }
  }

  const config = lengthConfig[expectedLength]

  // First hint - general guidance with length expectation
  if (question.toLowerCase().includes("what is")) {
    hints.push({
      level: "low",
      type: "contextual",
      content: `Think about the definition and primary purpose of this concept. Aim for a ${config.description} answer.`,
      spoilerLevel: "low",
      penalty: 5,
      description: "General guidance",
      targetLength: expectedLength,
      minWords: config.minWords
    })
  } else if (question.toLowerCase().includes("how")) {
    hints.push({
      level: "low",
      type: "contextual",
      content: `Consider the step-by-step process or methodology involved. Provide a ${config.description} explanation.`,
      spoilerLevel: "low",
      penalty: 5,
      description: "General guidance",
      targetLength: expectedLength,
      minWords: config.minWords
    })
  } else if (question.toLowerCase().includes("why")) {
    hints.push({
      level: "low",
      type: "contextual",
      content: `Focus on the reasons, benefits, or underlying principles. Give a ${config.description} analysis.`,
      spoilerLevel: "low",
      penalty: 5,
      description: "General guidance",
      targetLength: expectedLength,
      minWords: config.minWords
    })
  } else {
    hints.push({
      level: "low",
      type: "contextual",
      content: `Break down the question into smaller parts and address each component. Aim for a ${config.description} response.`,
      spoilerLevel: "low",
      penalty: 5,
      description: "General guidance",
      targetLength: expectedLength,
      minWords: config.minWords
    })
  }

  // Second hint - more specific with length consideration
  if (answer && answer.length > 0) {
    const answerWords = answer
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3)
    if (answerWords.length > 0) {
      const keyWord = answerWords[0]
      const lengthGuidance = expectedLength === "short" ? "briefly" : expectedLength === "long" ? "in detail" : "clearly"
      hints.push({
        level: "medium",
        type: "semantic",
        content: `The answer is related to "${keyWord}" and its applications. Explain ${lengthGuidance} how this concept works.`,
        spoilerLevel: "medium",
        penalty: 10,
        description: "More specific hint",
        targetLength: expectedLength,
        minWords: config.minWords
      })
    } else {
      hints.push({
        level: "medium",
        type: "contextual",
        content: `Consider the most common or fundamental aspect of this topic. Provide a ${config.description} overview.`,
        spoilerLevel: "medium",
        penalty: 10,
        description: "More specific hint",
        targetLength: expectedLength,
        minWords: config.minWords
      })
    }
  }

  // Third hint - major spoiler with length context
  if (answer && answer.length > 10) {
    const firstPart = answer.substring(0, Math.ceil(answer.length / 3))
    hints.push({
      level: "high",
      type: "direct",
      content: `The answer starts with: "${firstPart}..." (This is a ${expectedLength} answer that should be ${config.minWords}+ words)`,
      spoilerLevel: "high",
      penalty: 15,
      description: "Major spoiler",
      targetLength: expectedLength,
      minWords: config.minWords
    })
  } else if (answer) {
    hints.push({
      level: "high",
      type: "structural",
      content: `The answer is a ${answer.length}-character response. This should be expanded to a ${config.description} ${expectedLength} answer.`,
      spoilerLevel: "high",
      penalty: 15,
      description: "Major spoiler",
      targetLength: expectedLength,
      minWords: config.minWords
    })
  }

  return hints
}
