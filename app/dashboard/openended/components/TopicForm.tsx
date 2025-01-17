'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, CreditCard, Loader2 } from 'lucide-react'
import { CreditButton } from '@/app/components/CreditButton'


interface TopicFormProps {
  credits: number;
}

export default function TopicForm({ credits }: TopicFormProps) {
  const [topic, setTopic] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, questionCount }),
      })

      if (response.ok) {
        const { slug } = await response.json()
        router.push(`/dashboard/openended/${slug}`)
      } else {
        throw new Error('Failed to generate quiz')
      }
    } catch (error) {
      console.error('Error generating quiz:', error)
      setError('Failed to generate quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isDisabled = loading || credits < 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Generate Open-Ended Quiz</CardTitle>
          <CardDescription>Create a custom quiz on any topic</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
            <div className="space-y-2 flex-grow">
              <label htmlFor="topic" className="text-sm font-medium">Quiz Topic</label>
              <Input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter quiz topic"
                required
                className="h-12 bg-input text-input-foreground"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="questionCount" className="text-sm font-medium">Number of Questions: {questionCount}</label>
              <Slider
                id="questionCount"
                min={1}
                max={10}
                step={1}
                value={[questionCount]}
                onValueChange={(value) => setQuestionCount(value[0])}
                className="py-2"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>About Open-Ended Questions</AlertTitle>
                <AlertDescription>
                  Open-ended questions encourage critical thinking and detailed responses. They are great for assessing understanding and promoting discussion.
                </AlertDescription>
              </Alert>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Alert variant="default" className="bg-primary/10 border-primary/20">
                <CreditCard className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Available Credits</AlertTitle>
                <AlertDescription>
                  You have {credits} credits. Each question costs 1 credit.
                </AlertDescription>
              </Alert>
            </motion.div>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </CardContent>
        <CardFooter>
        <CreditButton
            type="submit"
            label={loading ? "Generating Quiz..." : "Generate Quiz"}
            onClick={handleSubmit}
            requiredCredits={questionCount}
            loadingLabel="Generating Quiz..."
            disabled={isDisabled}
            className="w-full md:w-auto disabled:opacity-50"
          />
        </CardFooter>
      </Card>
    </motion.div>
  )
}

