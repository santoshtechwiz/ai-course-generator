'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'

interface RandomQuestion {
  topic: string
  slug: string
}

interface RandomQuestionsProps {
  questions: RandomQuestion[]
}

export default function RandomQuestions({ questions }: RandomQuestionsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <Card className="h-full bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-lg text-primary">Random Open-Ended Quizzes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 overflow-auto max-h-[calc(100vh-200px)] custom-scrollbar">
        <AnimatePresence>
          {questions.map((question, index) => (
            <motion.div
              key={question.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link href={`/dashboard/openended/${question.slug}`}>
                <motion.div
                  className="p-4 bg-muted rounded-lg transition-colors cursor-pointer relative overflow-hidden"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <p className="text-sm mb-2 font-medium">{question.topic}</p>
                  <Badge variant="secondary" className="text-xs">
                    Start Quiz
                  </Badge>
                  <motion.div
                    className="absolute inset-0 bg-primary/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

