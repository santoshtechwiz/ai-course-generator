/**
 * Unified Context-Aware Hint Generation System
 *
 * Generates intelligent, adaptive hints using question metadata:
 * - tags: High-level concepts (e.g., "design pattern", "object creation")
 * - keywords: Specific terms (e.g., "single", "instance", "shared resource")
 * - blanks: Fill-in-the-gap patterns (e.g., "It ensures only ___ instance")
 * - hints: Instructor-provided hints from database
 *
 * Adaptive Strategy:
 * - Far from correct (similarity < 0.3) → Tags/Concept hints
 * - Closer (0.3-0.6) → Keywords hints
 * - Very close (0.6-0.8) → Blanks/Structure hints
 *
 * Enhanced Features:
 * - Character count and letter boundary hints (no spoilers)
 * - Edit distance feedback for user attempts
 * - Progressive reveal based on answer similarity
 * - Spoiler masking for sensitive hints
 */

import { calculateAnswerSimilarity } from './text-similarity'

export interface Hint {
  level: "low" | "medium" | "high"
  type: "contextual" | "structural" | "semantic" | "direct"
  content: string
  maskedContent?: string
  icon: string
  spoilerLevel: "low" | "medium" | "high"
  penalty: number
  description: string
  targetLength?: "short" | "medium" | "long"
  minWords?: number
}

export interface QuestionMetadata {
  tags?: string[]
  keywords?: string[]
  blanks?: string[]
  hints?: string[]
  expectedLength?: "short" | "medium" | "long"
  minWords?: number
  maxWords?: number
}

export interface HintSystemConfig {
  maxHints: number
  progressiveReveal: boolean
  allowDirectAnswer: boolean
}

/**
 * Generate comprehensive hints from question metadata
 *
 * @param correctAnswer - The correct answer
 * @param questionText - The question being asked
 * @param metadata - Question metadata (tags, keywords, blanks, hints)
 * @param userAnswer - Optional user answer for adaptive selection
 * @param config - Configuration options
 * @returns Array of hints ordered by usefulness and spoiler level
 */
export function generateHints(
  correctAnswer: string,
  questionText: string,
  metadata: QuestionMetadata = {},
  userAnswer?: string,
  config: Partial<HintSystemConfig> = {}
): Hint[] {
  const hints: Hint[] = []
  const {
    tags = [],
    keywords = [],
    blanks = [],
    hints: providedHints = [],
    expectedLength = "medium"
  } = metadata

  const maxHints = config.maxHints ?? 5
  const allowDirect = config.allowDirectAnswer ?? false

  // PHASE 1: ENHANCED HINTS (No spoilers - most useful)
  // ===================================================

  // Character count hint (ALWAYS FIRST - most useful, no spoilers)
  if (correctAnswer) {
    const charCount = correctAnswer.trim().length
    const wordCount = correctAnswer.trim().split(/\s+/).length
    const characterHint = wordCount === 1
      ? `💡 The answer has exactly **${charCount} characters**`
      : `💡 The answer has **${wordCount} words** with a total of **${charCount} characters**`

    hints.push({
      level: "low",
      type: "structural",
      content: characterHint,
      maskedContent: characterHint,
      icon: "💡",
      spoilerLevel: "low",
      penalty: 0,
      description: "Character count",
      targetLength: expectedLength
    })
  }

  // Letter boundaries hint (SECOND - very useful, minimal spoilers)
  if (correctAnswer && hints.length < maxHints) {
    const cleaned = correctAnswer.trim()
    const words = cleaned.split(/\s+/)
    let letterHint = ""

    if (words.length === 1) {
      const firstLetter = cleaned.charAt(0).toUpperCase()
      const lastLetter = cleaned.charAt(cleaned.length - 1).toLowerCase()
      letterHint = `🔤 Starts with **'${firstLetter}'** and ends with **'${lastLetter}'**`
    } else {
      const firstLetter = words[0].charAt(0).toUpperCase()
      const lastWord = words[words.length - 1]
      const lastLetter = lastWord.charAt(lastWord.length - 1).toLowerCase()
      letterHint = `🔤 First word starts with **'${firstLetter}'**, last word ends with **'${lastLetter}'**`
    }

    hints.push({
      level: "low",
      type: "structural",
      content: letterHint,
      maskedContent: letterHint,
      icon: "🔤",
      spoilerLevel: "low",
      penalty: 0,
      description: "Letter boundaries",
      targetLength: expectedLength
    })
  }

  // Edit distance hint (if user has attempted)
  if (userAnswer && userAnswer.trim() && hints.length < maxHints) {
    try {
      const distance = levenshtein(userAnswer.trim().toLowerCase(), correctAnswer.trim().toLowerCase())
      const distanceHint = distance === 0
        ? `Your answer matches exactly.`
        : distance === 1
        ? `You're very close — only 1 edit away from the answer.`
        : `You're ${distance} edits away from the correct answer.`

      hints.push({
        level: "low",
        type: "structural",
        content: distanceHint,
        maskedContent: distanceHint,
        icon: "📏",
        spoilerLevel: "low",
        penalty: 0,
        description: "Proximity hint",
        targetLength: expectedLength
      })
    } catch (err) {
      // Ignore distance calculation failures
    }
  }

  // PHASE 2: INSTRUCTOR-PROVIDED HINTS (Database hints)
  // ===================================================

  const sanitizedHints = sanitizeProvidedHints(providedHints, correctAnswer)
  for (let i = 0; i < sanitizedHints.length && hints.length < maxHints; i++) {
    const hintLevel = i < 1 ? "low" : i < 2 ? "medium" : "high"
    const spoilerLevel = i < 1 ? "low" : i < 2 ? "medium" : "high"

    hints.push({
      level: hintLevel,
      type: "contextual",
      content: sanitizedHints[i],
      maskedContent: sanitizedHints[i],
      icon: "📚",
      spoilerLevel: spoilerLevel as "low" | "medium" | "high",
      penalty: 0, // No penalty for instructor hints
      description: `Instructor hint ${i + 1}`,
      targetLength: expectedLength
    })
  }

  // PHASE 3: GENERATED CONTEXTUAL HINTS (From metadata)
  // ===================================================

  // Concept hint from tags
  if (hints.length < maxHints) {
    const conceptHint = generateConceptHint(tags, questionText)
    hints.push({
      level: "low",
      type: "contextual",
      content: conceptHint,
      maskedContent: conceptHint,
      icon: "💡",
      spoilerLevel: "low",
      penalty: 0,
      description: "Concept clue",
      targetLength: expectedLength
    })
  }

  // Keyword hint from keywords
  if (keywords.length > 0 && hints.length < maxHints) {
    const keywordHint = generateKeywordHint(keywords, correctAnswer)
    hints.push({
      level: "low",
      type: "semantic",
      content: keywordHint,
      maskedContent: keywordHint,
      icon: "🔑",
      spoilerLevel: "low",
      penalty: 0,
      description: "Keyword clue",
      targetLength: expectedLength
    })
  }

  // Enhanced context hint from question analysis
  if (hints.length < maxHints && questionText) {
    const contextHint = generateEnhancedContextHint(correctAnswer, questionText, tags)
    if (contextHint) {
      hints.push({
        level: "medium",
        type: "contextual",
        content: contextHint,
        maskedContent: contextHint,
        icon: "🎯",
        spoilerLevel: "medium",
        penalty: 0,
        description: "Question context",
        targetLength: expectedLength
      })
    }
  }

  // Structure hint from blanks
  if (blanks.length > 0 && hints.length < maxHints) {
    const structureHint = generateStructureHint(blanks, correctAnswer)
    hints.push({
      level: "medium",
      type: "structural",
      content: structureHint,
      maskedContent: structureHint,
      icon: "📝",
      spoilerLevel: "medium",
      penalty: 0,
      description: "Structure clue",
      targetLength: expectedLength
    })
  }

  // Partial reveal hint
  if (hints.length < maxHints) {
    const partialHint = generatePartialHint(correctAnswer)
    hints.push({
      level: "medium",
      type: "semantic",
      content: partialHint,
      maskedContent: partialHint,
      icon: "👁️",
      spoilerLevel: "medium",
      penalty: 0,
      description: "Partial reveal",
      targetLength: expectedLength
    })
  }

  // Direct answer (last resort)
  if (allowDirect && hints.length < maxHints) {
    const directHint = `The answer is "${correctAnswer}".`
    hints.push({
      level: "high",
      type: "direct",
      content: directHint,
      maskedContent: maskForLevel(correctAnswer, 'high'),
      icon: "🎯",
      spoilerLevel: "high",
      penalty: 0,
      description: "Complete answer",
      targetLength: expectedLength
    })
  }

  return hints.slice(0, maxHints)
}

/**
 * Generate concept-level hint from tags
 */
function generateConceptHint(tags: string[], questionText: string): string {
  if (tags.length > 0) {
    const tagList = tags.slice(0, 3).join(', ')
    return `Think about these concepts: **${tagList}**. How do they relate to the question?`
  }

  // Fallback: Extract topic from question
  const topic = extractTopicFromQuestion(questionText)
  if (topic) {
    return `Consider the fundamental concept of **${topic}**. What is its main purpose or characteristic?`
  }

  return `Break down the question into key concepts. What's the main idea being asked about?`
}

/**
 * Generate keyword-level hint from keywords
 */
function generateKeywordHint(keywords: string[], correctAnswer: string): string {
  if (keywords.length > 0) {
    const keywordList = keywords.slice(0, 4).join(', ')
    return `Key terms to include: **${keywordList}**. Try incorporating these specific words in your answer.`
  }

  // Fallback: Extract important words from answer
  const answerWords = correctAnswer
    .split(/\s+/)
    .filter(w => w.length > 3 && !/^(the|and|for|with|that|this)$/i.test(w))
    .slice(0, 3)

  if (answerWords.length > 0) {
    return `Important terms to consider: **${answerWords.join(', ')}**. These words are central to the answer.`
  }

  return `Focus on the most specific and descriptive terms that directly answer the question.`
}

/**
 * Generate structure-level hint from blanks
 */
function generateStructureHint(blanks: string[], correctAnswer: string): string {
  if (blanks.length > 0) {
    // Use first blank pattern as the hint
    const blankPattern = blanks[0]
    return `Fill in the blanks: "${blankPattern}"`
  }

  // Fallback: Create a partial reveal structure
  const words = correctAnswer.split(/\s+/)

  if (words.length > 3) {
    // Multi-word answer: reveal middle context words as hints
    const middleStart = Math.floor(words.length / 3)
    const middleEnd = Math.ceil(words.length * 2 / 3)
    const masked = words.map((w, i) => {
      if (i >= middleStart && i < middleEnd) return w
      return '___'
    })
    return `Answer structure: "${masked.join(' ')}"`
  } else if (words.length > 1) {
    // 2-3 words: reveal middle word as context
    const middleIndex = Math.floor(words.length / 2)
    const masked = words.map((w, i) => i === middleIndex ? w : '___')
    return `Answer structure: "${masked.join(' ')}"`
  } else {
    // Single word: show first and last character only
    const word = words[0]
    if (word.length <= 3) {
      return `The answer is a short word with ${word.length} letters.`
    }
    // Display only first and last characters with ellipsis for blanks
    const masked = `${word[0]}...${word[word.length - 1]}`
    return `Answer structure: "${masked}" (${word.length} letters)`
  }
}

/**
 * Generate enhanced context hint from question analysis
 */
function generateEnhancedContextHint(answer: string, question: string, tags: string[] = []): string {
  const questionLower = question.toLowerCase()
  const answerLower = answer.toLowerCase()

  // Extract key phrases from question
  const actionWords = ['process', 'method', 'technique', 'approach', 'strategy', 'concept', 'principle', 'structure']
  const hasActionWord = actionWords.find(word => questionLower.includes(word))

  // Programming/Tech specific
  if (tags.some(t => ['Programming', 'Code', 'Algorithm'].includes(t)) || questionLower.includes('program') || questionLower.includes('code')) {
    return "💡 This involves a programming concept or coding technique"
  }

  // Database/SQL specific
  if (tags.some(t => ['SQL', 'Database', 'Performance'].includes(t)) || questionLower.includes('database') || questionLower.includes('query')) {
    return "💡 This relates to database management or query optimization"
  }

  // General context from question structure
  if (hasActionWord) {
    return `💡 Consider the ${hasActionWord} used in this context`
  }

  // Fallback based on answer characteristics
  if (question.length > 100) {
    return "💡 The answer relates to the detailed scenario described in the question"
  }

  return "💡 The answer is a specific term related to the question's main topic"
}

/**
 * Generate partial reveal hint
 */
function generatePartialHint(answer: string): string {
  const cleaned = answer.trim()
  if (!cleaned) return "The answer contains specific technical terms"

  const words = cleaned.split(/\s+/)
  if (words.length === 1) {
    // Single word: reveal first letter and length
    const word = words[0]
    if (word.length <= 3) {
      return `The answer is a short word with ${word.length} letters.`
    }
    return `The answer starts with "${word[0]}" and has ${word.length} letters.`
  } else {
    // Multi-word: reveal first letters of first few words
    const revealCount = Math.min(2, words.length)
    const revealed = words.slice(0, revealCount).map(w => w[0]).join('')
    return `The answer starts with "${revealed}" and contains ${words.length} words.`
  }
}

/**
 * Select appropriate hint based on user's answer similarity
 */
export function selectAdaptiveHint(
  userAnswer: string,
  correctAnswer: string,
  availableHints: Hint[],
  revealedCount: number
): { hint: Hint; reason: string; encouragement: string } | null {
  if (revealedCount >= availableHints.length) {
    return null // No more hints available
  }

  // If no user answer yet, show first hint (concept)
  if (!userAnswer || userAnswer.trim().length === 0) {
    return {
      hint: availableHints[0],
      reason: 'Start with high-level guidance',
      encouragement: 'Good start! Use this hint to guide your thinking.'
    }
  }

  // Calculate similarity to determine which hint type to show
  const { similarity } = calculateAnswerSimilarity(userAnswer, correctAnswer)

  let targetIndex = revealedCount // Default: sequential progression
  let reason = 'Continuing with next hint level'
  let encouragement = 'Keep going! You\'re making progress.'

  if (similarity < 0.3) {
    // Far from correct → Need concept help
    targetIndex = 0
    reason = 'Answer is far from correct — showing concept clue'
    encouragement = 'Don\'t worry — the concept clue will help guide your direction.'
  } else if (similarity >= 0.3 && similarity < 0.6) {
    // Getting closer → Need keyword help
    targetIndex = Math.min(1, availableHints.length - 1)
    reason = 'Answer is getting closer — showing keyword clue to narrow focus'
    encouragement = 'Nice effort! The keyword clue will help you get more specific.'
  } else if (similarity >= 0.6 && similarity < 0.8) {
    // Very close → Need structure help
    targetIndex = Math.min(2, availableHints.length - 1)
    reason = 'Answer is very close — showing structure clue to complete it'
    encouragement = 'Almost there! The structure clue will help you nail the exact wording.'
  } else {
    // Answer is good (≥ 80%) - no hint needed
    return null
  }

  // Ensure we don't go backwards (can't "un-reveal" a hint)
  targetIndex = Math.max(revealedCount, targetIndex)

  if (targetIndex >= availableHints.length) {
    return null
  }

  return {
    hint: availableHints[targetIndex],
    reason,
    encouragement
  }
}

/**
 * Format hint for display with positive reinforcement
 */
export function formatHintForDisplay(
  hint: Hint,
  hintNumber: number,
  totalHints: number
): {
  title: string
  content: string
  badge: string
  color: string
} {
  const colors = {
    contextual: {
      badge: 'Context',
      color: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/10 dark:text-blue-300 dark:border-blue-800'
    },
    structural: {
      badge: 'Structure',
      color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800'
    },
    semantic: {
      badge: 'Semantic',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/10 dark:text-emerald-300 dark:border-emerald-800'
    },
    direct: {
      badge: 'Direct',
      color: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/10 dark:text-red-300 dark:border-red-800'
    }
  }

  const config = colors[hint.type]

  return {
    title: `${hint.icon} Hint ${hintNumber}/${totalHints}`,
    content: hint.content,
    badge: config.badge,
    color: config.color
  }
}

/**
 * Extract topic from question text (simple heuristic)
 */
function extractTopicFromQuestion(questionText: string): string | null {
  const text = questionText.toLowerCase()

  // Pattern: "What is X?", "What are X?", "Define X"
  let match = text.match(/what (?:is|are) (?:the |a |an )?([^?]+)/i)
  if (match) return match[1].trim()

  // Pattern: "Explain X", "Describe X"
  match = text.match(/(?:explain|describe) (?:the |a |an )?([^?]+)/i)
  if (match) return match[1].trim()

  return null
}

/**
 * Sanitize provided hints to prevent answer leakage
 */
function sanitizeProvidedHint(hint: string, answer: string): string {
  if (!hint || !answer) return hint

  try {
    // Remove direct answer occurrences
    let sanitized = hint
    const answerWords = answer.toLowerCase().split(/\s+/)

    // Remove exact answer matches
    if (sanitized.toLowerCase().includes(answer.toLowerCase())) {
      sanitized = sanitized.replace(new RegExp(answer, 'gi'), '___')
    }

    // Remove significant answer word matches (3+ characters)
    for (const word of answerWords) {
      if (word.length >= 3 && sanitized.toLowerCase().includes(word.toLowerCase())) {
        sanitized = sanitized.replace(new RegExp(word, 'gi'), '___')
      }
    }

    return sanitized
  } catch (e) {
    return hint
  }
}

/**
 * Sanitize array of provided hints
 */
function sanitizeProvidedHints(hints: string[], answer: string): string[] {
  return hints.map(hint => sanitizeProvidedHint(hint, answer))
}

/**
 * Simple Levenshtein distance implementation
 */
function levenshtein(a: string, b: string): number {
  const alen = a.length
  const blen = b.length
  if (alen === 0) return blen
  if (blen === 0) return alen

  let v0 = new Array(blen + 1).fill(0)
  let v1 = new Array(blen + 1).fill(0)

  for (let i = 0; i <= blen; i++) v0[i] = i

  for (let i = 0; i < alen; i++) {
    v1[0] = i + 1
    for (let j = 0; j < blen; j++) {
      const cost = (a[i] === b[j]) ? 0 : 1
      v1[j + 1] = Math.min(
        v1[j] + 1,      // deletion
        v0[j + 1] + 1,  // insertion
        v0[j] + cost    // substitution
      )
    }
    [v0, v1] = [v1, v0]
  }

  return v0[blen]
}

/**
 * Mask content based on spoiler level
 */
function maskForLevel(text: string, level: "low" | "medium" | "high"): string {
  if (!text) return text

  // If single word answer, reveal more letters progressively
  if (!/\s+/.test(text)) {
    if (level === 'low') return maskWord(text, 1)
    if (level === 'medium') return maskWord(text, 2)
    return maskWord(text, Math.max(2, Math.ceil(text.length / 3)))
  }

  // Multi-word answers: reveal some words
  if (level === 'low') return maskSentence(text, 0)
  if (level === 'medium') return maskSentence(text, 1)
  return maskSentence(text, Math.max(1, Math.floor(text.split(/\s+/).length / 2)))
}

/**
 * Mask a single word
 */
function maskWord(word: string, revealFirst = 1): string {
  if (!word) return word
  const len = word.length
  const visible = Math.max(0, Math.min(revealFirst, len))
  const masked = '_'.repeat(Math.max(1, len - visible))
  return word.slice(0, visible) + masked
}

/**
 * Mask a sentence
 */
function maskSentence(text: string, revealWords = 1): string {
  if (!text) return text
  const words = text.split(/\s+/)
  if (words.length <= revealWords) return words.map(w => maskWord(w, 1)).join(' ')
  return words
    .map((w, i) => (i < revealWords ? w : '_'.repeat(Math.max(1, w.length))))
    .join(' ')
}

export default {
  generateHints,
  selectAdaptiveHint,
  formatHintForDisplay
}