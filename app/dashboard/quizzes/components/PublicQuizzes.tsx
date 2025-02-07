"use client"

import { motion, AnimatePresence } from "framer-motion"
import { PublicQuizCardListing } from "./PublicQuizCardListing"
import type { QuizListItem } from "@/app/types/types"
import { CreateCard } from "@/app/components/CreateCard"

interface PublicQuizzesProps {
  quizzes: QuizListItem[]
}

export function PublicQuizzes({ quizzes }: PublicQuizzesProps) {
  return (
    <div className="space-y-8 container mx-auto px-4">
      {/* Empty State */}
      <AnimatePresence>
        {quizzes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8"
          >
            <p className="text-xl text-muted-foreground mb-4">
              No quizzes found. Why not create your own?
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
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}
      >
        {quizzes.map((quiz, index) => (
          <PublicQuizCardListing key={quiz.id} quiz={quiz} index={index} />
        ))}
      </div>
    </div>
  )
}
