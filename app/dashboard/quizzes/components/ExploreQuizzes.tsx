"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { QuizCardListing } from "./QuizCardListing"

import type { QuizListItem } from "@/app/types"
import { useInView } from "react-intersection-observer"
import { CreateQuizCard } from "@/app/components/CreateQuizCard"

interface ExploreQuizzesProps {
  initialQuizzes: QuizListItem[]
}

export function ExploreQuizzes({ initialQuizzes }: ExploreQuizzesProps) {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>(initialQuizzes)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreatePrompt, setShowCreatePrompt] = useState(false)

  const filteredQuizzes = quizzes.filter((quiz) => quiz.topic.toLowerCase().includes(searchTerm.toLowerCase()))

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  useEffect(() => {
    if (inView) {
      setShowCreatePrompt(true)
    }
  }, [inView])

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-4 pb-2 border-b">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center max-w-7xl mx-auto px-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search quizzes..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <CreateQuizCard compact title="Quick Create" animationDuration={2.0} />
        </div>
      </div>

      <AnimatePresence>
        {filteredQuizzes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8 px-4"
          >
            <p className="text-xl text-muted-foreground mb-4">No quizzes found. Why not create your own?</p>
            <CreateQuizCard
              title="Start Fresh"
              description="Be the first to create a quiz on this topic! It's easy and fun."
              animationDuration={2.0}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {filteredQuizzes.map((quiz, index) => (
          <QuizCardListing key={quiz.id} quiz={quiz} index={index} />
        ))}
      </div>

      <div ref={ref} className="h-20" />

      <AnimatePresence>
        {showCreatePrompt && filteredQuizzes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-20"
          >
            <CreateQuizCard floating title="Create New Quiz" animationDuration={2.0} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

