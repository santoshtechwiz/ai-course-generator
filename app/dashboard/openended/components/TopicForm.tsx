'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, CreditCard, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { CreditButton } from '@/app/components/shared/CreditButton'
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"

interface TopicFormProps {
  credits: number;
}

export default function TopicForm({ credits }: TopicFormProps) {
  const [topic, setTopic] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openInfo, setOpenInfo] = useState(false)
  const [open, setOpen] = useState(false)
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

  const isDisabled = loading || credits < 1 || !topic.trim();

  const getCreditTier = (credits: number) => {
    if (credits >= 10) return { name: 'Gold', color: 'bg-yellow-500' }
    if (credits >= 5) return { name: 'Silver', color: 'bg-gray-400' }
    return { name: 'Bronze', color: 'bg-amber-600' }
  }

  const tier = getCreditTier(credits)

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
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic..."
                className="w-full h-12 bg-input text-input-foreground"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="questionCount" className="text-sm font-medium flex justify-between items-center">
                <span>Number of Questions</span>
                <span className="text-2xl font-bold text-primary">{questionCount}</span>
              </label>
              <div className="flex items-center space-x-4">
                <Slider
                  id="questionCount"
                  min={1}
                  max={10}
                  step={1}
                  value={[questionCount]}
                  onValueChange={(value) => setQuestionCount(value[0])}
                  className="flex-grow"
                />
                <Input
                  type="number"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  min={1}
                  max={10}
                  className="w-20"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Available Credits</span>
                    <Badge className={`${tier.color} text-white`}>{tier.name} Tier</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={(credits / 10) * 100} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      You have <span className="font-bold text-primary">{credits}</span> credits remaining
                    </p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground mt-2">
                          How to earn more credits?
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Complete quizzes, invite friends, or upgrade your account to earn more credits!</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-muted">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setOpenInfo(!openInfo)}>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>About Open-Ended Questions</span>
                    {openInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
                <AnimatePresence>
                  {openInfo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent>
                        <AlertDescription>
                          Open-ended questions encourage critical thinking and detailed responses. They are great for assessing understanding and promoting discussion.
                        </AlertDescription>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
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
            onClick={(e) => { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>); }}
            requiredCredits={credits}
            loadingLabel="Generating Quiz..."
            disabled={isDisabled}
            className="w-full bg-gradient-to-r from-primary to-primary-foreground hover:from-primary-foreground hover:to-primary text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </CardFooter>
      </Card>
    </motion.div>
  )
}

