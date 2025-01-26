"use client"

import { motion } from "framer-motion"

import type { UserQuiz } from "@prisma/client"
import { QuizCard } from "@/app/components/shared/QuizCard"
import { QuizListItem } from "@/app/types"

interface QuizCardListingProps {
  quiz: QuizListItem
  index: number
}

export const QuizCardListing: React.FC<QuizCardListingProps> = ({ quiz, index }) => {
  return (
    <motion.div
      key={quiz.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="h-full"
    >
      <QuizCard
        title={quiz.topic}
        description={quiz.topic}
        questionCount={quiz.questions.length}
        isPublic={quiz.isPublic}
        slug={quiz.slug}
        tags={quiz.tags}
        quizType={quiz.quizType as "mcq" | "openended" | "fill-blanks"}
        estimatedTime={`${Math.ceil(quiz.questions.length * 0.5)} min`}
      />
    </motion.div>
  )
}

