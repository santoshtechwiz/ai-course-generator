/**
 * Difficulty Selector Component (Neobrutalism Theme)
 * 
 * Reusable component for selecting quiz difficulty levels with neobrutalism styling.
 * Features sharp borders, clean shadows, and solid color scheme.
 */

'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Check, HelpCircle } from 'lucide-react'
import {
  DIFFICULTY_LEVELS,
  DIFFICULTY_CONFIG,
  getAllDifficultyOptions,
  type DifficultyLevel,
} from '@/config/quizDifficultyConfig'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface DifficultySelectorProps {
  /** Currently selected difficulty */
  value: DifficultyLevel
  /** Called when difficulty changes */
  onChange: (difficulty: DifficultyLevel) => void
  /** Show help icon with description */
  showHelp?: boolean
  /** CSS class for container */
  className?: string
  /** Disable the selector */
  disabled?: boolean
  /** Button variant style */
  variant?: 'buttons' | 'compact'
  /** Aria label for accessibility */
  ariaLabel?: string
}

/**
 * Difficulty Selector Component with Neobrutalism Design
 */
export const DifficultySelector = React.memo(function DifficultySelector({
  value,
  onChange,
  showHelp = true,
  className,
  disabled = false,
  variant = 'buttons',
  ariaLabel = 'Select quiz difficulty',
}: DifficultySelectorProps) {
  const difficultyOptions = React.useMemo(() => getAllDifficultyOptions(), [])

  const handleDifficultyChange = React.useCallback(
    (difficulty: DifficultyLevel) => {
      onChange(difficulty)
    },
    [onChange]
  )

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header with optional help */}
      {showHelp && (
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground">Difficulty Level</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="hover:opacity-75 transition-opacity" 
                  disabled={disabled}
                  type="button"
                >
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs border-2">
                <p>How challenging should the questions be?</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Difficulty buttons - Neobrutalism Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {difficultyOptions.map((option) => (
          <motion.button
            key={option.value}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDifficultyChange(option.value)}
            disabled={disabled}
            className={cn(
              'relative px-4 py-3 font-bold border-6 transition-all',
              'flex items-center justify-center gap-2 h-12',
              'text-sm sm:text-base',
              value === option.value
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-text)] shadow-[var(--shadow-neo)]'
                : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-neo)]',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-pressed={value === option.value}
            aria-label={`${option.label} difficulty`}
            title={option.description}
          >
            <span>{option.label}</span>
            {value === option.value && <Check className="w-4 h-4" />}
          </motion.button>
        ))}
      </div>

      {/* Inline description of selected difficulty */}
      {value && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-6 border-[var(--color-border)] bg-[var(--color-muted)]/50 p-3"
        >
          <p className="text-sm text-foreground font-semibold">
            {DIFFICULTY_CONFIG[value].label}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {DIFFICULTY_CONFIG[value].description}
          </p>
          {DIFFICULTY_CONFIG[value].estimatedTime && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span>⏱️</span>
              <span>{DIFFICULTY_CONFIG[value].estimatedTime}</span>
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
})

DifficultySelector.displayName = 'DifficultySelector'

export default DifficultySelector
