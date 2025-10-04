"use client"

import { memo, useCallback, useMemo, useState, useEffect } from "react"
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
  Hash,
} from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { SubscriptionSlider } from "@/app/dashboard/subscription/components/SubscriptionSlider"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"

import type { QueryParams } from "@/app/types/types"
import PlanAwareButton from "@/components/quiz/PlanAwareButton"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import FormContainer from "@/app/dashboard/FormContainer"
import { useToast } from "@/components/ui/use-toast"


const openEndedQuizSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters long")
    .max(200, "Title must be at most 200 characters long"),
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
  const { subscription } = useUnifiedSubscription()

  // Credit information state for consistent display
  const [creditInfo, setCreditInfo] = useState({
    hasCredits: false,
    remainingCredits: credits,
    totalCredits: 0,
    usedCredits: 0
  })

  // Use unified subscription as single source of truth - fixes sync issues
  useEffect(() => {
    if (subscription) {
      const totalCredits = subscription.credits || 0
      const usedCredits = subscription.tokensUsed || 0
      const remainingCredits = Math.max(0, totalCredits - usedCredits)
      
      setCreditInfo({
        hasCredits: remainingCredits > 0,
        remainingCredits: remainingCredits,
        totalCredits: totalCredits,
        usedCredits: usedCredits
      })
    } else {
      setCreditInfo({
        hasCredits: false,
        remainingCredits: 0,
        totalCredits: 0,
        usedCredits: 0
      })
    }
  }, [subscription])

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<OpenEndedQuizFormData>({
    resolver: zodResolver(openEndedQuizSchema),
    defaultValues: {
      title: params?.title || params?.topic || "",
      amount: params?.amount ? Number.parseInt(params.amount, 10) : maxQuestions,
    },
    mode: "onChange",
  })
  const generateQuiz = useCallback(
    async (data: OpenEndedQuizFormData) => {
      let isMounted = true
      setSubmitError(null)

      try {
        const response = await fetch("/api/quizzes/openended/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...data, type: "openended" }),
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
      title: watch("title"),
      amount: watch("amount"),
    }
    await generateQuiz(data)
  }, [generateQuiz, watch])

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

  const title = watch("title")
  const amount = watch("amount")

  const isDisabled = useMemo(() => isLoading || credits < 1 || !isValid, [isLoading, credits, isValid])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-6 md:space-y-8">
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6 md:space-y-8">
          <motion.div
            className="space-y-2 md:space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label htmlFor="title" className="text-sm md:text-base font-medium flex items-center gap-2">
              <Info className="h-4 w-4 text-primary flex-shrink-0" />
              Quiz Title or Topic
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter your quiz topic (e.g., The impact of technology on education)"
              className="w-full h-12 md:h-14 text-sm md:text-base p-3 md:p-4 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-primary border border-input"
              aria-label="Quiz title or topic"
              autoFocus
            />
            {errors.title && (
              <p className="text-destructive text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errors.title.message}
              </p>
            )}
          </motion.div>

          <motion.div
            className="space-y-2 md:space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Label htmlFor="amount" className="text-sm md:text-base font-medium flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary flex-shrink-0" />
                Number of Questions
              </span>
              <motion.span
                className="text-lg md:text-xl font-bold text-primary tabular-nums"
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
            className="bg-card/50 p-4 md:p-6 rounded-lg border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                Available Credits
              </h3>
              <Progress 
                value={creditInfo.totalCredits > 0 ? (creditInfo.remainingCredits / creditInfo.totalCredits) * 100 : 0} 
                className="h-2 md:h-3" 
              />
              <p className="text-xs md:text-sm text-muted-foreground">
                {creditInfo.usedCredits} used of {creditInfo.totalCredits} total credits. 
                <span className="font-bold text-primary ml-1">{creditInfo.remainingCredits} remaining</span>.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="cursor-pointer transition-colors rounded-lg overflow-hidden border border-border hover:bg-muted/50"
            onClick={() => setOpenInfo(!openInfo)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex flex-row items-center justify-between p-3 md:p-4">
              <h3 className="text-sm md:text-base font-semibold flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
                About Open-ended Questions
              </h3>
              <motion.div 
                animate={{ rotate: openInfo ? 180 : 0 }} 
                transition={{ duration: 0.3 }}
                className="flex-shrink-0"
              >
                <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />
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
            className="pt-6 md:pt-8"
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
              loadingLabel="Generating quiz..."
              className="w-full h-12 md:h-14 text-sm md:text-base font-medium transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg disabled:bg-gradient-to-r disabled:from-sky-300 disabled:to-cyan-300 disabled:text-white disabled:opacity-100 disabled:cursor-not-allowed touch-manipulation"
              customStates={{
                default: {
                  tooltip: "Click to generate your quiz",
                },
                notEnabled: {
                  label: "Enter a title to generate",
                  tooltip: "Please enter a title or topic before generating the quiz",
                },
                noCredits: {
                  label: `Need credits (${creditInfo.remainingCredits} remaining)`,
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
        showCreditUsage={true}
        status={isLoading ? "loading" : submitError ? "error" : isSuccess ? "success" : undefined}
        errorMessage={submitError || undefined}
        creditUsage={{
          used: Math.max(0, 100 - credits), // Assuming 100 total credits for calculation
          available: 100,
          remaining: credits,
          percentage: credits > 0 ? ((100 - credits) / 100) * 100 : 100,
        }}
        quizInfo={{
          type: "Open-Ended Quiz",
          topic: watch("title"),
          count: watch("amount"),
          estimatedCredits: 1, // Quiz creation costs 1 credit
        }}
      >
        <div className="py-2">
          <p className="text-sm">
            Generating {watch("amount")} open-ended questions for topic: {" "}
            <span className="font-medium">{watch("title")}</span>
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
    </div>
  )
}

export const OpenEndedQuizForm = memo(TopicFormComponent)

export default OpenEndedQuizForm
