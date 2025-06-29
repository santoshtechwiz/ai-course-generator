'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Flame,
  RefreshCw,
  Clock,
  CheckCircle,
  HelpCircle,
  XCircle,
  Share2,
} from 'lucide-react'

interface FlashCardResultsProps {
  slug: string
  title?: string
  result: any
  onRestart?: () => void
  onReview?: (ids: number[]) => void
  onReviewStillLearning?: (ids: number[]) => void
}

export default function FlashCardResults({
  slug,
  title = 'Flashcard Quiz',
  result,
  onRestart,
  onReview,
  onReviewStillLearning,
}: FlashCardResultsProps) {
  const router = useRouter()
  const [tab, setTab] = useState('correct')
  const [copied, setCopied] = useState(false)

  const {
    correctAnswers = 0,
    incorrectAnswers = 0,
    stillLearningAnswers = 0,
    totalQuestions = 0,
    percentage = 0,
    totalTime = 0,
    questions = [],
    answers = [],
  } = result || {}

  const formatTime = (seconds: number) =>
    seconds >= 60
      ? `${Math.floor(seconds / 60)}m ${seconds % 60}s`
      : `${seconds}s`

  const avgTime = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0

  const answerMap = useMemo(() => {
    const map: Record<number | string, string> = {}
    for (const a of answers) map[a.questionId] = a.answer
    return map
  }, [answers])

  const grouped = useMemo(() => ({
    correct: questions.filter(q => answerMap[q.id] === 'correct'),
    still_learning: questions.filter(q => answerMap[q.id] === 'still_learning'),
    incorrect: questions.filter(q => answerMap[q.id] === 'incorrect'),
  }), [questions, answerMap])

  const performance = useMemo(() => {
    if (percentage >= 90) return { emoji: '🏆', title: 'Mastery' }
    if (percentage >= 75) return { emoji: '🔥', title: 'On Fire!' }
    if (percentage >= 50) return { emoji: '💪', title: 'Getting There' }
    return { emoji: '🚀', title: 'Keep Practicing' }
  }, [percentage])

  const tabs = [
    { key: 'correct', label: 'Known', icon: <CheckCircle className="w-4 h-4 text-green-600" /> },
    { key: 'still_learning', label: 'Still Learning', icon: <HelpCircle className="w-4 h-4 text-yellow-500" /> },
    { key: 'incorrect', label: 'Did Not Know', icon: <XCircle className="w-4 h-4 text-red-600" /> },
  ]

  const handleShare = async () => {
    const shareData = {
      title: `${title} Quiz Results`,
      text: `I scored ${Math.round(percentage)}% on the "${title}" quiz!`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    } catch {
      console.warn('Share failed')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      {/* 🎉 Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm">Quiz Complete!</p>
        <div className="text-4xl pt-2">
          {performance.emoji} <span className="font-bold">{performance.title}</span>
        </div>
      </motion.div>

      {/* 📊 Summary */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2 items-center text-primary">
              <Flame className="w-5 h-5" />
              Score
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-primary">
              {Math.round(percentage)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {correctAnswers} / {totalQuestions} correct
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <Clock className="w-5 h-5" />
              Time Spent
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <div><b>{formatTime(totalTime)}</b> total</div>
            <div><b>{avgTime}s</b> avg/card</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 text-center text-sm">
            <div>
              <CheckCircle className="mx-auto text-green-600" />
              <div>{correctAnswers}</div>
              <div className="text-xs">Known</div>
            </div>
            <div>
              <HelpCircle className="mx-auto text-yellow-500" />
              <div>{stillLearningAnswers}</div>
              <div className="text-xs">Still Learning</div>
            </div>
            <div>
              <XCircle className="mx-auto text-red-600" />
              <div>{incorrectAnswers}</div>
              <div className="text-xs">Didn’t Know</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 🧠 Review Tabs */}
      <Tabs defaultValue="correct" value={tab} onValueChange={setTab}>
        <TabsList className="w-full grid grid-cols-3 max-w-lg mx-auto">
          {tabs.map(t => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.icon} <span className="ml-1">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(t => (
          <TabsContent key={t.key} value={t.key} className="mt-6 space-y-4">
            {grouped[t.key as keyof typeof grouped].length === 0 ? (
              <p className="text-center text-muted-foreground">No questions here yet.</p>
            ) : (
              grouped[t.key as keyof typeof grouped].map(q => (
                <Card key={q.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{q.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{q.answer}</CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* 🧩 CTA Actions */}
      <div className="flex flex-wrap justify-center gap-4 pt-10">
        <Button onClick={onRestart}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Restart Quiz
        </Button>
        {onReview && result?.reviewCards?.length > 0 && (
          <Button variant="outline" onClick={() => onReview(result.reviewCards)}>
            Review Incorrect
          </Button>
        )}
        {onReviewStillLearning && result?.stillLearningCards?.length > 0 && (
          <Button variant="outline" onClick={() => onReviewStillLearning(result.stillLearningCards)}>
            Review Still Learning
          </Button>
        )}
        <Button variant="ghost" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" />
          {copied ? 'Link Copied!' : 'Share'}
        </Button>
      </div>
    </div>
  )
}
