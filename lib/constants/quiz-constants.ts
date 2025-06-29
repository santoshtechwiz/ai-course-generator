/**
 * Quiz storage key constants
 */
export const QUIZ_STORAGE_KEYS = {
  GLOBAL: "quiz_state",
  MCQ: "quiz_state_mcq_",
  OPEN_ENDED: "quiz_state_openended_",
  FILL_BLANKS: "quiz_state_blanks_",
  CODE: "quiz_state_code_",
  FLASHCARD: "quiz_state_flashcard_",
}

/**
 * Quiz difficulty styling constants
 */
export const DIFFICULTY_STYLES = {
  easy: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  medium: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  hard: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
  beginner: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  intermediate: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  advanced: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
  expert: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
}

/**
 * Quiz type styling constants
 */
export const QUIZ_TYPE_STYLES = {
  mcq: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
  openended:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
  "blanks":
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  code: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  flashcard: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800",
}

/**
 * Quiz type difficulty colors
 */
export const QUIZ_DIFFICULTY_COLORS = {
  beginner: "bg-green-100 text-green-800",
  easy: "bg-green-100 text-green-800",
  intermediate: "bg-blue-100 text-blue-800",
  medium: "bg-blue-100 text-blue-800",
  advanced: "bg-purple-100 text-purple-800",
  hard: "bg-purple-100 text-purple-800",
  expert: "bg-red-100 text-red-800",
} as const
