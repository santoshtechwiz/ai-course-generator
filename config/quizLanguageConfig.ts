/**
 * Quiz Language Configuration
 * 
 * Centralized configuration for programming languages used in quizzes.
 * Provides language groups, icons, and metadata for consistent UI across all quiz types.
 */

import {
  Star,
  Globe,
  Smartphone,
  Cpu,
  Database,
  Zap,
  Terminal,
  Code,
  type LucideIcon,
} from 'lucide-react'

/**
 * Comprehensive list of supported programming languages
 */
export const PROGRAMMING_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C#',
  'C++',
  'Go',
  'Rust',
  'Swift',
  'Kotlin',
  'PHP',
  'Ruby',
  'HTML/CSS',
  'SQL',
  'Bash/Shell',
  'PowerShell',
  'R',
  'Scala',
  'Dart',
  'Lua',
  'Perl',
  'Haskell',
  'Clojure',
  'F#',
  'VB.NET',
  'Objective-C',
  'Assembly',
  'MATLAB',
  'Groovy',
  'Elixir',
  'Erlang',
  'Crystal',
  'Nim',
  'Zig',
  'Other/Custom',
] as const

export type ProgrammingLanguage = (typeof PROGRAMMING_LANGUAGES)[number]

/**
 * Language grouping for organized selection
 * Groups related languages together for better UX
 */
export const LANGUAGE_GROUPS = {
  Popular: ['JavaScript', 'Python', 'Java', 'TypeScript'],
  Web: ['JavaScript', 'TypeScript', 'HTML/CSS', 'PHP', 'Go'],
  Mobile: ['Swift', 'Kotlin', 'Java', 'Dart', 'Objective-C'],
  Systems: ['C++', 'Rust', 'Go', 'C#', 'Assembly'],
  Data: ['Python', 'R', 'SQL', 'MATLAB', 'Scala'],
  Functional: ['Haskell', 'Clojure', 'F#', 'Elixir', 'Erlang'],
  Scripts: ['Bash/Shell', 'PowerShell', 'Perl', 'Lua'],
  Other: ['Ruby', 'Crystal', 'Nim', 'Zig', 'Groovy'],
} as const

export type LanguageGroup = keyof typeof LANGUAGE_GROUPS

/**
 * Configuration for language groups
 * Includes visual styling, icons, and metadata
 */
interface LanguageGroupConfig {
  icon: LucideIcon
  color: string
  description: string
  hoverScale: string
}

export const LANGUAGE_GROUP_CONFIG: Record<LanguageGroup, LanguageGroupConfig> = {
  Popular: {
    icon: Star,
    description: 'Most commonly used languages',
    color:
      'bg-warning text-white border-4 border-border shadow-neo hover:shadow-neo-xl',
    hoverScale: 'hover:scale-105',
  },
  Web: {
    icon: Globe,
    description: 'Web and internet technologies',
    color:
      'bg-accent text-white border-4 border-border shadow-neo hover:shadow-neo-xl',
    hoverScale: 'hover:scale-105',
  },
  Mobile: {
    icon: Smartphone,
    description: 'Mobile app development',
    color:
      'bg-success text-white border-4 border-border shadow-neo hover:shadow-neo-xl',
    hoverScale: 'hover:scale-105',
  },
  Systems: {
    icon: Cpu,
    description: 'Systems and low-level programming',
    color:
      'bg-danger text-white border-4 border-border shadow-neo hover:shadow-neo-xl',
    hoverScale: 'hover:scale-105',
  },
  Data: {
    icon: Database,
    description: 'Data science and databases',
    color:
      'bg-primary text-white border-4 border-border shadow-neo hover:shadow-neo-xl',
    hoverScale: 'hover:scale-105',
  },
  Functional: {
    icon: Zap,
    description: 'Functional programming languages',
    color:
      'bg-warning text-white border-4 border-border shadow-neo hover:shadow-neo-xl',
    hoverScale: 'hover:scale-105',
  },
  Scripts: {
    icon: Terminal,
    description: 'Scripting and automation',
    color:
      'bg-muted text-foreground border-4 border-border shadow-neo hover:shadow-neo-xl',
    hoverScale: 'hover:scale-105',
  },
  Other: {
    icon: Code,
    description: 'Other programming languages',
    color:
      'bg-accent text-white border-4 border-border shadow-neo hover:shadow-neo-xl',
    hoverScale: 'hover:scale-105',
  },
} as const

/**
 * Get all languages from a specific group
 * @param group - Language group key
 * @returns Array of languages in the group
 */
export function getLanguagesInGroup(group: LanguageGroup): ProgrammingLanguage[] {
  return Array.from(LANGUAGE_GROUPS[group] || [])
}

/**
 * Get configuration for a specific language group
 * @param group - Language group key
 * @returns Group configuration with icon, colors, and metadata
 */
export function getGroupConfig(group: LanguageGroup): LanguageGroupConfig {
  return LANGUAGE_GROUP_CONFIG[group]
}

/**
 * Validate if a language is in the supported list
 * @param language - Language to validate
 * @returns True if language is supported
 */
export function isValidLanguage(language: unknown): language is ProgrammingLanguage {
  return typeof language === 'string' && PROGRAMMING_LANGUAGES.includes(language as ProgrammingLanguage)
}

/**
 * Validate if a language group exists
 * @param group - Group to validate
 * @returns True if group exists
 */
export function isValidLanguageGroup(group: unknown): group is LanguageGroup {
  return typeof group === 'string' && group in LANGUAGE_GROUPS
}

/**
 * Get all available language groups
 * @returns Array of language group keys
 */
export function getAllLanguageGroups(): LanguageGroup[] {
  return Object.keys(LANGUAGE_GROUPS) as LanguageGroup[]
}

/**
 * Find which group a language belongs to
 * @param language - Language to find
 * @returns Group name or undefined if not found
 */
export function findLanguageGroup(language: ProgrammingLanguage): LanguageGroup | undefined {
  for (const group of getAllLanguageGroups()) {
    const languages = LANGUAGE_GROUPS[group]
    if ((languages as readonly string[]).includes(language)) {
      return group
    }
  }
  return undefined
}
