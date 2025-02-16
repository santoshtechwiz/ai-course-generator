"use client"

import { motion } from "framer-motion"
import { QuizCard } from "@/app/components/shared/QuizCard"
import type { QuizListItem } from "@/app/types/types"
import React from 'react'; // Added import for React

interface PublicQuizCardListingProps {
  quiz: QuizListItem
  index: number
}

export const PublicQuizCardListing: React.FC<PublicQuizCardListingProps> = ({ quiz, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <QuizCard
        title={quiz.topic}
        description={quiz.topic}
        questionCount={quiz.questionCount}
        isPublic={quiz.isPublic}
        slug={quiz.slug}
        quizType={quiz.quizType as "mcq" | "openended" | "fill-blanks" | "code"}
        estimatedTime={`${Math.ceil(quiz.questionCount * 0.5)} min`}
        completionRate={quiz.bestScore||0}
      />
    </motion.div>
  )
}
