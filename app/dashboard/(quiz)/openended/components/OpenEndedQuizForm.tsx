"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  Info,
  AlertCircle,
  Sparkles,
  HelpCircle,
  BookOpen,
  PenTool,
  MessageSquare,
  Lightbulb,
} from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { SubscriptionSlider } from "@/app/dashboard/subscription/components/SubscriptionSlider"

import type { QueryParams } from "@/app/types/types"
import PlanAwareButton from "../../components/PlanAwareButton"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import FormContainer from "@/app/dashboard/FormContainer"
import { useToast } from "@/components/ui/use-toast"
import { useGlobalLoader } from "@/components/loaders/global-loaders"


const openEndedQuizSchema = z.object({
  topic: z
    .string()
    .min(3, "Topic must be at least 3 characters long")
    .max(100, "Topic must be at most 100 characters long"),
  amount: z.number().min(1, "At least 1 question is required").max(15, "Maximum 20 questions allowed"),
})

type OpenEndedQuizFormData = z.infer<typeof openEndedQuizSchema>

interface TopicFormProps {
  credits: number
  maxQuestions: number
  isLoggedIn: boolean
  params?: QueryParams
}

const TOPIC_CATEGORIES = {
  Academic: {
    icon: BookOpen,
    color:
      "bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 border-0",
    topics: [
      "Philosophy and Ethics",
      "Literature Analysis",
      "Historical Events",
      "Scientific Theories",
      "Mathematical Concepts",
      "Psychology Principles",
      "Sociology Studies",
      "Art History",
    ],
  },
  Professional: {
    icon: Lightbulb,
    color:
      "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 border-0",
    topics: [
      "Leadership Strategies",
      "Business Ethics",
      "Innovation Management",
      "Team Dynamics",
      "Strategic Planning",
      "Change Management",
      "Communication Skills",
      "Problem Solving",
    ],
  },
  Creative: {
    icon: PenTool,
    color:
      "bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 border-0",
    topics: [
      "Creative Writing Prompts",
      "Digital Art Techniques",
      "Graphic Design Principles",
      "Music Composition",
      "Film Making Basics",
      "Photography Styles",
      "Fashion Design Trends",
      "Interior Design Ideas",
    ],
  },
  PersonalDevelopment: {
    icon: HelpCircle,
    color:
      "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 border-0",
    topics: [
      "Mindfulness Practices",
      "Goal Setting Strategies",
      "Time Management Tips",
      "Stress Reduction Techniques",
      "Emotional Intelligence",
      "Positive Thinking",
      "Self-Care Routines",
      "Habit Formation",
    ],
  },
  Social: {
    icon: MessageSquare,
    color:
      "bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 border-0",
    topics: [
      "Current Social Issues",
      "Cultural Diversity",
      "Community Engagement",
      "Global Politics",
      "Environmental Conservation",
      "Human Rights",
      "Social Justice",
      "Public Health",
    ],
  },
  FunAndGames: {
    icon: Sparkles,
    color:
      "bg-gradient-to-r from-orange-400 to-yellow-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 border-0",
    topics: [
      "Trivia Questions",
      "Board Game Strategies",
      "Video Game History",
      "Sports Trivia",
      "Movie Trivia",
      "Music Trivia",
      "Pop Culture",
      "Fun Facts",
    ],
  },
}

function TopicFormComponent({ credits, maxQuestions, isLoggedIn, params }: TopicFormProps) {
  const router = useRouter()
  const [openInfo, setOpenInfo] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()
  const { withLoading } = useGlobalLoader()

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<OpenEndedQuizFormData>({
    resolver: zodResolver(openEndedQuizSchema),
    defaultValues: {
      topic: params?.topic || "",
      amount: params?.amount ? Number.parseInt(params.amount, 10) : maxQuestions,
    },
    mode: "onChange",
  })
  const generateQuiz = useCallback(
    async (data: OpenEndedQuizFormData) => {
      let isMounted = true
      setSubmitError(null)

      try {
        const response = await fetch("/api/quizzes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...data, title: data.topic, type: "openended" }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload?.error || "Failed to generate quiz")
        }

        const { slug } = await response.json()

        // Set success state
        if (isMounted) {
          setIsSuccess(true)
          toast({ title: "Success!", description: "Your open-ended quiz has been created." })

          // Add a slight delay to ensure the success message is shown before redirecting
          setTimeout(() => {
            if (isMounted) router.push(`/dashboard/openended/${slug}`)
          }, 600)
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error generating quiz:", err)
          const message = err instanceof Error ? err.message : "Failed to generate quiz"
          setSubmitError(message)
          toast({ title: "Error", description: message, variant: "destructive" })
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
      return () => {
        isMounted = false
      }
    },
    [router, toast],
  )
  const handleConfirm = useCallback(async () => {
    setIsLoading(true)
    const data = {
      topic: watch("topic"),
      amount: watch("amount"),
    }
    await withLoading(generateQuiz(data), {
      message: "Generating your quiz...",
      isBlocking: true,
      minVisibleMs: 400,
      autoProgress: true,
    })
  }, [generateQuiz, watch, withLoading])

  const onSubmit = useCallback(() => {
    if (isLoading) return

    if (!isLoggedIn) {
      // Redirect to sign in if not logged in
      return
    }

    // Validate token balance
    if (credits <= 0) {
      return
    }

    // Show confirmation dialog
    setIsConfirmDialogOpen(true)
  }, [isLoading, isLoggedIn, credits])

  const topic = watch("topic")
  const amount = watch("amount")

  const isDisabled = useMemo(() => isLoading || credits < 1 || !isValid, [isLoading, credits, isValid])

  return (
    <FormContainer spacing="lg">
      <div className="space-y-8 lg:space-y-10">
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-8 lg:space-y-10">
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label htmlFor="topic" className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Quiz Topic
            </Label>
            <Input
              id="topic"
              {...register("topic")}
              placeholder="E.g., Climate Change, AI in Education..."
              className="w-full h-12 lg:h-14 text-base lg:text-lg p-3 lg:p-4 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-primary border border-input"
              aria-label="Quiz topic"
              autoFocus
            />
            {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Label htmlFor="amount" className="text-sm lg:text-base font-medium flex justify-between items-center">
              <span>Number of Questions</span>
              <motion.span
                className="text-xl lg:text-2xl font-bold text-primary tabular-nums"
                key={amount}
                initial={{ scale: 1.2, color: "#00ff00" }}
                animate={{ scale: 1, color: "var(--primary)" }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                {amount}
              </motion.span>
            </Label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <SubscriptionSlider
                  value={field.value}
                  onValueChange={field.onChange}
                  ariaLabel="Select number of questions"
                />
              )}
            />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </motion.div>

          <motion.div
            className="rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="space-y-3 lg:space-y-4">
              <h3 className="text-base lg:text-lg font-semibold mb-2">Available Credits</h3>
              <Progress value={(credits / 10) * 100} className="h-2 lg:h-3" />
              <p className="text-xs lg:text-sm text-muted-foreground">
                You have <span className="font-bold text-primary">{credits}</span> credits remaining.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="cursor-pointer transition-colors rounded-lg overflow-hidden"
            onClick={() => setOpenInfo(!openInfo)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex flex-row items-center justify-between py-3 lg:py-4">
              <h3 className="text-sm lg:text-base font-semibold">About Open-ended Questions</h3>
              <motion.div animate={{ rotate: openInfo ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5" />
              </motion.div>
            </div>
            <AnimatePresence>
              {openInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-sm lg:text-base pb-4 lg:pb-6 space-y-2 lg:space-y-3">
                    <p>
                      Open-ended questions encourage critical thinking and detailed responses. They are perfect for:
                    </p>
                    <ul className="list-disc list-inside space-y-1 lg:space-y-2 ml-2">
                      <li>Assessing deep understanding</li>
                      <li>Promoting thoughtful discussion</li>
                      <li>Developing analytical skills</li>
                      <li>Encouraging creative thinking</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {errors.root && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Alert variant="destructive">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="pt-6 lg:pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <PlanAwareButton
              label="Generate Quiz"
              onClick={onSubmit}
              isLoggedIn={isLoggedIn}
              isLoading={isLoading}
              isEnabled={!isDisabled}
              hasCredits={credits > 0}
              loadingLabel="Generating..."
              className="w-full h-12 lg:h-14 text-base lg:text-lg transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg disabled:bg-gradient-to-r disabled:from-sky-300 disabled:to-cyan-300 disabled:text-white disabled:opacity-100 disabled:cursor-not-allowed"
              customStates={{
                default: {
                  tooltip: "Click to generate your quiz",
                },
                notEnabled: {
                  label: "Enter a topic to generate",
                  tooltip: "Please enter a topic before generating the quiz",
                },
                noCredits: {
                  label: "Out of credits",
                  tooltip: "You need credits to generate a quiz. Consider upgrading your plan.",
                },
              }}
            />
          </motion.div>
        </form>
      </div>

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={handleConfirm}
        onCancel={() => {
          setIsConfirmDialogOpen(false)
          setIsLoading(false)
        }}
        title="Generate Open-Ended Quiz"
        description="You are about to use AI to generate an open-ended quiz. This will use credits from your account."
        confirmText="Generate Now"
        cancelText="Cancel"
        showTokenUsage={true}
  status={isLoading ? "loading" : submitError ? "error" : isSuccess ? "success" : undefined}
  errorMessage={submitError || undefined}
        tokenUsage={{
          used: Math.max(0, maxQuestions - credits),
          available: maxQuestions,
          remaining: credits,
          percentage: (Math.max(0, maxQuestions - credits) / maxQuestions) * 100,
        }}
        quizInfo={{
          type: "Open-Ended Quiz",
          topic: watch("topic"),
          count: watch("amount"),
          estimatedTokens: Math.min(watch("amount") || 1, 5) * 150, // Open-ended questions use more tokens
        }}
      >
        <div className="py-2">
          <p className="text-sm">
            Generating {watch("amount")} open-ended questions for topic: {" "}
            <span className="font-medium">{watch("topic")}</span>
          </p>
        </div>
      </ConfirmDialog>

      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 right-0 mt-4 mr-4"
          >
            <Alert variant="destructive" className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 right-0 mt-4 mr-4"
          >
            <Alert className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Your quiz has been generated successfully!</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </FormContainer>
  )
}

export const OpenEndedQuizForm = memo(TopicFormComponent)

export default OpenEndedQuizForm
