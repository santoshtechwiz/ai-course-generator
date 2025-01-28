"use client"

import * as React from "react"
import { Brain, HelpCircle, Timer, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ConfirmDialog } from "./ConfirmDialog"
import { quizSchema } from "@/schema/schema"
import { signIn, useSession } from "next-auth/react"
import { usePersistentState } from "@/hooks/usePersistentState"
import { motion } from "framer-motion"
import { SignInBanner } from "./SignInBanner"
import { PlanAwareButton } from "@/app/components/PlanAwareButton"

type QuizFormData = z.infer<typeof quizSchema>

interface Props {
  credits: number
  isLoggedIn: boolean
  maxQuestions: number
}

export default function CreateQuizForm({ isLoggedIn, maxQuestions, credits }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const { data: session, status } = useSession()

  const [formData, setFormData] = usePersistentState<QuizFormData>("quizFormData", {
    topic: "",
    amount: maxQuestions,
    difficulty: "medium",
  })
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: formData,
  })
  React.useEffect(() => {
    const subscription = watch((value) => setFormData(value as QuizFormData))
    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  const createQuizMutation = useMutation({
    mutationFn: async (data: QuizFormData) => {
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

      setIsConfirmDialogOpen(true)
    },
    [isLoading, isLoggedIn],
  )

  const handleConfirm = React.useCallback(async () => {
    setIsConfirmDialogOpen(false)
    setIsLoading(true)

    try {
      const response = await createQuizMutation.mutateAsync(watch())
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

  return (
    <div className="w-full bg-background border border-border shadow-sm">
      <SignInBanner isAuthenticated={status === "authenticated"} />
      <div className="px-2 sm:px-4 pt-6 pb-4">
        <div className="flex justify-center mb-4">
          <motion.div className="p-3 bg-primary/10 rounded-xl" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Brain className="w-8 h-8 text-primary" />
          </motion.div>
        </div>
        <h2 className="text-center text-2xl md:text-3xl font-bold">Create Your Quiz</h2>
        <p className="text-center text-base md:text-lg text-muted-foreground mt-2">
          Customize your quiz settings and challenge yourself!
        </p>
      </div>

      <div className="px-2 sm:px-4 pb-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="topic" className="text-lg font-medium">
              Topic
            </Label>
            <div className="relative">
              <Input
                id="topic"
                placeholder="Enter the quiz topic"
                className="h-12 pr-10"
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
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-medium">Number of Questions</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Timer className="w-5 h-5 text-muted-foreground" />
                <span className="text-2xl font-bold text-primary">{amount}</span>
              </div>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <Slider
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    max={maxQuestions}
                    min={1}
                    step={1}
                    className="py-4"
                    aria-label="Number of questions"
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
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-medium">Difficulty</Label>
            <div className="grid grid-cols-3 gap-4">
              {["easy", "medium", "hard"].map((level) => (
                <TooltipProvider key={level}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={difficulty === level ? "default" : "outline"}
                        className={cn("capitalize", difficulty === level && "border-primary")}
                        onClick={() => setValue("difficulty", level as "easy" | "medium" | "hard")}
                        aria-pressed={difficulty === level}
                      >
                        {level}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{level.charAt(0).toUpperCase() + level.slice(1)} difficulty questions</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <PlanAwareButton
                label="Generate Quiz"
                onClick={handleSubmit(onSubmit)}
                isLoggedIn={isLoggedIn}
                isEnabled={!errors.topic && !errors.amount && !errors.difficulty}
                hasCredits={credits > 0}
                loadingLabel="Generating..."
                className="w-full"
                customStates={{
                  default: {
                    tooltip: "Click to generate your quiz",
                  },
                  notEnabled: {
                    label: "Complete the form",
                    tooltip: "Please fill out all required fields",
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
                  className="w-full"
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
          </div>
        </form>
      </div>

      <div className="flex flex-col space-y-4 border-t px-2 sm:px-4 py-6">{/* Footer content */}</div>

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmDialogOpen(false)}
      />
    </div>
  )
}

