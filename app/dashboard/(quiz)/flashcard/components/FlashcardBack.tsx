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
    bg: "bg-emerald-500",
    hover: "hover:bg-emerald-600",
    emoji: "🎉",
  },
  {
    id: "still_learning",
    label: "Still learning",
    shortLabel: "Learning",
    icon: BookOpen,
    bg: "bg-[hsl(var(--primary))]",
    hover: "hover:bg-[hsl(var(--primary))]/90",
    emoji: "📚",
  },
  {
    id: "incorrect",
    label: "Need to study",
    shortLabel: "Study",
    icon: ThumbsDown,
    bg: "bg-red-500",
    hover: "hover:bg-red-600",
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
        className="w-full bg-card border-3 border-border rounded-2xl shadow-[4px_4px_0px_0px_hsl(var(--border))] min-h-[500px] p-4 sm:p-6 flex flex-col relative cursor-pointer hover:shadow-[6px_6px_0px_0px_hsl(var(--border))] transition-all duration-200"
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
        {/* Save button */}
        {onSaveCard && (
          <motion.button
            className={cn(
              "absolute top-6 right-6 z-10 w-12 h-12 border-3 border-border transition-all duration-150 rounded-xl",
              isSaved
                ? "bg-red-300 shadow-[3px_3px_0px_0px_hsl(var(--border))] translate-x-[3px] translate-y-[3px]"
                : "bg-background shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:translate-x-[2px] hover:translate-y-[2px]"
            )}
            onClick={(e) => {
              e.stopPropagation()
              onSaveCard()
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSaved ? (
              <Heart className="w-5 h-5 mx-auto fill-current text-red-600" />
            ) : (
              <Heart className="w-5 h-5 mx-auto text-foreground" />
            )}
          </motion.button>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border-3 border-primary/30 rounded-xl shadow-[3px_3px_0px_0px_hsl(var(--primary)/0.3)]">
            <span className="text-sm font-black tracking-wide">ANSWER</span>
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
            <div className="bg-muted/50 border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] p-6 mx-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary border-3 border-border flex items-center justify-center shadow-[2px_2px_0px_0px_hsl(var(--border))]">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Explanation</h4>
              </div>
              <p className="text-base text-foreground leading-relaxed">{explanation}</p>
            </div>
          )}
        </div>

        {/* Rating Section */}
        <div className="space-y-6 pt-6 border-t-3 border-border">
          <div className="text-center">
            <span className="inline-block px-6 py-2 bg-primary/10 text-primary border-3 border-primary/30 rounded-xl shadow-[3px_3px_0px_0px_hsl(var(--primary)/0.3)] text-sm font-black">
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
                    "w-full h-16 border-3 border-border font-black text-white shadow-[4px_4px_0px_0px_hsl(var(--border))] transition-all duration-200 rounded-xl",
                    button.bg,
                    button.hover,
                    "hover:shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:translate-x-[2px] hover:translate-y-[2px]"
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
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-muted/50 border-3 border-border rounded-xl shadow-[2px_2px_0px_0px_hsl(var(--border))]">
              {[
                { key: "1", label: "Known", emoji: "🎉" },
                { key: "2", label: "Learning", emoji: "📚" },
                { key: "3", label: "Study", emoji: "🤔" },
              ].map((shortcut) => (
                <span key={shortcut.key} className="flex items-center gap-2 text-xs font-black text-foreground">
                  <kbd className="px-2 py-1 bg-background border-2 border-border text-xs font-black rounded-md shadow-[1px_1px_0px_0px_hsl(var(--border))]">
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
