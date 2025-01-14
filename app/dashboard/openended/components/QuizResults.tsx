'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCcw, CheckCircle } from 'lucide-react'
import { compareTwoStrings } from 'string-similarity'

interface QuizResultsProps {
  answers: string[]
  questions: {
    id: number
    question: string
    answer: string
    openEndedQuestion: {
      difficulty: string
      tags: string | string[]
    }
  }[]
  onRestart: () => void
}

export default function QuizResults({ answers, questions, onRestart }: QuizResultsProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
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

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-500'
    if (similarity >= 0.6) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-4 space-y-6"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="inline-block mb-4"
        >
          <CheckCircle className="w-16 h-16 text-green-500" />
        </motion.div>
        <CardTitle className="text-3xl font-bold mb-2">Quiz Completed!</CardTitle>
        <p className="text-muted-foreground">
          You've answered all {questions.length} questions. Here are your responses:
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {questions.map((question, index) => {
          const tags = Array.isArray(question.openEndedQuestion.tags)
            ? question.openEndedQuestion.tags
            : question.openEndedQuestion.tags.split('|')

          const similarity = compareTwoStrings(answers[index] || '', question.answer)
          const similarityPercentage = Math.round(similarity * 100)

          return (
            <motion.div key={question.id} variants={item}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                      {index + 1}
                    </span>
                    <Badge 
                      variant="secondary"
                      className={`text-white ${getDifficultyColor(question.openEndedQuestion.difficulty)}`}
                    >
                      {question.openEndedQuestion.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{question.question}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Your Answer:</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      {answers[index] || 'No answer provided'}
                    </div>
                  </div>
                  {question.answer && (
                    <div>
                      <h3 className="font-medium mb-2">Correct Answer:</h3>
                      <div className="bg-muted/50 p-4 rounded-lg text-muted-foreground">
                        {question.answer}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Similarity Score:</span>
                    <span className={`font-bold ${getSimilarityColor(similarity)}`}>
                      {similarityPercentage}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center pt-6"
      >
        <Button 
          onClick={onRestart} 
          size="lg"
          className="gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Try Another Quiz
        </Button>
      </motion.div>
    </motion.div>
  )
}

