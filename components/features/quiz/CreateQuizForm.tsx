"use client"

import * as React from "react"
import { Brain, HelpCircle, Timer, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ConfirmDialog } from "./ConfirmDialog"
import { quizSchema } from "@/schema/schema"
import { signIn, useSession } from "next-auth/react"
import { usePersistentState } from "@/hooks/usePersistentState"
import { motion } from "framer-motion"
import { SignInBanner } from "./SignInBanner"
import useSubscriptionStore from "@/store/useSubscriptionStore"

import { QueryParams } from "@/app/types/types"
import PlanAwareButton from "@/components/PlanAwareButton"
import { SubscriptionSlider } from "@/components/SubscriptionSlider"

type QuizFormData = z.infer<typeof quizSchema> & {
  userType?: string
}

interface Props {
  credits: number
  isLoggedIn: boolean
  maxQuestions: number
  params?: QueryParams

}

export default function CreateQuizForm({
  isLoggedIn,
  maxQuestions,
  credits,
  params

}: Props) {
  const router = useRouter()
  const { toast } = useToast()

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const { data: session, status } = useSession()
  const { subscriptionStatus } = useSubscriptionStore()

  console.log("params", params);
  const [formData, setFormData] = usePersistentState<QuizFormData>("quizFormData", {
    topic: params?.topic || "",
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
    if (params?.topic) {

      setValue("topic", params.topic)

    }
    if (params?.amount) {
      const amount = Number.parseInt(params.amount, 10)
      if (amount !== maxQuestions) {
        setValue("amount", Math.min(amount, maxQuestions))
      }
    }
  }, [params?.topic, params?.amount, maxQuestions, setValue])
  React.useEffect(() => {
    const subscription = watch((value) => setFormData(value as QuizFormData))
    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  const { mutateAsync: createQuizMutation, status: mutationStatus } = useMutation({
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
        signIn("credentials", { callbackUrl: "/dashboard/quiz" })
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
  const topic = watch("topic")

  const isFormValid = React.useMemo(() => {
    return !!topic && !!amount && !!difficulty && isValid
  }, [topic, amount, difficulty, isValid])

  const isDisabled = React.useMemo(() => credits < 1 || !isFormValid || isLoading, [credits, isFormValid, isLoading])
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto bg-background border border-border shadow-sm rounded-lg overflow-hidden"
    >
      <SignInBanner isAuthenticated={status === "authenticated"} />
      <motion.div
        className="px-4 sm:px-6 pt-6 pb-4 bg-primary/5 border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex justify-center mb-4">
          <motion.div className="p-3 bg-primary/10 rounded-xl" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Brain className="w-8 h-8 text-primary" />
          </motion.div>
        </div>
        <h2 className="text-center text-2xl md:text-3xl font-bold text-primary">Create Your Quiz</h2>
        <p className="text-center text-base md:text-lg text-muted-foreground mt-2">
          Customize your quiz settings and challenge yourself!
        </p>
      </motion.div>

      <div className="px-4 sm:px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Label htmlFor="topic" className="text-lg font-medium">
              Topic
            </Label>
            <div className="relative">
              <Input
                id="topic"
                placeholder="Enter the quiz topic"
                className="h-12 pr-10 transition-all duration-300 focus:ring-2 focus:ring-primary"
                {...register("topic")}
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
            {errors.topic && (
              <p className="text-sm text-destructive" id="topic-error">
                {errors.topic.message}
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
              <p className="text-sm text-muted-foreground text-center">Select between 1 and {maxQuestions} questions</p>
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
            className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
            {status !== "authenticated" && (
              <motion.div className="w-full sm:w-auto" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full transition-all duration-300 hover:shadow-md"
                  onClick={() => {
                    toast({
                      title: "Quiz Saved",
                      description: "Your quiz has been saved as a draft. Sign in to complete it later.",
                    })
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
              </motion.div>
            )}
          </motion.div>
        </form>
      </div>

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmDialogOpen(false)}
      />
    </motion.div>
  )
}

