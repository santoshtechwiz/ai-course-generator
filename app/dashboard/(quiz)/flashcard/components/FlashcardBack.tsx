"use client"

import { motion } from "framer-motion"
import { ThumbsUp, ThumbsDown, BookOpen, Sparkles, Heart } from "lucide-react"
import { cn, getColorClasses } from "@/lib/utils"

interface FlashcardBackProps {
  answer: string
  explanation?: string
  onFlip: () => void
  onSelfRating: (rating: "correct" | "incorrect" | "still_learning") => void
  onSaveCard?: () => void
  isSaved?: boolean
  animationsEnabled: boolean
}

export function FlashcardBack({
  answer,
  explanation,
  onFlip,
  onSelfRating,
  onSaveCard,
  isSaved = false,
  animationsEnabled,
}: FlashcardBackProps) {
  const styles = getColorClasses('flashcard') // Cyan accent (#06B6D4)
  
  const ratingButtons = [
    {
      id: "correct",
      label: "I knew it!",
      shortLabel: "Known",
      icon: ThumbsUp,
      bg: "bg-green-500",
      hover: "hover:bg-green-600",
      emoji: "🎉",
    },
    {
      id: "still_learning",
      label: "Still learning",
      shortLabel: "Learning",
      icon: BookOpen,
      bg: "bg-amber-500",
      hover: "hover:bg-amber-600",
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

  return (
    <motion.div
      className="w-full h-full flex items-center justify-center px-4"
      initial={{ opacity: 0, rotateY: -90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      exit={{ opacity: 0, rotateY: 90 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <div
        className={`${styles.cardPrimary} w-full max-w-4xl min-h-[500px] p-8 lg:p-12 flex flex-col relative cursor-pointer`}
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
              "absolute top-6 right-6 z-10 w-12 h-12 border-3 border-black transition-all duration-150",
              isSaved
                ? "bg-red-300 shadow-[3px_3px_0px_rgba(0,0,0,1)] translate-x-[3px] translate-y-[3px]"
                : "bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
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
              <Heart className="w-5 h-5 mx-auto text-black" />
            )}
          </motion.button>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border-3 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]">
            <span className="text-sm font-bold text-black tracking-wide">ANSWER</span>
          </div>
        </div>

        {/* Answer Content */}
        <div className="flex-1 flex flex-col justify-center space-y-6 mb-8">
          <div className="text-center">
            <motion.h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black leading-tight break-words"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.15 }}
            >
              {answer || "No answer available"}
            </motion.h2>
          </div>

          {/* Explanation */}
          {explanation && (
            <div className="bg-blue-100 border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] p-6 mx-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-500 border-2 border-black flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-sm font-bold text-black">Explanation</h4>
              </div>
              <p className="text-base text-black leading-relaxed">{explanation}</p>
            </div>
          )}
        </div>

        {/* Rating Section */}
        <div className="space-y-6 pt-6 border-t-3 border-black">
          <div className="text-center">
            <span className="inline-block px-6 py-2 bg-cyan-100 border-3 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] text-sm font-bold text-black">
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
                    "w-full h-16 border-3 border-black font-bold text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all duration-150",
                    button.bg,
                    button.hover,
                    "hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
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
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-white border-2 border-black">
              {[
                { key: "1", label: "Known", emoji: "🎉" },
                { key: "2", label: "Learning", emoji: "📚" },
                { key: "3", label: "Study", emoji: "🤔" },
              ].map((shortcut) => (
                <span key={shortcut.key} className="flex items-center gap-2 text-xs font-bold text-black">
                  <kbd className="px-2 py-1 bg-gray-100 border-2 border-black text-xs font-bold">
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
