"use client"

import { motion } from "framer-motion"
import { ThumbsUp, ThumbsDown, BookOpen, Sparkles, Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface FlashcardBackProps {
  answer: string
  explanation?: string
  onFlip: () => void
  onSelfRating: (rating: "correct" | "incorrect" | "still_learning") => void
  onSaveCard?: () => void
  isSaved?: boolean
  animationsEnabled: boolean
}

const ratingButtons = [
  {
    id: "correct",
    label: "I knew it!",
    shortLabel: "Known",
    icon: ThumbsUp,
    bg: "bg-[var(--color-success)]",
    hover: "hover:bg-[var(--color-success)]",
    emoji: "🎉",
  },
  {
    id: "still_learning",
    label: "Still learning",
    shortLabel: "Learning",
    icon: BookOpen,
    bg: "bg-[var(--color-accent)]",
    hover: "hover:bg-[var(--color-accent)]",
    emoji: "📚",
  },
  {
    id: "incorrect",
    label: "Need to study",
    shortLabel: "Study",
    icon: ThumbsDown,
    bg: "bg-[var(--color-error)]",
    hover: "hover:bg-[var(--color-error)]",
    emoji: "🤔",
  },
]

export function FlashcardBack({
  answer,
  explanation,
  onFlip,
  onSelfRating,
  onSaveCard,
  isSaved = false,
  animationsEnabled,
}: FlashcardBackProps) {
  return (
    <motion.div
      className="w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, rotateY: 90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      exit={{ opacity: 0, rotateY: -90 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div
        className="w-full bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-[var(--radius)] shadow-[var(--shadow-neo)] min-h-[500px] p-4 sm:p-6 flex flex-col relative cursor-pointer hover:shadow-[6px_6px_0_#000] transition-all duration-200"
        onClick={onFlip}
        role="button"
        aria-label="Flip card to see question"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onFlip()
          }
        }}
      >
          <motion.button
            className={cn(
              "absolute top-6 right-6 z-10 w-12 h-12 border-4 border-[var(--color-border)] transition-all duration-150 rounded-[var(--radius)]",
              isSaved
                ? "bg-[var(--color-error)] shadow-[3px_3px_0_#000] translate-x-[3px] translate-y-[3px]"
                : "bg-[var(--color-card)] shadow-[var(--shadow-neo)] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]"
            )}
            onClick={(e) => {
              e.stopPropagation()
              onSaveCard?.()
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSaved ? (
              <Heart className="w-5 h-5 mx-auto fill-current text-[var(--color-text)]" />
            ) : (
              <Heart className="w-5 h-5 mx-auto text-[var(--color-text)]" />
            )}
          </motion.button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[var(--color-text)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)] font-black">
            <span className="text-sm tracking-wide">ANSWER</span>
          </div>
        </div>

        {/* Answer Content */}
        <div className="flex-1 flex flex-col justify-center space-y-6 mb-8">
          <div className="text-center">
            <motion.h2
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground leading-tight break-words"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.15 }}
            >
              {answer || "No answer available"}
            </motion.h2>
          </div>

          {/* Explanation */}
          {explanation && (
            <div className="bg-[var(--color-muted)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)] p-6 mx-4 rounded-[var(--radius)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-[var(--color-primary)] border-2 border-[var(--color-border)] flex items-center justify-center shadow-[2px_2px_0_#000]">
                  <Sparkles className="w-4 h-4 text-[var(--color-text)]" />
                </div>
                <h4 className="text-sm font-bold text-[var(--color-text)]">Explanation</h4>
              </div>
              <p className="text-base text-[var(--color-text)] leading-relaxed">{explanation}</p>
            </div>
          )}
        </div>

        {/* Rating Section */}
        <div className="space-y-6 pt-6 border-t-4 border-[var(--color-border)]">
          <div className="text-center">
            <span className="inline-block px-6 py-2 bg-[var(--color-accent)] text-[var(--color-text)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)] text-sm font-black">
              How well did you know this?
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ratingButtons.map((button) => {
              const Icon = button.icon
              return (
                <motion.button
                  key={button.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelfRating(button.id as "correct" | "incorrect" | "still_learning")
                  }}
                  className={cn(
                    "w-full h-16 border-4 border-[var(--color-border)] font-black text-[var(--color-text)] shadow-[var(--shadow-neo)] transition-all duration-200 rounded-[var(--radius)]",
                    button.bg,
                    button.hover,
                    "hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]"
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">{button.emoji}</span>
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm">{button.label}</span>
                    <span className="sm:hidden text-sm">{button.shortLabel}</span>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Keyboard shortcuts */}
          <div className="text-center">
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-[var(--color-muted)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)] rounded-[var(--radius)]">
              {[
                { key: "1", label: "Known", emoji: "🎉" },
                { key: "2", label: "Learning", emoji: "📚" },
                { key: "3", label: "Study", emoji: "🤔" },
              ].map((shortcut) => (
                <span key={shortcut.key} className="flex items-center gap-2 text-xs font-black text-[var(--color-text)]">
                  <kbd className="px-2 py-1 bg-[var(--color-card)] border-2 border-[var(--color-border)] text-xs font-black rounded-md shadow-[1px_1px_0_#000]">
                    {shortcut.key}
                  </kbd>
                  <span className="hidden sm:inline">{shortcut.label}</span>
                  <span className="sm:hidden">{shortcut.emoji}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
