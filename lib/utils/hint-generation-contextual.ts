/**
 * Context-Aware Hint Generation System
 * 
 * Generates intelligent, adaptive hints using question metadata:
 * - tags: High-level concepts (e.g., "design pattern", "object creation")
 * - keywords: Specific terms (e.g., "single", "instance", "shared resource")
 * - blanks: Fill-in-the-gap patterns (e.g., "It ensures only ___ instance")
 * 
 * Adaptive Strategy:
 * - Far from correct (similarity < 0.3) → Tags/Concept hints
 * - Closer (0.3-0.6) → Keywords hints
 * - Very close (0.6-0.8) → Blanks/Structure hints
 */

import { calculateAnswerSimilarity } from './text-similarity'

export interface ContextualHint {
  level: "concept" | "keyword" | "structure"
  content: string
  icon: string
  spoilerLevel: "low" | "medium" | "high"
  description: string
}

export interface QuestionMetadata {
  tags?: string[]
  keywords?: string[]
  blanks?: string[]
}

/**
 * Generate contextual hints from question metadata
 * 
 * @param correctAnswer - The correct answer
 * @param questionText - The question being asked
 * @param metadata - Question metadata (tags, keywords, blanks)
 * @param userAnswer - Optional user answer for adaptive selection
 * @returns Array of contextual hints (Concept → Keyword → Structure)
 */
export function generateContextualHints(
  correctAnswer: string,
  questionText: string,
  metadata: QuestionMetadata = {},
  userAnswer?: string
): ContextualHint[] {
  const hints: ContextualHint[] = []
  const { tags = [], keywords = [], blanks = [] } = metadata
  
  // HINT 1: CONCEPT CLUE (Tags-based)
  // ==================================
  const conceptHint = generateConceptHint(tags, questionText)
  hints.push({
    level: "concept",
    content: conceptHint,
    icon: "💡",
    spoilerLevel: "low",
    description: "Concept Clue — High-level topic direction"
  })
  
  // HINT 2: KEYWORD CLUE (Keywords-based)
  // ======================================
  const keywordHint = generateKeywordHint(keywords, correctAnswer)
  hints.push({
    level: "keyword",
    content: keywordHint,
    icon: "🔑",
    spoilerLevel: "low",
    description: "Keyword Clue — Specific terms to focus on"
  })
  
  // HINT 3: STRUCTURE CLUE (Blanks-based)
  // ======================================
  const structureHint = generateStructureHint(blanks, correctAnswer)
  hints.push({
    level: "structure",
    content: structureHint,
    icon: "📝",
    spoilerLevel: "medium",
    description: "Structure Clue — Fill-in-the-gap guidance"
  })
  
  return hints
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
    // Multi-word answer: reveal first and last word, mask middle
    const masked = [
      words[0],
      ...Array(words.length - 2).fill('___'),
      words[words.length - 1]
    ]
    return `Answer structure: "${masked.join(' ')}"`
  } else if (words.length > 1) {
    // 2-3 words: reveal first word only
    const masked = [words[0], ...words.slice(1).map(() => '___')]
    return `Answer structure: "${masked.join(' ')}"`
  } else {
    // Single word: show first and last letter
    const word = words[0]
    if (word.length <= 3) {
      return `The answer is a short word with ${word.length} letters.`
    }
    const masked = word[0] + '___'.repeat(word.length - 2) + word[word.length - 1]
    return `Answer structure: "${masked}" (${word.length} letters)`
  }
}

/**
 * Select appropriate hint based on user's answer similarity
 * 
 * @param userAnswer - User's current answer
 * @param correctAnswer - The correct answer
 * @param availableHints - Generated contextual hints
 * @param revealedCount - Number of hints already shown
 * @returns Next hint to show with reasoning
 */
export function selectAdaptiveContextualHint(
  userAnswer: string,
  correctAnswer: string,
  availableHints: ContextualHint[],
  revealedCount: number
): { hint: ContextualHint; reason: string; encouragement: string } | null {
  if (revealedCount >= availableHints.length) {
    return null // No more hints available
  }
  
  // If no user answer yet, show first hint (concept)
  if (!userAnswer || userAnswer.trim().length === 0) {
    return {
      hint: availableHints[0],
      reason: 'Start with high-level concept guidance',
      encouragement: 'Good start! Use the concept clue to guide your thinking.'
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
    reason = 'Answer is quite different from expected — showing concept clue'
    encouragement = 'Don\'t worry — the concept clue will help guide your direction.'
  } else if (similarity >= 0.3 && similarity < 0.6) {
    // Getting closer → Need keyword help
    targetIndex = Math.min(1, availableHints.length - 1)
    reason = 'Answer is improving — showing keyword clue to narrow focus'
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
 * Format hint for display with positive reinforcement
 */
export function formatHintForDisplay(
  hint: ContextualHint,
  hintNumber: number,
  totalHints: number
): {
  title: string
  content: string
  badge: string
  color: string
} {
  const colors = {
    concept: {
      badge: 'Concept',
      color: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/10 dark:text-blue-300 dark:border-blue-800'
    },
    keyword: {
      badge: 'Keyword',
      color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800'
    },
    structure: {
      badge: 'Structure',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/10 dark:text-emerald-300 dark:border-emerald-800'
    }
  }
  
  const config = colors[hint.level]
  
  return {
    title: `${hint.icon} Hint ${hintNumber}/${totalHints}`,
    content: hint.content,
    badge: config.badge,
    color: config.color
  }
}

export default {
  generateContextualHints,
  selectAdaptiveContextualHint,
  formatHintForDisplay
}
