"use client"

import { motion } from "framer-motion"
import { QuizCard } from "@/app/components/shared/QuizCard"

import type React from "react" // Import React
import { QuizListItem } from "@/app/types"

interface PublicQuizCardListingProps {
  quiz: QuizListItem
  index: number
}

export const PublicQuizCardListing: React.FC<PublicQuizCardListingProps> = ({ quiz, index }) => {
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
        questionCount={quiz.questionCount}
        isPublic={quiz.isPublic}
        slug={quiz.slug}
        quizType={quiz.quizType as "mcq" | "openended" | "fill-blanks"}
        estimatedTime={`${Math.ceil(quiz.questionCount * 0.5)} min`}
       
      />
    </motion.div>
  )
}




