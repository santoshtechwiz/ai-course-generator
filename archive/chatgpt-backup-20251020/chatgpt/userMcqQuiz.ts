/**
 * User MCQ Quiz Generation
 * 
 * This file now re-exports the new subscription-aware wrapper functions.
 * The actual implementations are in lib/ai/services/wrappers.ts
 */

import type { Quiz } from "@/app/types/types"

// Re-export the new subscription-aware functions from wrappers
export { 
  generateMcqForUserInput,
  generateOpenEndedQuiz,
  generateOpenEndedFillIntheBlanks,
} from '@/lib/ai/services/wrappers'
