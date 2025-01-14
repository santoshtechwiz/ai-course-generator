'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'

interface TopicFormProps {
  credits: number;
}

export default function TopicForm({ credits }: TopicFormProps) {
  const [topic, setTopic] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
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
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-2xl">Generate Open-Ended Quiz</CardTitle>
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
                className="h-12"
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
              />
            </div>
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>About Open-Ended Questions</AlertTitle>
              <AlertDescription>
                Open-ended questions encourage critical thinking and detailed responses. They are great for assessing understanding and promoting discussion.
              </AlertDescription>
            </Alert>
            <Alert variant="default" className="bg-blue-50">
              <CreditCard className="h-4 w-4" />
              <AlertTitle>Available Credits</AlertTitle>
              <AlertDescription>
                You have {credits} credits. Each question costs 1 credit.
              </AlertDescription>
            </Alert>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isDisabled} 
            onClick={handleSubmit}
          >
            {loading ? 'Generating Quiz...' : isDisabled ? 'Not Enough Credits' : 'Generate Quiz'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

