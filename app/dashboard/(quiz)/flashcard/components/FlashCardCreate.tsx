"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { signIn, useSession } from "next-auth/react"
import { Layers, HelpCircle, Timer } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


import useSubscriptionStore from "@/store/useSubscriptionStore"
import { usePersistentState } from "@/hooks/usePersistentState"
import { cn } from "@/lib/utils"

import { z } from "zod"
import type { QueryParams } from "@/app/types/types"
import { SubscriptionSlider } from "@/app/dashboard/subscription/components/SubscriptionSlider"
import { ConfirmDialog } from "../../components/ConfirmDialog"

const flashcardSchema = z.object({
  title: z.string().nonempty("Topic is required"),
  count: z.number().int().min(1, "Amount must be at least 1").max(100, "Amount must be at most 100"),
  difficulty: z.enum(["easy", "medium", "hard"]),
})

type FlashCardFormData = z.infer<typeof flashcardSchema> & {
  userType?: string
}

interface FlashCardCreateProps {
  credits: number
  isLoggedIn: boolean
  maxCards: number
  params?: QueryParams
}

export default function FlashCardCreate({ isLoggedIn, maxCards, credits, params }: FlashCardCreateProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const { data: session, status } = useSession()
  const { subscriptionStatus } = useSubscriptionStore()

  // Use a ref to track if component is mounted
  const isMounted = React.useRef(false)
  React.useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const [formData, setFormData] = usePersistentState<FlashCardFormData>("flashcardFormData", {
    title: params?.title || "",
    count: params?.amount ? Number.parseInt(params.amount, 10) : maxCards,
    difficulty: "medium",
  })

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FlashCardFormData>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: formData,
    mode: "onChange",
  })

  // Optimize params effect to only run once on mount
  React.useEffect(() => {
    if (params?.title) {
      setValue("title", params.title)
    }
    if (params?.amount) {
      const amount = Number.parseInt(params.amount, 10)
      if (amount !== maxCards) {
        setValue("count", Math.min(amount, maxCards))
      }
    }
  }, [params?.title, params?.amount, maxCards, setValue])

  // Use debounce for form data updates to improve performance
  React.useEffect(() => {
    const subscription = watch((value) => {
      const timeoutId = setTimeout(() => {
        setFormData(value as FlashCardFormData)
      }, 500) // 500ms debounce

      return () => clearTimeout(timeoutId)
    })
    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  const { mutateAsync: createFlashCardsMutation } = useMutation({
    mutationFn: async (data: FlashCardFormData) => {
      data.userType = subscriptionStatus?.subscriptionPlan
      const response = await axios.post("/api/flashcard", data)
      return response.data
    },
    onError: (error) => {
      console.error("Error creating flashcards:", error)
      toast({
        title: "Error",
        description: "Failed to create flashcards. Please try again.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = React.useCallback(
    (data: FlashCardFormData) => {
      if (isLoading) return

      if (!isLoggedIn) {
        signIn("credentials", { callbackUrl: "/dashboard/flashcard" })
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
      const response = await createFlashCardsMutation(watch())

      if (response?.success) {
        toast({
          title: "Success!",
          description: response.message || "Your flashcards have been created.",
        })

        // Make sure to extract the slug from the response
        const slug = response.slug

        if (slug && isMounted.current) {
          // Add a slight delay to ensure the toast is shown before redirecting
          setTimeout(() => {
            router.push(`/dashboard/flashcard/${slug}`)
          }, 300)
        } else {
          console.error("Missing slug in response:", response)
          throw new Error("Missing slug in response")
        }
      } else {
        throw new Error("Failed to create flashcards")
      }
    } catch (error) {
      // Error handling is managed in the mutation's onError callback
      console.error("Error in handleConfirm:", error)
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [createFlashCardsMutation, watch, toast, router])

  const count = watch("count")
  const difficulty = watch("difficulty")
  const title = watch("title")

  // Memoize form validation to reduce rerenders
  const isFormValid = React.useMemo(() => {
    return !!title && !!count && !!difficulty && isValid
  }, [title, count, difficulty, isValid])

  const isDisabled = React.useMemo(() => credits < 1 || !isFormValid || isLoading, [credits, isFormValid, isLoading])

  // Precompute difficulty colors for better UX
  const getDifficultyColor = React.useCallback(
    (level: string) => {
      if (difficulty !== level) return ""

      switch (level) {
        case "easy":
          return "bg-green-50 border-green-200 text-green-700"
        case "medium":
          return "bg-blue-50 border-blue-200 text-blue-700"
        case "hard":
          return "bg-red-50 border-red-200 text-red-700"
        default:
          return ""
      }
    },
    [difficulty],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto p-6 space-y-8 bg-card rounded-lg shadow-md"
    >
      <Card className="bg-background border border-border shadow-sm">
        <CardHeader className="bg-primary/5 border-b border-border/60 pb-6">
          <div className="flex justify-center mb-4">
            <motion.div
              className="p-3 bg-primary/10 rounded-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Layers className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-center text-primary">Create Flashcards</CardTitle>
          <p className="text-center text-base md:text-lg text-muted-foreground mt-2">
            Generate flashcards to help you study any topic
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
                      <p className="w-[200px]">Enter any title you'd like to create flashcards for</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  placeholder="Enter the flashcard title"
                  className="w-full p-3 h-12 border border-input rounded-md focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all"
                  {...register("title")}
                  aria-describedby="topic-description"
                  autoComplete="off"
                />
              </div>
              {errors.title && (
                <p className="text-sm text-destructive mt-1" id="topic-error">
                  {errors.title.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground" id="topic-description">
                Choose a specific title for more focused flashcards
              </p>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label className="text-base font-medium text-foreground flex items-center gap-2">
                Number of Flashcards
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Select how many flashcards you want in your set</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="space-y-3 px-2">
                <div className="flex items-center justify-between px-2">
                  <Timer className="w-5 h-5 text-muted-foreground" />
                  <motion.span
                    className="text-2xl font-bold text-primary"
                    key={count}
                    initial={{ scale: 1.2, color: "#00ff00" }}
                    animate={{ scale: 1, color: "var(--primary)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    {count}
                  </motion.span>
                </div>
                <Controller
                  name="count"
                  control={control}
                  render={({ field }) => (
                    <SubscriptionSlider
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      ariaLabel="Select number of flashcards"
                    />
                  )}
                />
                <p className="text-sm text-muted-foreground text-center">Select between 1 and {maxCards} flashcards</p>
              </div>
              {errors.count && <p className="text-sm text-destructive mt-1">{errors.count.message}</p>}
              <p className="text-sm text-muted-foreground mt-2">
                {isLoggedIn
                  ? "Unlimited flashcard sets available"
                  : `This set will use ${count} credit${count > 1 ? "s" : ""}`}
              </p>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label className="text-base font-medium text-foreground flex items-center gap-2">
                Difficulty
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Choose how challenging the flashcards should be</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="grid grid-cols-3 gap-4">
                {["easy", "medium", "hard"].map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={difficulty === level ? "default" : "outline"}
                    className={cn(
                      "capitalize w-full h-12 font-medium transition-all",
                      difficulty === level ? "border-primary shadow-sm" : "hover:border-primary/50",
                      getDifficultyColor(level),
                    )}
                    onClick={() => setValue("difficulty", level as "easy" | "medium" | "hard")}
                    aria-pressed={difficulty === level}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-base font-semibold mb-2">Available Credits</h3>
              <Progress value={(credits / 10) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                You have <span className="font-bold text-primary">{credits}</span> credits remaining.
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
              transition={{ delay: 0.6 }}
            >
              <PlanAwareButton
                label="Generate Flashcards"
                onClick={handleSubmit(onSubmit)}
                isLoggedIn={isLoggedIn}
                isEnabled={!isDisabled}
                isLoading={isLoading}
                hasCredits={credits > 0}
                loadingLabel="Generating Flashcards..."
                className="w-full h-12 text-base font-medium transition-all duration-300 hover:shadow-lg"
                customStates={{
                  default: {
                    tooltip: "Click to generate your flashcards",
                  },
                  notEnabled: {
                    label: "Enter a topic to generate",
                    tooltip: "Please enter a topic before generating flashcards",
                  },
                  noCredits: {
                    label: "Out of credits",
                    tooltip: "You need credits to generate flashcards. Consider upgrading your plan.",
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
        onCancel={() => {
          setIsConfirmDialogOpen(false)
          setIsLoading(false)
        }}
      />
    </motion.div>
  )
}
