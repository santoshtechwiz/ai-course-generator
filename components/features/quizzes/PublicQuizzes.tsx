"use client"

import { motion, AnimatePresence } from "framer-motion"
import { PublicQuizCardListing } from "./PublicQuizCardListing"
import type { QuizListItem } from "@/app/types/types"
import { CreateCard } from "@/components/CreateCard"
import { FileQuestion } from "lucide-react"

interface PublicQuizzesProps {
  quizzes: QuizListItem[]
}

export function PublicQuizzes({ quizzes }: PublicQuizzesProps) {
  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  return (
    <div className="space-y-8">
      {/* Empty State */}
      <AnimatePresence>
        {quizzes.length === 0 && (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-center py-12 px-6 bg-gradient-to-b from-muted/50 to-background rounded-xl border border-muted"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4"
            >
              <FileQuestion className="h-8 w-8 text-primary" />
            </motion.div>
            <h3 className="text-xl font-bold mb-2">No quizzes found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Why not create your own quiz? It's easy and fun to share your knowledge with others.
            </p>
            <CreateCard
              title="Start Fresh"
              description="Be the first to create a quiz on this topic! It's easy and fun."
              animationDuration={2.0}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Grid Layout */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {quizzes.map((quiz, index) => (
          <PublicQuizCardListing key={quiz.id} quiz={quiz} index={index} />
        ))}
      </motion.div>
    </div>
  )
}
