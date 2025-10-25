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
        className="w-full bg-card border-4 border-border rounded-lg shadow-neo min-h-[400px] sm:min-h-[500px] p-4 sm:p-6 flex flex-col relative cursor-pointer hover:shadow-neo-lg transition-all duration-200"
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
              "absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-10 h-10 sm:w-12 sm:h-12 border-3 sm:border-4 border-border transition-all duration-150 rounded-lg",
              isSaved
                ? "bg-danger shadow-neo-sm translate-x-[2px] translate-y-[2px]"
                : "bg-card shadow-neo hover:shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px]"
            )}
            onClick={(e) => {
              e.stopPropagation()
              onSaveCard?.()
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSaved ? (
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 mx-auto fill-current text-white" />
            ) : (
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-foreground" />
            )}
          </motion.button>

        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-accent text-white border-3 sm:border-4 border-border shadow-neo-sm font-black rounded-md">
            <span className="text-xs sm:text-sm tracking-wide">ANSWER</span>
          </div>
        </div>

        {/* Answer Content */}
        <div className="flex-1 flex flex-col justify-center space-y-4 sm:space-y-6 mb-6 sm:mb-8">
          <div className="text-center px-2 sm:px-4">
            <motion.h2
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-foreground leading-tight break-words"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.15 }}
            >
              {answer || "No answer available"}
            </motion.h2>
          </div>

          {/* Explanation */}
          {explanation && (
            <div className="bg-muted border-3 sm:border-4 border-border shadow-neo p-4 sm:p-6 mx-2 sm:mx-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-accent border-2 border-border flex items-center justify-center shadow-neo-sm rounded-sm">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground">Explanation</h4>
              </div>
              <p className="text-sm sm:text-base text-foreground leading-relaxed">{explanation}</p>
            </div>
          )}
        </div>

        {/* Rating Section */}
        <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t-4 border-border">
          <div className="text-center">
            <span className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 bg-accent text-white border-3 sm:border-4 border-border shadow-neo-sm text-xs sm:text-sm font-black rounded-md">
              How well did you know this?
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 px-2 sm:px-0">
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
                    "w-full h-14 sm:h-16 border-3 sm:border-4 border-border font-black text-white shadow-neo transition-all duration-200 rounded-lg",
                    button.bg,
                    button.hover,
                    "hover:shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl">{button.emoji}</span>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline text-xs sm:text-sm">{button.label}</span>
                    <span className="sm:hidden text-xs">{button.shortLabel}</span>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Keyboard shortcuts */}
          <div className="text-center px-2">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-4 sm:px-6 py-2 sm:py-3 bg-muted border-3 sm:border-4 border-border shadow-neo-sm rounded-lg">
              {[
                { key: "1", label: "Known", emoji: "🎉" },
                { key: "2", label: "Learning", emoji: "📚" },
                { key: "3", label: "Study", emoji: "🤔" },
              ].map((shortcut) => (
                <span key={shortcut.key} className="flex items-center gap-1.5 sm:gap-2 text-xs font-black text-foreground">
                  <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-card border-2 border-border text-xs font-black rounded-sm shadow-neo-sm">
                    {shortcut.key}
                  </kbd>
                  <span className="hidden sm:inline text-xs">{shortcut.label}</span>
                  <span className="sm:hidden text-sm">{shortcut.emoji}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
