/**
 * Quiz Slice Migration Guide
 * 
 * The quiz slice has been reorganized into a dedicated folder structure.
 * This file provides backwards compatibility and migration path.
 * 
 * OLD STRUCTURE:
 * - store/slices/quiz-slice.ts
 * - store/slices/quiz-slice-types.ts  
 * - store/slices/quiz-slice-helper.ts
 * 
 * NEW STRUCTURE:
 * - store/slices/quiz/
 *   - index.ts (main exports)
 *   - quiz-slice.ts (main slice logic)
 *   - quiz-types.ts (type definitions)
 *   - quiz-helpers.ts (utility functions)
 * 
 * MIGRATION:
 * Update imports from:
 *   import { ... } from '@/store/slices/quiz-slice'
 * To:
 *   import { ... } from '@/store/slices/quiz'
 * 
 * REMOVED:
 * - clearQuizState (deprecated) -> use resetQuiz({ keepResults: false })
 * - Unused helper functions and inconsistent types
 * 
 * IMPROVEMENTS:
 * - Better type safety
 * - Cleaner organization
 * - Consistent naming
 * - Removed deprecated functions
 * - Fixed type inconsistencies
 */

// Backwards compatibility exports
export * from './quiz'
export { quizReducer as default } from './quiz'
