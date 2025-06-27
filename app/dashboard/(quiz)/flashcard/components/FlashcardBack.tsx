"use client"

import { motion } from "framer-motion"
import { ThumbsUp, ThumbsDown, BookOpen, Bookmark, BookmarkCheck } from "lucide-react"
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
  const backCardVariants = {
    initial: { opacity: 0, rotateY: -90 },
    animate: {
      opacity: 1,
      rotateY: 0,
      transition: { duration: animationsEnabled ? 0.4 : 0.1, ease: [0.23, 1, 0.32, 1] },
    },
    exit: {
      opacity: 0,
      rotateY: -90,
      transition: { duration: animationsEnabled ? 0.3 : 0.1, ease: [0.23, 1, 0.32, 1] },
    },
  }

  return (
    <motion.div
      onClick={onFlip}
      className="w-full h-full rounded-2xl border-2 border-primary/20 shadow-xl cursor-pointer bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6 sm:p-8 flex flex-col relative overflow-hidden group"
      variants={backCardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      role="button"
      aria-label="Flip card to see question"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onFlip()
        }
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 20px 40px -12px rgba(var(--primary), 0.25)",
        borderColor: "rgba(var(--primary), 0.4)",
      }}
      style={{
        willChange: "transform, opacity",
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
      }}
    >
      {/* Decorative elements */}
      <motion.div
        className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/5 rounded-full -ml-10 -mt-10"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, -15, 0],
        }}
        transition={{
          duration: 9,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      />

      {/* Answer section */}
      <div className="flex-1 flex flex-col justify-center space-y-4">
        <div className="text-lg sm:text-xl font-semibold text-center text-foreground max-w-md mx-auto leading-relaxed overflow-auto max-h-[180px] sm:max-h-[200px] scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-primary/20 scrollbar-track-transparent px-2 sm:px-4">
          {answer || "No answer available"}
        </div>

        {/* Explanation if available */}
        {explanation && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 max-w-md mx-auto">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Explanation:</h4>
            <p className="text-blue-600 dark:text-blue-400 text-sm leading-relaxed">{explanation}</p>
          </div>
        )}
      </div>

      {/* Rating section */}
      <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
        <div className="text-center">
          <span className="text-sm font-semibold text-muted-foreground bg-muted/20 px-3 py-1 rounded-full border border-muted/30">
            How well did you know this?
          </span>
        </div>

        <div className="flex gap-3 sm:gap-4 justify-center flex-wrap px-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onSelfRating("correct")
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-green-400/30 hover:border-green-400/50 text-sm sm:text-base min-w-[100px] sm:min-w-[120px]"
              size="sm"
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">I knew it!</span>
              <span className="sm:hidden">Known</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onSelfRating("still_learning")
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-amber-400/30 hover:border-amber-400/50 text-sm sm:text-base min-w-[100px] sm:min-w-[120px]"
              size="sm"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Still learning</span>
              <span className="sm:hidden">Learning</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onSelfRating("incorrect")
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-red-400/30 hover:border-red-400/50 text-sm sm:text-base min-w-[100px] sm:min-w-[120px]"
              size="sm"
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Need to study</span>
              <span className="sm:hidden">Study</span>
            </Button>
          </motion.div>
        </div>

        {/* Keyboard shortcuts */}
        <div className="text-center text-xs text-muted-foreground mt-4">
          <div className="flex justify-center gap-4 sm:gap-6 bg-muted/10 px-4 py-3 rounded-xl border border-muted/20">
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-muted/30 rounded text-xs font-mono">1</kbd>
              <span className="hidden sm:inline">Known</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-muted/30 rounded text-xs font-mono">2</kbd>
              <span className="hidden sm:inline">Learning</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-muted/30 rounded text-xs font-mono">3</kbd>
              <span className="hidden sm:inline">Study</span>
            </span>
          </div>
        </div>
      </div>

      {/* Save button */}
      {onSaveCard && (
        <motion.div
          className="absolute top-3 right-3 sm:top-4 sm:right-4"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onSaveCard()
            }}
            className={cn(
              "h-10 w-10 sm:h-12 sm:w-12 rounded-xl border-2 transition-all duration-300",
              isSaved
                ? "bg-primary/10 border-primary/40 text-primary hover:bg-primary/20"
                : "border-muted/40 hover:border-primary/40 hover:bg-primary/5",
            )}
          >
            {isSaved ? (
              <BookmarkCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Bookmark className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
