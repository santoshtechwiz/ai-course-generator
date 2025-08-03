"use client"

import { motion } from "framer-motion"
import { ThumbsUp, ThumbsDown, BookOpen, Sparkles, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export function FlashcardBack({
  answer,
  explanation,
  onFlip,
  onSelfRating,
  onSaveCard,
  isSaved = false,
  animationsEnabled,
}: FlashcardBackProps) {
  const ratingButtons = [
    {
      id: "correct",
      label: "I knew it!",
      shortLabel: "Known",
      icon: ThumbsUp,
      color: "from-emerald-500 to-green-500",
      hoverColor: "from-emerald-600 to-green-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      emoji: "🎉",
    },
    {
      id: "still_learning",
      label: "Still learning",
      shortLabel: "Learning",
      icon: BookOpen,
      color: "from-amber-500 to-orange-500",
      hoverColor: "from-amber-600 to-orange-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      borderColor: "border-amber-200 dark:border-amber-800",
      emoji: "📚",
    },
    {
      id: "incorrect",
      label: "Need to study",
      shortLabel: "Study",
      icon: ThumbsDown,
      color: "from-red-500 to-rose-500",
      hoverColor: "from-red-600 to-rose-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800",
      emoji: "🤔",
    },
  ]

  return (
    <motion.div
      className="w-full h-full"
      initial={{ opacity: 0, rotateY: -90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      exit={{ opacity: 0, rotateY: 90 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div
        className="w-full h-full min-h-[400px] rounded-2xl bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-green-950/20 dark:via-gray-900 dark:to-blue-950/20 border-2 border-green-200/50 dark:border-green-800/30 shadow-xl p-8 flex flex-col relative overflow-hidden group cursor-pointer"
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
        {/* Background decoration */}
        <motion.div
          className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        {/* Save button */}
        {onSaveCard && (
          <motion.div className="absolute top-6 right-6 z-10" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onSaveCard()
              }}
              className={cn(
                "h-12 w-12 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm",
                isSaved
                  ? "bg-rose-100 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400"
                  : "bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20",
              )}
            >
              <motion.div animate={isSaved ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.3 }}>
                {isSaved ? <Heart className="h-5 w-5 fill-current" /> : <Heart className="h-5 w-5" />}
              </motion.div>
            </Button>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wide">ANSWER</span>
        </motion.div>

        {/* Answer Content */}
        <motion.div
          className="flex-1 flex flex-col justify-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-center px-4">
            <motion.div
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 leading-relaxed max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {answer || "No answer available"}
            </motion.div>
          </div>

          {/* Explanation */}
          {explanation && (
            <motion.div
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 mx-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Explanation</h4>
              </div>
              <p className="text-blue-600 dark:text-blue-400 text-sm leading-relaxed">{explanation}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Rating Section */}
        <motion.div
          className="mt-8 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-center">
            <motion.span
              className="text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring" }}
            >
              How well did you know this?
            </motion.span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-2">
            {ratingButtons.map((button, index) => {
              const Icon = button.icon
              return (
                <motion.div
                  key={button.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelfRating(button.id as "correct" | "incorrect" | "still_learning")
                    }}
                    className={cn(
                      "w-full h-16 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 text-white relative overflow-hidden group",
                      `bg-gradient-to-r ${button.color} hover:${button.hoverColor}`,
                    )}
                    size="lg"
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      <span className="text-lg">{button.emoji}</span>
                      <Icon className="w-5 h-5" />
                      <span className="hidden sm:inline text-sm">{button.label}</span>
                      <span className="sm:hidden text-sm">{button.shortLabel}</span>
                    </div>
                  </Button>
                </motion.div>
              )
            })}
          </div>

          {/* Keyboard shortcuts */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <div className="flex justify-center gap-6 bg-white/30 dark:bg-gray-800/30 px-6 py-3 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
              {[
                { key: "1", label: "Known", emoji: "🎉" },
                { key: "2", label: "Learning", emoji: "📚" },
                { key: "3", label: "Study", emoji: "🤔" },
              ].map((shortcut, index) => (
                <motion.span
                  key={shortcut.key}
                  className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3 + index * 0.1 }}
                >
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono border border-gray-300 dark:border-gray-600">
                    {shortcut.key}
                  </kbd>
                  <span className="hidden sm:inline">{shortcut.label}</span>
                  <span className="sm:hidden">{shortcut.emoji}</span>
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
