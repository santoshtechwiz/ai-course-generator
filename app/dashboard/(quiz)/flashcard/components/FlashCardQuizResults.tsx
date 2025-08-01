'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Confetti } from '@/components/ui/confetti'
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

interface FlashCardQuestion {
  id: number
  question: string
  answer: string
}

interface FlashCardAnswer {
  questionId: number
  answer: string
}

interface FlashCardResult {
  correctAnswers: number
  incorrectAnswers: number
  stillLearningAnswers: number
  totalQuestions: number
  percentage: number
  totalTime: number
  questions: FlashCardQuestion[]
  answers: FlashCardAnswer[]
  reviewCards?: number[]
  stillLearningCards?: number[]
}

interface FlashCardResultsProps {
  slug: string
  title?: string
  result: FlashCardResult
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
  // Add local state to track cards for review
  const [reviewCardsState, setReviewCardsState] = useState<number[]>([])
  const [stillLearningCardsState, setStillLearningCardsState] = useState<number[]>([])
  // Add animation states
  const [reviewCardsCount, setReviewCardsCount] = useState(0)
  const [stillLearningCardsCount, setStillLearningCardsCount] = useState(0)
  const [hasUpdated, setHasUpdated] = useState(false)
  // Add confetti celebration when all cards are known
  const [showConfetti, setShowConfetti] = useState(false)

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

  // Update local state when result prop changes
  useEffect(() => {
    if (!result) return;
    
    // Check if the counts have changed
    const newReviewCards = result.reviewCards || [];
    const newStillLearningCards = result.stillLearningCards || [];
    
    const reviewCountChanged = reviewCardsState.length !== newReviewCards.length;
    const stillLearningCountChanged = stillLearningCardsState.length !== newStillLearningCards.length;
    
    if (reviewCountChanged || stillLearningCountChanged) {
      // Set flag that values have updated to trigger animations
      setHasUpdated(true);
      
      // Reset after animation completes
      setTimeout(() => setHasUpdated(false), 1000);
    }
    
    // Update the state values
    setReviewCardsState(newReviewCards);
    setStillLearningCardsState(newStillLearningCards);
    setReviewCardsCount(newReviewCards.length);
    setStillLearningCardsCount(newStillLearningCards.length);
  }, [result]);
    // Add confetti effect when all cards are known
  useEffect(() => {
    // Show confetti if there are no cards left to review and there were some before
    if ((reviewCardsState.length === 0 && stillLearningCardsState.length === 0) && 
        (result && 
         ((result.reviewCards && result.reviewCards.length > 0) || 
          (result.stillLearningCards && result.stillLearningCards.length > 0)))) {
      setShowConfetti(true)
      
      // Hide confetti after a few seconds
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [reviewCardsState.length, stillLearningCardsState.length, result])
  
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

  // Add this useEffect to update when the results change
  useEffect(() => {
    // Force a re-evaluation of the tabs when answers change
    if (answers && answers.length > 0) {
      setTab(prevTab => prevTab); // This triggers a re-render without changing the tab
    }
  }, [answers]);
  
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
      {/* Confetti celebration */}
      {showConfetti && <Confetti isActive={showConfetti} />}
      
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
            </CardTitle>          </CardHeader>
          <CardContent className="text-center">
            <motion.div 
              key={`percentage-${percentage}`}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-4xl font-bold text-primary"
            >
              {Math.round(percentage)}%
            </motion.div>
            <p className="text-sm text-muted-foreground mt-1">
              <motion.span 
                key={`correct-count-${correctAnswers}`}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {correctAnswers}
              </motion.span> / {totalQuestions} correct
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
              <motion.div 
                key={`correct-${correctAnswers}`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {correctAnswers}
              </motion.div>
              <div className="text-xs">Known</div>
            </div>
            <div>
              <HelpCircle className="mx-auto text-yellow-500" />
              <motion.div 
                key={`learning-${stillLearningAnswers}`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {stillLearningAnswers}
              </motion.div>
              <div className="text-xs">Still Learning</div>
            </div>
            <div>
              <XCircle className="mx-auto text-red-600" />
              <motion.div 
                key={`incorrect-${incorrectAnswers}`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {incorrectAnswers}
              </motion.div>
              <div className="text-xs">Didn't Know</div>
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
              grouped[t.key as keyof typeof grouped].map((q: FlashCardQuestion) => (
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
      <div className="space-y-6 pt-10">
        <h3 className="text-center text-lg font-medium">What would you like to do next?</h3>
        
        {/* Review Options */}
        {(reviewCardsState.length > 0 || stillLearningCardsState.length > 0) && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {onReviewStillLearning && stillLearningCardsState.length > 0 && (
              <motion.div
                animate={hasUpdated ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-yellow-200 hover:border-yellow-400 transition-colors">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                    <HelpCircle className="h-10 w-10 text-yellow-500" />
                    <div>
                      <motion.h3 
                        className="font-medium"
                        key={`still-learning-${stillLearningCardsCount}`}
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        Review {stillLearningCardsCount} Cards You're Learning
                      </motion.h3>
                      <p className="text-sm text-muted-foreground">Focus on cards you marked as "still learning"</p>
                    </div>
                    <Button 
                      variant="default" 
                      className="bg-yellow-500 hover:bg-yellow-600 mt-2"
                      onClick={() => onReviewStillLearning(stillLearningCardsState)}
                    >
                      Practice These Cards
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {onReview && reviewCardsState.length > 0 && (
              <motion.div
                animate={hasUpdated ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-red-200 hover:border-red-400 transition-colors">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                    <XCircle className="h-10 w-10 text-red-500" />
                    <div>
                      <motion.h3 
                        className="font-medium"
                        key={`review-${reviewCardsCount}`}
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        Review {reviewCardsCount} Difficult Cards
                      </motion.h3>
                      <p className="text-sm text-muted-foreground">Focus on cards you marked as "didn't know"</p>
                    </div>
                    <Button 
                      variant="default" 
                      className="bg-red-500 hover:bg-red-600 mt-2"
                      onClick={() => onReview(reviewCardsState)}
                    >
                      Study These Cards
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Other Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={onRestart}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Restart Quiz
          </Button>
          <Button variant="ghost" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            {copied ? 'Link Copied!' : 'Share Results'}
          </Button>
        </div>
      </div>
    </div>
  )
}
