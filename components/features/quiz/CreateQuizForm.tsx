"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { signIn, useSession } from "next-auth/react"
import { Brain, HelpCircle, Timer } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { ConfirmDialog } from "./ConfirmDialog"
import { SignInBanner } from "./SignInBanner"
import PlanAwareButton from "@/components/PlanAwareButton"
import { SubscriptionSlider } from "@/components/SubscriptionSlider"

import { quizSchema } from "@/schema/schema"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { usePersistentState } from "@/hooks/usePersistentState"
import { cn } from "@/lib/utils"

import type { z } from "zod"
import type { QueryParams } from "@/app/types/types"

type QuizFormData = z.infer<typeof quizSchema> & {
  userType?: string
}

interface CreateQuizFormProps {
  credits: number
  isLoggedIn: boolean
  maxQuestions: number
  params?: QueryParams
}

export default function CreateQuizForm({ isLoggedIn, maxQuestions, credits, params }: CreateQuizFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const { data: session, status } = useSession()
  const { subscriptionStatus } = useSubscriptionStore()

  const [formData, setFormData] = usePersistentState<QuizFormData>("quizFormData", {
    title: params?.title || "",
    amount: params?.amount ? Number.parseInt(params.amount, 10) : maxQuestions,
    difficulty: "medium",
  })

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: formData,
    mode: "onChange",
  })

  React.useEffect(() => {
    if (params?.title) {
      setValue("title", params.title)
    }
    if (params?.amount) {
      const amount = Number.parseInt(params.amount, 10)
      if (amount !== maxQuestions) {
        setValue("amount", Math.min(amount, maxQuestions))
      }
    }
  }, [params?.title, params?.amount, maxQuestions, setValue])

  React.useEffect(() => {
    const subscription = watch((value) => setFormData(value as QuizFormData))
    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  const { mutateAsync: createQuizMutation } = useMutation({
    mutationFn: async (data: QuizFormData) => {
      data.userType = subscriptionStatus?.subscriptionPlan
      const response = await axios.post("/api/game", data)
      return response.data
    },
    onError: (error) => {
      console.error("Error creating quiz:", error)
      toast({
        description: "Failed to create quiz. Please try again.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = React.useCallback(
    (data: QuizFormData) => {
      if (isLoading) return

      if (!isLoggedIn) {
        signIn("credentials", { callbackUrl: "/dashboard/mcq" })
        return
      }

      setIsLoading(true)
      setIsConfirmDialogOpen(true)
    },
    [isLoading, isLoggedIn],
  )

  const handleConfirm = React.useCallback(async () => {
    setIsConfirmDialogOpen(false)

    try {
      const response = await createQuizMutation(watch())
      const userQuizId = response?.userQuizId

      if (!userQuizId) throw new Error("userQuizId ID not found")

      toast({
        title: "Success!",
        description: "Your quiz has been created.",
      })

      router.push(`/dashboard/mcq/${response?.slug}`)
    } catch (error) {
      // Error is handled in the mutation's onError callback
    } finally {
      setIsLoading(false)
    }
  }, [createQuizMutation, watch, toast, router])

  const amount = watch("amount")
  const difficulty = watch("difficulty")
  const title = watch("title")

  const isFormValid = React.useMemo(() => {
    return !!title && !!amount && !!difficulty && isValid
  }, [title, amount, difficulty, isValid])

  const isDisabled = React.useMemo(() => credits < 1 || !isFormValid || isLoading, [credits, isFormValid, isLoading])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <SignInBanner isAuthenticated={status === "authenticated"} />
      <Card className="bg-background border border-border shadow-sm">
        <CardHeader className="bg-primary/5 border-b">
          <div className="flex justify-center mb-4">
            <motion.div
              className="p-3 bg-primary/10 rounded-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Brain className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-center text-primary">Create Your Quiz</CardTitle>
          <p className="text-center text-base md:text-lg text-muted-foreground mt-2">
            Customize your quiz settings and challenge yourself!
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="title" className="text-lg font-medium">
                Topic
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  placeholder="Enter the quiz topic"
                  className="h-12 pr-10 transition-all duration-300 focus:ring-2 focus:ring-primary"
                  {...register("title")}
                  aria-describedby="topic-description"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="absolute right-3 top-3 w-6 h-6 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter any topic you'd like to be quizzed on</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {errors.title && (
                <p className="text-sm text-destructive" id="topic-error">
                  {errors.title.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground" id="topic-description">
                Choose a specific topic for more focused questions
              </p>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label className="text-lg font-medium">Number of Questions</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Timer className="w-5 h-5 text-muted-foreground" />
                  <motion.span
                    className="text-2xl font-bold text-primary"
                    key={amount}
                    initial={{ scale: 1.2, color: "#00ff00" }}
                    animate={{ scale: 1, color: "var(--primary)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    {amount}
                  </motion.span>
                </div>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <SubscriptionSlider
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      ariaLabel="Select number of questions"
                    />
                  )}
                />
                <p className="text-sm text-muted-foreground text-center">
                  Select between 1 and {maxQuestions} questions
                </p>
              </div>
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              <p className="text-sm text-muted-foreground mt-2">
                {isLoggedIn
                  ? "Unlimited quizzes available"
                  : `This quiz will use ${amount} credit${amount > 1 ? "s" : ""}`}
              </p>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label className="text-lg font-medium">Difficulty</Label>
              <div className="grid grid-cols-3 gap-4">
                {["easy", "medium", "hard"].map((level) => (
                  <TooltipProvider key={level}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            type="button"
                            variant={difficulty === level ? "default" : "outline"}
                            className={cn("capitalize w-full", difficulty === level && "border-primary")}
                            onClick={() => setValue("difficulty", level as "easy" | "medium" | "hard")}
                            aria-pressed={difficulty === level}
                          >
                            {level}
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{level.charAt(0).toUpperCase() + level.slice(1)} difficulty questions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="bg-primary/5 border border-primary/20 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="p-4 space-y-2">
                <h3 className="text-base font-semibold mb-2">Available Credits</h3>
                <Progress value={(credits / 10) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  You have <span className="font-bold text-primary">{credits}</span> credits remaining.
                </p>
              </div>
            </motion.div>

            <AnimatePresence>
              {errors.root && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errors.root.message}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="pt-4 border-t"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <PlanAwareButton
                label="Generate Quiz"
                onClick={handleSubmit(onSubmit)}
                isLoggedIn={isLoggedIn}
                isEnabled={!isDisabled}
                isLoading={isLoading}
                hasCredits={credits > 0}
                loadingLabel="Generating Quiz..."
                className="w-full transition-all duration-300 hover:shadow-lg"
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
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmDialogOpen(false)}
      />
    </motion.div>
  )
}

