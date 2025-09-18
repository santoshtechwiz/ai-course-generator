"use client"

import { useAppSelector } from '@/store'
import type { RatingAnswer } from '@/store/slices/flashcard-slice'

export function AccuracyBadge() {
  const answers = useAppSelector((state) => state.flashcard.answers)

  // Filter only rating answers (not saved answers)
  const ratingAnswers = answers.filter((a): a is RatingAnswer =>
    'answer' in a && typeof a.answer === 'string'
  )

  // Calculate accuracy and streak
  const total = ratingAnswers.length
  const correct = ratingAnswers.filter((a) => a.answer === 'correct').length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  // Calculate current streak
  let streak = 0
  if (ratingAnswers.length > 0) {
    for (let i = ratingAnswers.length - 1; i >= 0; i--) {
      if (ratingAnswers[i].answer === 'correct') {
        streak++
      } else {
        break
      }
    }
  }

  return (
    <div className="text-center">
      <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
        {accuracy}%
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Accuracy
      </div>
      {streak > 0 && (
        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          🔥 {streak} streak
        </div>
      )}
    </div>
  )
}