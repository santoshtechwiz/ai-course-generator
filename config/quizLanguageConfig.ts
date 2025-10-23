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
      'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 border-0',
    hoverScale: 'hover:scale-105',
  },
  Web: {
    icon: Globe,
    description: 'Web and internet technologies',
    color:
      'bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 border-0',
    hoverScale: 'hover:scale-105',
  },
  Mobile: {
    icon: Smartphone,
    description: 'Mobile app development',
    color:
      'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 border-0',
    hoverScale: 'hover:scale-105',
  },
  Systems: {
    icon: Cpu,
    description: 'Systems and low-level programming',
    color:
      'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 border-0',
    hoverScale: 'hover:scale-105',
  },
  Data: {
    icon: Database,
    description: 'Data science and databases',
    color:
      'bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary))]/25 hover:shadow-[hsl(var(--primary))]/40 border-0',
    hoverScale: 'hover:scale-105',
  },
  Functional: {
    icon: Zap,
    description: 'Functional programming languages',
    color:
      'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 border-0',
    hoverScale: 'hover:scale-105',
  },
  Scripts: {
    icon: Terminal,
    description: 'Scripting and automation',
    color:
      'bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-lg shadow-slate-500/25 hover:shadow-slate-500/40 border-0',
    hoverScale: 'hover:scale-105',
  },
  Other: {
    icon: Code,
    description: 'Other programming languages',
    color:
      'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 border-0',
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
