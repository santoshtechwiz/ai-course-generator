/**
 * DEPRECATED: This file is kept for backwards compatibility only.
 * 
 * Please use the functions from @/lib/quiz-metadata directly:
 * - generateQuizMetadata (renamed from generateQuizPageMetadata)
 * 
 * This wrapper will be removed in a future cleanup.
 */

import type { Metadata } from "next"
import { generateQuizMetadata, type QuizMetadataOptions } from "@/lib/quiz-metadata"

/**
 * @deprecated Use generateQuizMetadata from @/lib/quiz-metadata instead
 */
export function generateQuizPageMetadata(options: QuizMetadataOptions): Metadata {
  return generateQuizMetadata(options)
}

/**
 * @deprecated This wrapper component is no longer needed
 */
function QuizPageWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
