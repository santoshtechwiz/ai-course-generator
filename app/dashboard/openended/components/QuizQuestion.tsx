'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LightbulbIcon, SendIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from "@/lib/utils"

interface QuizQuestionProps {
  question: {
    id: number
    question: string
    openEndedQuestion: {
      hints: string | string[]
      difficulty: string
      tags: string | string[]
    }
  }
  onAnswer: (answer: string) => void
  questionNumber: number
  totalQuestions: number
}

export default function QuizQuestion({ 
  question, 
  onAnswer, 
  questionNumber, 
  totalQuestions 
}: QuizQuestionProps) {
  const [answer, setAnswer] = useState('')
  const [showHints, setShowHints] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hints = Array.isArray(question.openEndedQuestion.hints)
    ? question.openEndedQuestion.hints
    : question.openEndedQuestion.hints.split('|')

  const tags = Array.isArray(question.openEndedQuestion.tags)
    ? question.openEndedQuestion.tags
    : question.openEndedQuestion.tags.split('|')

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 500)) // Animation delay
    onAnswer(answer)
    setAnswer('')
    setShowHints(false)
    setIsSubmitting(false)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'hard':
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                className="flex items-center gap-1 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="font-medium text-foreground">Question {questionNumber}</span>
                <ChevronRightIcon className="h-4 w-4" />
                <span>{totalQuestions}</span>
              </motion.div>
            </div>
            <Badge 
              variant="secondary"
              className={cn(
                "text-white",
                getDifficultyColor(question.openEndedQuestion.difficulty)
              )}
            >
              {question.openEndedQuestion.difficulty}
            </Badge>
          </div>
          <motion.h2 
            className="text-2xl font-bold leading-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {question.question}
          </motion.h2>
          <motion.div 
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {tags.map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[150px] resize-none transition-all duration-200 focus:min-h-[200px]"
          />
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHints(!showHints)}
              className="w-full sm:w-auto"
            >
              <LightbulbIcon className="w-4 h-4 mr-2" />
              {showHints ? 'Hide Hints' : 'Show Hints'}
            </Button>
            <AnimatePresence>
              {showHints && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <ul className="space-y-2 mt-2">
                    {hints.map((hint, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="font-medium text-foreground">Hint {index + 1}:</span>
                        {hint}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={!answer.trim() || isSubmitting}
            className="w-full sm:w-auto ml-auto"
          >
            <SendIcon className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

