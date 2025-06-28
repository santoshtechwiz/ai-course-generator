"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"

import { TextQuote, HelpCircle, Timer, Sparkles, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

import { usePersistentState } from "@/hooks/usePersistentState"
import { cn } from "@/lib/tailwindUtils"
import { blanksQuizSchema } from "@/schema/schema"

import type { z } from "zod"
import type { QueryParams } from "@/app/types/types"
import { SubscriptionSlider } from "@/app/dashboard/subscription/components/SubscriptionSlider"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import PlanAwareButton from "../../components/PlanAwareButton"

type BlankQuizFormData = z.infer<typeof blanksQuizSchema> & {

}

interface BlankQuizFormProps {
  credits: number
  isLoggedIn: boolean
  maxQuestions: number
  params?: QueryParams
}



export default function BlankQuizForm({ isLoggedIn, maxQuestions, credits, params }: BlankQuizFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)


  const [formData, setFormData] = usePersistentState<BlankQuizFormData>("blankQuizFormData", {
    title: params?.title || "",
    amount: params?.amount ? Number.parseInt(params.amount, 10) : maxQuestions,
    difficulty: (typeof params?.difficulty === "string" && ["easy", "medium", "hard"].includes(params.difficulty)
      ? params.difficulty
      : "easy") as "easy" | "medium" | "hard",
    topic: params?.topic || "",
    type: "fill_in_the_blanks",
  })

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<BlankQuizFormData>({
    resolver: zodResolver(blanksQuizSchema),
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
    if (
      typeof params?.difficulty === "string" &&
      ["easy", "medium", "hard"].includes(params.difficulty)
    ) {
      setValue("difficulty", params.difficulty as "easy" | "medium" | "hard")
    }
    if (params?.topic) {
      setValue("topic", params.topic)
    }
  }, [params?.title, params?.amount, params?.difficulty, params?.topic, maxQuestions, setValue])

  React.useEffect(() => {
    const subscription = watch((value) => setFormData(value as BlankQuizFormData))
    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  const { mutateAsync: createBlankQuizMutation } = useMutation({
    mutationFn: async (data: BlankQuizFormData) => {
      
      const response = await axios.post("/api/blanks", data)
      return response.data
    },
    onError: (error) => {
      console.error("Error creating blanks quiz:", error)
      toast({
        title: "Error",
        description: "Failed to create fill-in-the-blanks quiz. Please try again.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = React.useCallback(
    (data: BlankQuizFormData) => {
      if (isLoading) return

      if (!data.title || !data.amount || !data.difficulty || !data.topic) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }


      setIsLoading(true)
      setIsConfirmDialogOpen(true)
    },
    [isLoading, isLoggedIn, toast],
  )

  const handleConfirm = React.useCallback(async () => {
    setIsConfirmDialogOpen(false)

    try {
      const formValues = watch()
      const response = await createBlankQuizMutation({
        title: formValues.title,
        amount: formValues.amount,
        difficulty: formValues.difficulty,
        topic: formValues.topic,
        type: "fill_in_the_blanks",
      })
      const userQuizId = response?.userQuizId

      if (!userQuizId) throw new Error("Blanks Quiz ID not found")

      toast({
        title: "Success!",
        description: "Your fill-in-the-blanks quiz has been created.",
      })

      router.push(`/dashboard/blanks/${response?.slug}`)
    } catch (error) {
      // Error is handled in the mutation's onError callback
    } finally {
      setIsLoading(false)
    }
  }, [createBlankQuizMutation, watch, toast, router])

  const amount = watch("amount")
  const difficulty = watch("difficulty")
  const title = watch("title")
  const topic = watch("topic")

  const isFormValid = React.useMemo(() => {
    return !!title && !!amount && !!difficulty && !!topic && isValid
  }, [title, amount, difficulty, topic, isValid])

  const isDisabled = React.useMemo(() => credits < 1 || !isFormValid || isLoading, [credits, isFormValid, isLoading])

  // Memoize the difficulty options to prevent unnecessary re-renders
  const difficultyOptions = React.useMemo(() => {
    return [
      { value: "easy", label: "Easy", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-800 border-amber-200" },
      { value: "hard", label: "Hard", color: "bg-rose-100 text-rose-800 border-rose-200" },
    ]
  }, [])

  // Suggested topics for blanks quizzes
  const suggestedTopics = [
    "English Grammar",
    "Vocabulary",
    "Science Terms",
    "Historical Facts",
    "Famous Quotes",
    "Literary Passages",
    "Business Terminology",
  ]

  // Fix credit percentage calculation to be type-safe and display actual credits
  const creditPercentage = React.useMemo(() => {
    if (typeof credits !== 'number' || isNaN(credits) || credits <= 0) {
      return 0;
    }
    // Use max value as 100 to create better visual scale for progress bar
    const maxCreditDisplay = 100;
    return Math.min((credits / maxCreditDisplay) * 100, 100);
  }, [credits]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto p-6 space-y-8"
    >
      <Card className="bg-background border border-border shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="bg-primary/5 border-b border-border/60 pb-6">
          <div className="flex justify-center mb-4">
            <motion.div
              className="p-3 bg-primary/10 rounded-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <TextQuote className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-center text-primary">
            Create Fill-in-the-Blanks Quiz
          </CardTitle>
          <p className="text-center text-base md:text-lg text-muted-foreground mt-2">
            Test your knowledge by filling in the missing words or phrases
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
              <Label htmlFor="title" className="text-base font-medium text-foreground flex items-center gap-2">
                Title
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Enter a descriptive title for your fill-in-the-blanks quiz</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  placeholder="Enter the quiz title"
                  className="w-full p-3 h-12 border border-input rounded-md focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all pr-10"
                  {...register("title")}
                  aria-describedby="title-description"
                />
                <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              {errors.title && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive mt-1"
                  id="title-error"
                >
                  {errors.title.message}
                </motion.p>
              )}
              <p className="text-sm text-muted-foreground" id="title-description">
                Examples: Common English Idioms, Medical Terminology, Scientific Concepts
              </p>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="topic" className="text-base font-medium text-foreground flex items-center gap-2">
                Topic
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Select a topic for your fill-in-the-blanks quiz</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {suggestedTopics.map((suggestedTopic) => (
                    <Badge
                      key={suggestedTopic}
                      variant={topic === suggestedTopic ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setValue("topic", suggestedTopic)}
                    >
                      {suggestedTopic}
                    </Badge>
                  ))}
                </div>

                <Input
                  id="topic"
                  placeholder="Enter a topic or choose from above"
                  className="w-full p-3 h-12 border border-input rounded-md focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all"
                  {...register("topic")}
                />
              </div>

              {errors.topic && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive mt-1"
                >
                  {errors.topic.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label className="text-base font-medium text-foreground flex items-center gap-2">
                Number of Questions
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Select how many questions you want in your quiz</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="space-y-3 px-2">
                <div className="flex items-center justify-between px-2">
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
              {errors.amount && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive mt-1"
                >
                  {errors.amount.message}
                </motion.p>
              )}
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
              transition={{ delay: 0.5 }}
            >
              <Label className="text-base font-medium text-foreground flex items-center gap-2">
                Difficulty
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Choose how challenging the questions should be</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="grid grid-cols-3 gap-4">
                {difficultyOptions.map((level) => (
                  <Button
                    key={level.value}
                    type="button"
                    variant={difficulty === level.value ? "default" : "outline"}
                    className={cn(
                      "capitalize w-full h-12 font-medium transition-all",
                      difficulty === level.value ? "border-primary shadow-sm" : "hover:border-primary/50",
                    )}
                    onClick={() => setValue("difficulty", level.value as "easy" | "medium" | "hard")}
                    aria-pressed={difficulty === level.value}
                  >
                    {level.label}
                    {difficulty === level.value && <Check className="ml-2 h-4 w-4" />}
                  </Button>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Available Credits
              </h3>
              <Progress value={creditPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                You have <span className="font-bold text-primary">{credits}</span> credit{credits !== 1 ? 's' : ''} remaining.
              </p>
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
              className="pt-4 border-t border-border/60"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <PlanAwareButton
                type="submit"
                label="Generate Fill-in-the-Blanks Quiz"
                isLoggedIn={isLoggedIn}
                isEnabled={!isDisabled}
                isLoading={isLoading}
                hasCredits={credits > 0}
                loadingLabel="Generating Quiz..."
                className="w-full h-12 text-base font-medium transition-all duration-300 hover:shadow-lg"
                customStates={{
                  default: {
                    tooltip: "Click to generate your fill-in-the-blanks quiz",
                  },
                  notEnabled: {
                    label: "Complete form to generate",
                    tooltip: "Please complete the form before generating the quiz",
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
