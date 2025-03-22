"use client"

import { motion } from "framer-motion"
import type { QuizListItem } from "@/app/types/types"
import type React from "react"
import { QuizCard } from "@/components/shared/QuizCard"
import { useInView } from "react-intersection-observer"

interface PublicQuizCardListingProps {
  quiz: QuizListItem
  index: number
}

export const PublicQuizCardListing: React.FC<PublicQuizCardListingProps> = ({ quiz, index }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: "0px 0px -100px 0px",
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{
        duration: 0.5,
        delay: (index % 3) * 0.1, // Stagger based on column position
        ease: [0.25, 0.1, 0.25, 1.0],
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <QuizCard
        title={quiz.title}
        description={quiz.title}
        questionCount={quiz.questionCount}
        isPublic={quiz.isPublic}
        slug={quiz.slug}
        quizType={quiz.quizType as "mcq" | "openended" | "fill-blanks" | "code"}
        estimatedTime={`${Math.ceil(quiz.questionCount * 0.5)} min`}
        completionRate={quiz.bestScore || 0}
      />
    </motion.div>
  )
}

