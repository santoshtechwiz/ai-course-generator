/**
 * String and Text Utilities
 * 
 * Consolidated string manipulation and text processing utilities.
 */

import { nanoid } from "nanoid"
import slugify from "slugify"
import prisma from "@/lib/db"

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return nanoid()
}

/**
 * Generate a unique ID with custom length
 */
export function generateIdWithLength(length: number = 8): string {
  return nanoid(length)
}

// ============================================================================
// SLUG GENERATION
// ============================================================================

/**
 * Generate a URL-friendly slug from a string (using slugify)
 */
export function generateSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  })
}

/**
 * Alternative slug generation with custom rules
 */
export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

/**
 * Legacy alias for compatibility
 */
export const titleToSlug = generateSlug

// ============================================================================
// TEXT PROCESSING
// ============================================================================

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
  ])

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .filter((word, index, arr) => arr.indexOf(word) === index)
    .slice(0, maxKeywords)
}

/**
 * Normalize whitespace in text
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(text: string): string {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

/**
 * Convert camelCase to kebab-case
 */
export function camelToKebab(text: string): string {
  return text.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Convert kebab-case to camelCase
 */
export function kebabToCamel(text: string): string {
  return text.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

// ============================================================================
// CLIPBOARD UTILITIES
// ============================================================================

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    return success
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

// ============================================================================
// TEXT SIMILARITY (moved from separate file)
// ============================================================================

export type SimilarityLevel = 'exact' | 'high' | 'medium' | 'low' | 'none'

/**
 * Calculate text similarity between two strings
 */
export function calculateTextSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1
  
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  if (longer.length === 0) return 1
  
  return (longer.length - editDistance(longer, shorter)) / longer.length
}

/**
 * Get similarity level from similarity score
 */
export function getSimilarityLevel(similarity: number): SimilarityLevel {
  if (similarity >= 0.95) return 'exact'
  if (similarity >= 0.8) return 'high'
  if (similarity >= 0.6) return 'medium'
  if (similarity >= 0.3) return 'low'
  return 'none'
}

/**
 * Calculate Levenshtein distance between two strings
 */
function editDistance(s1: string, s2: string): number {
  const matrix = []
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[s2.length][s1.length]
}

// ============================================================================
// DATABASE UTILITIES
// ============================================================================

/**
 * Generate a unique slug for ordering quiz (uses dedicated OrderingQuiz table only)
 * For non-ordering quizzes, still checks both tables for backwards compatibility
 */
export async function generateUniqueSlug(title: string, quizType?: string): Promise<string> {
  const baseSlug = generateSlug(title)

  // For ordering quizzes, only check OrderingQuiz table (dedicated table)
  if (quizType === 'ordering') {
    const orderingQuizCount = await prisma.orderingQuiz.count({ 
      where: { slug: baseSlug } 
    })
    
    if (orderingQuizCount === 0) return baseSlug

    // Try with a timestamp suffix for uniqueness, retry if collision
    let uniqueSlug: string
    let isUnique = false
    let attempts = 0
    do {
      const timestamp =
        Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000)
      uniqueSlug = `${baseSlug}-${timestamp}`

      const orderingQuizCountRetry = await prisma.orderingQuiz.count({ 
        where: { slug: uniqueSlug } 
      })

      if (orderingQuizCountRetry === 0) isUnique = true
      attempts++
    } while (!isUnique && attempts < 5)

    return uniqueSlug
  }

  // For other quiz types, check both tables (backwards compatibility)
  const [userQuizCount, orderingQuizCount] = await Promise.all([
    prisma.userQuiz.count({ where: { slug: baseSlug } }),
    prisma.orderingQuiz.count({ where: { slug: baseSlug } })
  ])

  if (userQuizCount === 0 && orderingQuizCount === 0) return baseSlug

  // Try with a timestamp suffix for uniqueness, retry if collision
  let uniqueSlug: string
  let isUnique = false
  let attempts = 0
  do {
    const timestamp =
      Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000)
    uniqueSlug = `${baseSlug}-${timestamp}`

    const [userQuizCountRetry, orderingQuizCountRetry] = await Promise.all([
      prisma.userQuiz.count({ where: { slug: uniqueSlug } }),
      prisma.orderingQuiz.count({ where: { slug: uniqueSlug } })
    ])

    if (userQuizCountRetry === 0 && orderingQuizCountRetry === 0) isUnique = true
    attempts++
  } while (!isUnique && attempts < 5)

  return uniqueSlug
}
