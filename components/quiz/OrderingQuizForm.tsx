"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Loader2, Zap, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface OrderingQuizFormProps {
  userPlan: "FREE" | "PREMIUM" | "PRO"
  quizzesGeneratedToday?: number
  onSubmit: (data: OrderingQuizFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
  className?: string
}

export interface OrderingQuizFormData {
  topic: string
  numberOfSteps: number
  difficulty: "easy" | "medium" | "hard"
}

const STEP_RANGE = { min: 4, max: 7 }

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy", icon: "🟢", description: "4-5 steps" },
  { value: "medium", label: "Medium", icon: "🟡", description: "5-6 steps" },
  { value: "hard", label: "Hard", icon: "🔴", description: "6-7 steps" },
] as const

const SUBSCRIPTION_LIMITS = {
  FREE: 2,
  PREMIUM: 10,
  PRO: 50,
}

const EXAMPLE_TOPICS = [
  "HTTP Request/Response Cycle",
  "Git Workflow",
  "Docker Container Deployment",
  "API Authentication with JWT",
  "Database Query Optimization",
  "CI/CD Pipeline Stages",
  "React Component Lifecycle",
  "Machine Learning Model Training",
]

/**
 * OrderingQuizForm Component
 * Collects user input for ordering quiz generation
 * Validates subscription limits and topic input
 */
export const OrderingQuizForm: React.FC<OrderingQuizFormProps> = ({
  userPlan,
  quizzesGeneratedToday = 0,
  onSubmit,
  isLoading = false,
  error = null,
  className = "",
}) => {
  const [formData, setFormData] = useState<OrderingQuizFormData>({
    topic: "",
    numberOfSteps: 5,
    difficulty: "medium",
  })

  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([])
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false)

  const dailyLimit = SUBSCRIPTION_LIMITS[userPlan]
  const quizzesRemaining = dailyLimit - quizzesGeneratedToday
  const canGenerate = quizzesRemaining > 0

  // Validate topic input and show suggestions
  useEffect(() => {
    if (formData.topic.length === 0) {
      setSuggestedTopics([])
      setShowTopicSuggestions(false)
      return
    }

    const filtered = EXAMPLE_TOPICS.filter((topic) =>
      topic.toLowerCase().includes(formData.topic.toLowerCase())
    )
    setSuggestedTopics(filtered)
    setShowTopicSuggestions(filtered.length > 0)
  }, [formData.topic])

  // Update step count based on difficulty
  useEffect(() => {
    const stepsByDifficulty = {
      easy: 4,
      medium: 5,
      hard: 6,
    }
    setFormData((prev) => ({
      ...prev,
      numberOfSteps: stepsByDifficulty[prev.difficulty],
    }))
  }, [formData.difficulty])

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, topic: e.target.value })
    setTouched({ ...touched, topic: true })
  }

  const handleTopicSelect = (topic: string) => {
    setFormData({ ...formData, topic })
    setShowTopicSuggestions(false)
    setTouched({ ...touched, topic: true })
  }

  const handleDifficultyChange = (difficulty: "easy" | "medium" | "hard") => {
    setFormData({ ...formData, difficulty })
    setTouched({ ...touched, difficulty: true })
  }

  const handleStepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(
      Math.max(parseInt(e.target.value) || STEP_RANGE.min, STEP_RANGE.min),
      STEP_RANGE.max
    )
    setFormData({ ...formData, numberOfSteps: value })
    setTouched({ ...touched, numberOfSteps: true })
  }

  const isTopicValid = formData.topic.trim().length > 3
  const isFormValid = isTopicValid && canGenerate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid) {
      setTouched({
        topic: true,
        difficulty: true,
        numberOfSteps: true,
      })
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      console.error("Form submission error:", err)
    }
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <Card className="border-2 border-amber-600 bg-black/40 backdrop-blur-sm">
        <CardHeader className="border-b-2 border-amber-600/30 bg-black/60">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-black text-amber-400 mb-2">
                ⚙️ GENERATE QUIZ
              </CardTitle>
              <p className="text-sm text-white/70">
                Choose a topic and create your ordering quiz
              </p>
            </div>
            <div className="text-right">
              <Badge
                className={cn(
                  "font-black border-2 px-3 py-2 text-sm",
                  canGenerate
                    ? "bg-green-900/40 text-green-300 border-green-600"
                    : "bg-red-900/40 text-red-300 border-red-600"
                )}
              >
                {canGenerate ? "✓" : "✗"} {quizzesRemaining}/{dailyLimit}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Subscription Notice */}
          <div
            className={cn(
              "p-3 rounded-lg border-l-4 flex items-start gap-3",
              canGenerate
                ? "bg-blue-900/20 border-blue-600"
                : "bg-red-900/20 border-red-600"
            )}
          >
            <div className="flex-shrink-0 pt-0.5">
              {canGenerate ? (
                <CheckCircle2 className="h-5 w-5 text-blue-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="text-sm">
              {canGenerate ? (
                <p className="text-white/80">
                  You have <strong className="text-blue-300">{quizzesRemaining}</strong> quiz
                  {quizzesRemaining !== 1 ? "zes" : ""} remaining today on your{" "}
                  <strong className="text-amber-300">{userPlan}</strong> plan.
                </p>
              ) : (
                <div>
                  <p className="text-red-300 font-bold mb-1">Daily limit reached</p>
                  <p className="text-white/70">
                    You've used all {dailyLimit} quizzes for today. Upgrade your plan for more.
                  </p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Topic Selection */}
            <div className="space-y-3">
              <Label className="text-white font-bold uppercase text-xs tracking-wider">
                📚 Topic
              </Label>
              <p className="text-xs text-white/50">
                Enter a technical topic (e.g., HTTP, Git, Docker, APIs, Databases, etc.)
              </p>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter topic (min. 3 characters)..."
                  value={formData.topic}
                  onChange={handleTopicChange}
                  disabled={!canGenerate || isLoading}
                  className={cn(
                    "border-2 bg-black/40 text-white placeholder:text-white/40",
                    touched.topic
                      ? isTopicValid
                        ? "border-green-600 focus:border-green-600"
                        : "border-red-600 focus:border-red-600"
                      : "border-white/20 focus:border-amber-600",
                    "font-mono py-2"
                  )}
                />

                {/* Topic Suggestions */}
                {showTopicSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-black/80 border-2 border-amber-600 rounded-lg z-10 max-h-40 overflow-y-auto"
                  >
                    {suggestedTopics.map((topic, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleTopicSelect(topic)}
                        className="w-full text-left px-3 py-2 hover:bg-amber-600/20 border-b border-white/10 last:border-0 transition-colors text-white/80 hover:text-white"
                      >
                        {topic}
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* Validation feedback */}
                {touched.topic && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "text-xs mt-1",
                      isTopicValid ? "text-green-400" : "text-red-400"
                    )}
                  >
                    {isTopicValid
                      ? "✓ Topic is valid"
                      : "✗ Topic must be at least 3 characters"}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-3">
              <Label className="text-white font-bold uppercase text-xs tracking-wider">
                💪 Difficulty
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {DIFFICULTY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      handleDifficultyChange(option.value as "easy" | "medium" | "hard")
                    }
                    disabled={!canGenerate || isLoading}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all font-bold uppercase text-xs tracking-wider",
                      formData.difficulty === option.value
                        ? "border-amber-600 bg-amber-900/30 text-amber-300"
                        : "border-white/20 bg-black/30 text-white/70 hover:border-amber-600/50"
                    )}
                  >
                    <div className="text-lg mb-1">{option.icon}</div>
                    <div>{option.label}</div>
                    <div className="text-xs text-white/50 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Steps */}
            <div className="space-y-3">
              <Label className="text-white font-bold uppercase text-xs tracking-wider">
                🔢 Number of Steps
              </Label>
              <p className="text-xs text-white/50">
                Auto-set based on difficulty ({STEP_RANGE.min}-{STEP_RANGE.max})
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={STEP_RANGE.min}
                  max={STEP_RANGE.max}
                  value={formData.numberOfSteps}
                  onChange={handleStepChange}
                  disabled={!canGenerate || isLoading}
                  className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="min-w-fit px-3 py-1 bg-amber-600/20 border-2 border-amber-600 rounded-lg text-white font-bold font-mono">
                  {formData.numberOfSteps} steps
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-900/20 border-2 border-red-600 rounded-lg flex items-start gap-2"
              >
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.div
              whileHover={isFormValid ? { scale: 1.02 } : { scale: 1 }}
              whileTap={isFormValid ? { scale: 0.98 } : { scale: 1 }}
            >
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={cn(
                  "w-full py-3 border-2 font-black uppercase text-sm tracking-wider",
                  isFormValid && !isLoading
                    ? "bg-amber-600 hover:bg-amber-700 text-black border-amber-700"
                    : "bg-gray-600 text-white border-gray-700 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                      className="inline-block mr-2"
                    >
                      <Loader2 className="h-4 w-4" />
                    </motion.div>
                    GENERATING...
                  </>
                ) : (
                  <>
                    <Zap className="inline h-4 w-4 mr-2" />
                    GENERATE QUIZ
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Info Box */}
          <div className="p-3 bg-black/40 border-l-4 border-blue-600 rounded-lg space-y-2">
            <p className="text-xs font-bold text-blue-300 uppercase">💡 TIP</p>
            <p className="text-xs text-white/70">
              Be specific with your topic for better quiz generation. For example:
              <strong className="text-amber-300"> "API Authentication with JWT"</strong> instead
              of just <strong className="text-amber-300">"APIs"</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


