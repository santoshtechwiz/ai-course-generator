/**
 * Quiz Difficulty Configuration
 * 
 * Centralized configuration for quiz difficulty levels.
 * Provides colors, descriptions, and metadata for consistent styling across quiz types.
 */

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number]

/**
 * Configuration for difficulty levels
 * Includes visual styling and descriptions
 */
interface DifficultyConfig {
  label: string
  value: DifficultyLevel
  color: string
  description: string
  icon?: string
  estimatedTime?: string
}

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, Omit<DifficultyConfig, 'value'>> = {
  easy: {
    label: 'Easy',
    color:
      'bg-success text-white border-4 border-border shadow-neo',
    description: 'Basic concepts and fundamental skills. Great for beginners.',
    estimatedTime: '5-10 minutes per question',
  },
  medium: {
    label: 'Medium',
    color:
      'bg-warning text-white border-4 border-border shadow-neo',
    description: 'Intermediate concepts requiring some experience.',
    estimatedTime: '10-15 minutes per question',
  },
  hard: {
    label: 'Hard',
    color:
      'bg-danger text-white border-4 border-border shadow-neo',
    description: 'Advanced topics for experienced developers.',
    estimatedTime: '15-20 minutes per question',
  },
} as const

/**
 * Get configuration for a specific difficulty level
 * @param difficulty - Difficulty level
 * @returns Configuration object
 */
export function getDifficultyConfig(difficulty: DifficultyLevel): DifficultyConfig {
  return {
    value: difficulty,
    ...DIFFICULTY_CONFIG[difficulty],
  }
}

/**
 * Get all difficulty options formatted for UI
 * @returns Array of formatted difficulty options
 */
export function getAllDifficultyOptions(): DifficultyConfig[] {
  return DIFFICULTY_LEVELS.map(getDifficultyConfig)
}

/**
 * Get color for a specific difficulty level
 * @param difficulty - Difficulty level
 * @returns Color class string
 */
export function getDifficultyColor(difficulty: DifficultyLevel): string {
  return DIFFICULTY_CONFIG[difficulty].color
}

/**
 * Validate if a difficulty level is supported
 * @param difficulty - Value to validate
 * @returns True if valid difficulty level
 */
export function isValidDifficulty(difficulty: unknown): difficulty is DifficultyLevel {
  return typeof difficulty === 'string' && DIFFICULTY_LEVELS.includes(difficulty as DifficultyLevel)
}

/**
 * Get difficulty label (capitalized)
 * @param difficulty - Difficulty level
 * @returns Display label
 */
export function getDifficultyLabel(difficulty: DifficultyLevel): string {
  return DIFFICULTY_CONFIG[difficulty].label
}
