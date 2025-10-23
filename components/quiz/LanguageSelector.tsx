/**
 * Language Selector Component (Neobrutalism Theme)
 * 
 * Reusable component for selecting programming languages with neobrutalism styling.
 * Features sharp borders, clean shadows, and solid color scheme.
 */

'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Code } from 'lucide-react'
import {
  PROGRAMMING_LANGUAGES,
  LANGUAGE_GROUPS,
  LANGUAGE_GROUP_CONFIG,
  getLanguagesInGroup,
  isValidLanguage,
  getAllLanguageGroups,
  type LanguageGroup,
  type ProgrammingLanguage,
} from '@/config/quizLanguageConfig'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface LanguageSelectorProps {
  /** Currently selected language */
  value: string
  /** Called when language changes */
  onChange: (language: string) => void
  /** Show all languages in addition to groups */
  showAllOption?: boolean
  /** Allow custom language input */
  allowCustom?: boolean
  /** Placeholder text for custom language input */
  customPlaceholder?: string
  /** CSS class for container */
  className?: string
  /** Disable the selector */
  disabled?: boolean
  /** Aria label for accessibility */
  ariaLabel?: string
}

/**
 * Language Selector Component with Neobrutalism Design
 */
export const LanguageSelector = React.memo(function LanguageSelector({
  value,
  onChange,
  showAllOption = true,
  allowCustom = true,
  customPlaceholder = 'Enter custom programming language',
  className,
  disabled = false,
  ariaLabel = 'Select programming language',
}: LanguageSelectorProps) {
  const [selectedGroup, setSelectedGroup] = React.useState<LanguageGroup | 'All'>('Popular')
  const [showCustomInput, setShowCustomInput] = React.useState(false)
  const [customLanguage, setCustomLanguage] = React.useState('')

  // Determine which languages to display
  const filteredLanguages = React.useMemo(() => {
    if (selectedGroup === 'All') {
      return Array.from(PROGRAMMING_LANGUAGES)
    }
    return getLanguagesInGroup(selectedGroup)
  }, [selectedGroup])

  // Handle language selection
  const handleLanguageSelect = React.useCallback(
    (lang: string) => {
      if (lang === 'Other/Custom') {
        setShowCustomInput(true)
      } else {
        onChange(lang)
        setShowCustomInput(false)
        setCustomLanguage('')
      }
    },
    [onChange]
  )

  // Handle custom language submission
  const handleCustomLanguageChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setCustomLanguage(val)
      onChange(val)
    },
    [onChange]
  )

  // Handle cancel custom language
  const handleCancelCustom = React.useCallback(() => {
    setShowCustomInput(false)
    setCustomLanguage('')
    onChange('JavaScript') // Reset to default
  }, [onChange])

  const languageGroups = React.useMemo(() => getAllLanguageGroups(), [])

  return (
    <div className={cn('space-y-3', className)}>
      {/* Language Group Buttons - Neobrutalism Style */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-foreground">Category:</p>

        <div className="flex flex-wrap gap-2">
          {languageGroups.map((group) => {
            const config = LANGUAGE_GROUP_CONFIG[group]
            const IconComponent = config.icon
            const isSelected = selectedGroup === group

            return (
              <motion.button
                key={group}
                type="button"
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 font-semibold text-sm border-2 transition-all',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))]'
                    : 'border-border bg-card text-foreground hover:border-primary hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))]'
                )}
                onClick={() => setSelectedGroup(group)}
                disabled={disabled}
                title={config.description}
              >
                <IconComponent className="w-4 h-4" />
                <span>{group}</span>
              </motion.button>
            )
          })}

          {showAllOption && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 font-semibold text-sm border-2 transition-all',
                selectedGroup === 'All'
                  ? 'border-primary bg-primary text-primary-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))]'
                  : 'border-border bg-card text-foreground hover:border-primary hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))]'
              )}
              onClick={() => setSelectedGroup('All')}
              disabled={disabled}
            >
              <Code className="w-4 h-4" />
              <span>All</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Language Selector or Custom Input */}
      <AnimatePresence mode="wait">
        {!showCustomInput ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <Select value={value} onValueChange={handleLanguageSelect} disabled={disabled}>
              <SelectTrigger
                className="h-11 text-base border-2 focus:ring-0 focus:border-primary"
                aria-label={ariaLabel}
              >
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {filteredLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {allowCustom && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCustomInput(true)}
                disabled={disabled}
                className="border-2 font-semibold w-full gap-2 hover:border-primary hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))]"
              >
                <Plus className="w-4 h-4" />
                <span>Custom language</span>
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="custom"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2"
          >
            <Input
              autoFocus
              placeholder={customPlaceholder}
              value={customLanguage}
              onChange={handleCustomLanguageChange}
              disabled={disabled}
              className="flex-1 h-11 border-2 focus:ring-0 focus:border-primary font-semibold"
              aria-label="Enter custom programming language"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelCustom}
              disabled={disabled}
              size="sm"
              className="px-3 border-2 font-semibold hover:border-destructive hover:bg-destructive/10"
              title="Cancel custom language input"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Cancel</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

LanguageSelector.displayName = 'LanguageSelector'

export default LanguageSelector
